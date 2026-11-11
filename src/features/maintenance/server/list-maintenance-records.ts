import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, isNotNull, isNull, or } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { maintenanceRecords } from '#/db/schema/maintenance-records'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

type MaintenanceHistoryInput = {
  assetId?: string
}

function validateMaintenanceHistory(data: unknown): MaintenanceHistoryInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid maintenance history request')
  }

  const assetId = (data as Record<string, unknown>).assetId

  if (assetId === undefined) {
    return {}
  }

  if (
    typeof assetId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assetId)
  ) {
    throw new Error('Invalid asset ID')
  }

  return { assetId }
}

export const listMaintenanceRecords = createServerFn({
  method: 'GET',
})
  .validator(validateMaintenanceHistory)
  .handler(async ({ data }) => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Authentication required')
    }

    const allowedRoles = [
      'ADMINISTRATOR',
      'ASSET_MANAGER',
      'TECHNICIAN',
      'VIEWER_AUDITOR',
    ]

    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('You are not authorized to view maintenance records')
    }

    const technicianVisibility =
      currentUser.role === 'TECHNICIAN'
        ? or(
            eq(maintenanceRecords.performedBy, currentUser.userId),
            isNotNull(assetAssignments.assignmentId),
          )
        : undefined

    const records = await db
      .select({
        maintenanceId: maintenanceRecords.maintenanceId,
        assetId: maintenanceRecords.assetId,
        assetName: assets.assetName,
        assetType: assets.assetType,
        serialNumber: assets.serialNumber,
        performedBy: maintenanceRecords.performedBy,
        performedByName: users.fullName,
        performedByEmail: users.email,
        maintenanceType: maintenanceRecords.maintenanceType,
        description: maintenanceRecords.description,
        performedAt: maintenanceRecords.performedAt,
      })
      .from(maintenanceRecords)
      .innerJoin(assets, eq(maintenanceRecords.assetId, assets.assetId))
      .innerJoin(users, eq(maintenanceRecords.performedBy, users.userId))
      .leftJoin(
        assetAssignments,
        and(
          eq(assetAssignments.assetId, maintenanceRecords.assetId),
          eq(assetAssignments.userId, currentUser.userId),
          isNull(assetAssignments.returnedAt),
        ),
      )
      .where(
        and(
          data.assetId ? eq(maintenanceRecords.assetId, data.assetId) : undefined,
          technicianVisibility,
        ),
      )
      .orderBy(desc(maintenanceRecords.performedAt))

    return {
      success: true as const,
      data: records.map((record) => ({
        ...record,
        performedAt: record.performedAt.toISOString(),
      })),
    }
  })
