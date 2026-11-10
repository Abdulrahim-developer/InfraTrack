import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { assetAuditLogs } from '#/db/schema/asset-audit-logs'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

type CreateAssignmentInput = {
  assetId: string
  recipientType: 'user' | 'department'
  userId?: string
  departmentName?: string
  assignmentDate: string
}

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateCreateAssignment(data: unknown): CreateAssignmentInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid assignment request')
  }

  const input = data as Record<string, unknown>

  if (!isValidUuid(input.assetId)) {
    throw new Error('Invalid asset ID')
  }

  if (input.recipientType !== 'user' && input.recipientType !== 'department') {
    throw new Error('Invalid recipient type')
  }

  if (!isValidDate(input.assignmentDate)) {
    throw new Error('Please provide a valid assignment date')
  }

  if (input.recipientType === 'user') {
    if (!isValidUuid(input.userId)) {
      throw new Error('Please select a valid user')
    }

    return {
      assetId: input.assetId,
      recipientType: 'user',
      userId: input.userId,
      assignmentDate: input.assignmentDate,
    }
  }

  if (
    typeof input.departmentName !== 'string' ||
    !input.departmentName.trim() ||
    input.departmentName.trim().length > 120
  ) {
    throw new Error('Please provide a valid department name')
  }

  return {
    assetId: input.assetId,
    recipientType: 'department',
    departmentName: input.departmentName.trim(),
    assignmentDate: input.assignmentDate,
  }
}

export const createAssignment = createServerFn({
  method: 'POST',
})
  .validator(validateCreateAssignment)
  .handler(async ({ data }) => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Authentication required')
    }

    if (!['ADMINISTRATOR', 'ASSET_MANAGER'].includes(currentUser.role)) {
      throw new Error('You are not authorized to create assignments')
    }

    return await db.transaction(async (tx) => {
      // Lock the asset so concurrent assignment requests cannot
      // assign the same asset simultaneously.
      const [asset] = await tx
        .select({
          assetId: assets.assetId,
          assetName: assets.assetName,
          status: assets.status,
        })
        .from(assets)
        .where(eq(assets.assetId, data.assetId))
        .limit(1)
        .for('update')

      if (!asset) {
        throw new Error('Asset not found')
      }

      if (asset.status !== 'Active') {
        throw new Error('Only active assets can be assigned')
      }

      // Check whether the asset already has an active assignment.
      const [activeAssignment] = await tx
        .select({
          assignmentId: assetAssignments.assignmentId,
        })
        .from(assetAssignments)
        .where(
          and(
            eq(assetAssignments.assetId, data.assetId),
            isNull(assetAssignments.returnedAt),
          ),
        )
        .limit(1)

      if (activeAssignment) {
        throw new Error(
          'This asset is already assigned. Return its current assignment before assigning it again.',
        )
      }

      let assignedUserId: string | null = null
      let assignedToDepartment: string | null = null
      let recipientName: string

      if (data.recipientType === 'user') {
        const [recipient] = await tx
          .select({
            userId: users.userId,
            fullName: users.fullName,
          })
          .from(users)
          .where(and(eq(users.userId, data.userId!), eq(users.accountStatus, 'ACTIVE')))
          .limit(1)

        if (!recipient) {
          throw new Error('Selected user is not an active account')
        }

        assignedUserId = recipient.userId
        recipientName = recipient.fullName
      } else {
        assignedToDepartment = data.departmentName!
        recipientName = data.departmentName!
      }

      const assignedAt = new Date(`${data.assignmentDate}T00:00:00.000Z`)

      const [newAssignment] = await tx
        .insert(assetAssignments)
        .values({
          assetId: data.assetId,
          userId: assignedUserId,
          assignedToDepartment,
          assignedAt,
          returnedAt: null,
        })
        .returning({
          assignmentId: assetAssignments.assignmentId,
          assetId: assetAssignments.assetId,
          userId: assetAssignments.userId,
          assignedToDepartment: assetAssignments.assignedToDepartment,
          assignedAt: assetAssignments.assignedAt,
          returnedAt: assetAssignments.returnedAt,
        })

      if (!newAssignment) {
        throw new Error('Unable to create the assignment')
      }

      await tx.insert(assetAuditLogs).values({
        assetId: data.assetId,
        actorUserId: currentUser.userId,
        action: 'asset assigned',
        details: `Asset "${asset.assetName}" assigned to ${recipientName}.`,
      })

      return {
        success: true as const,
        message: 'Assignment created successfully',
        data: {
          ...newAssignment,
          assignedAt: newAssignment.assignedAt.toISOString(),
          returnedAt: newAssignment.returnedAt?.toISOString() ?? null,
        },
      }
    })
  })
