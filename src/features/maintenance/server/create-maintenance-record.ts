import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { assetAuditLogs } from '#/db/schema/asset-audit-logs'
import { maintenanceRecords } from '#/db/schema/maintenance-records'
import { users } from '#/db/schema/users'
import { userRoles } from '#/db/schema/user-roles'
import { roles } from '#/db/schema/roles'
import { getCurrentUser } from '#/features/auth/server/session'

type CreateMaintenanceRecordInput = {
  assetId: string
  performedBy?: string
  maintenanceType: string
  description: string
  performedAt: string
}

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

function isValidDateTime(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    return false
  }

  return !Number.isNaN(new Date(value).getTime())
}

function validateCreateMaintenanceRecord(data: unknown): CreateMaintenanceRecordInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid maintenance record request')
  }

  const input = data as Record<string, unknown>

  if (!isValidUuid(input.assetId)) {
    throw new Error('Invalid asset ID')
  }

  if (input.performedBy !== undefined && !isValidUuid(input.performedBy)) {
    throw new Error('Invalid Technician ID')
  }

  if (
    typeof input.maintenanceType !== 'string' ||
    !input.maintenanceType.trim() ||
    input.maintenanceType.trim().length > 60
  ) {
    throw new Error('Please provide a valid maintenance type')
  }

  if (
    typeof input.description !== 'string' ||
    !input.description.trim() ||
    input.description.trim().length > 1000
  ) {
    throw new Error('Please provide a valid description')
  }

  if (!isValidDateTime(input.performedAt)) {
    throw new Error('Please provide a valid maintenance date and time')
  }

  return {
    assetId: input.assetId,
    performedBy: input.performedBy as string | undefined,
    maintenanceType: input.maintenanceType.trim(),
    description: input.description.trim(),
    performedAt: input.performedAt,
  }
}

export const createMaintenanceRecord = createServerFn({
  method: 'POST',
})
  .validator(validateCreateMaintenanceRecord)
  .handler(async ({ data }) => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Authentication required')
    }

    const allowedRoles = ['ADMINISTRATOR', 'ASSET_MANAGER', 'TECHNICIAN']

    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('You are not authorized to create maintenance records')
    }

    // Technicians are automatically recorded as the performer.
    if (
      currentUser.role === 'TECHNICIAN' &&
      data.performedBy !== undefined &&
      data.performedBy !== currentUser.userId
    ) {
      throw new Error('You can only record maintenance under your own account')
    }

    // Managers must explicitly select a Technician.
    if (currentUser.role !== 'TECHNICIAN' && !data.performedBy) {
      throw new Error('Please select a Technician')
    }

    const performerId =
      currentUser.role === 'TECHNICIAN' ? currentUser.userId : data.performedBy!

    return await db.transaction(async (tx) => {
      const [asset] = await tx
        .select({
          assetId: assets.assetId,
          assetName: assets.assetName,
        })
        .from(assets)
        .where(eq(assets.assetId, data.assetId))
        .limit(1)
        .for('update')

      if (!asset) {
        throw new Error('Asset not found')
      }

      if (currentUser.role === 'TECHNICIAN') {
        const [activeAssignment] = await tx
          .select({
            assignmentId: assetAssignments.assignmentId,
          })
          .from(assetAssignments)
          .where(
            and(
              eq(assetAssignments.assetId, data.assetId),
              eq(assetAssignments.userId, currentUser.userId),
              isNull(assetAssignments.returnedAt),
            ),
          )
          .limit(1)

        if (!activeAssignment) {
          throw new Error(
            'You can only record maintenance for assets currently assigned to you',
          )
        }
      }

      const [performer] = await tx
        .select({
          userId: users.userId,
        })
        .from(users)
        .innerJoin(userRoles, eq(users.userId, userRoles.userId))
        .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
        .where(
          and(
            eq(users.userId, performerId),
            eq(users.accountStatus, 'ACTIVE'),
            eq(roles.roleName, 'TECHNICIAN'),
          ),
        )
        .limit(1)

      if (!performer) {
        throw new Error('The selected performer must be an active Technician')
      }

      const [newRecord] = await tx
        .insert(maintenanceRecords)
        .values({
          assetId: data.assetId,
          performedBy: performer.userId,
          maintenanceType: data.maintenanceType,
          description: data.description,
          performedAt: new Date(data.performedAt),
        })
        .returning()

      if (!newRecord) {
        throw new Error('Unable to create the maintenance record')
      }

      await tx.insert(assetAuditLogs).values({
        assetId: data.assetId,
        actorUserId: currentUser.userId,
        action: 'maintenance recorded',
        details: `Maintenance "${data.maintenanceType}" recorded for asset "${asset.assetName}".`,
      })

      return {
        success: true as const,
        message: 'Maintenance record created successfully',
        data: {
          ...newRecord,
          performedAt: newRecord.performedAt.toISOString(),
        },
      }
    })
  })
