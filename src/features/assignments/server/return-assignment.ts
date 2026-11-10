import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { assetAuditLogs } from '#/db/schema/asset-audit-logs'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

type ReturnAssignmentInput = {
  assignmentId: string
}

function validateReturnAssignment(data: unknown): ReturnAssignmentInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid return request')
  }

  const input = data as Record<string, unknown>

  if (
    typeof input.assignmentId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.assignmentId,
    )
  ) {
    throw new Error('Invalid assignment ID')
  }

  return {
    assignmentId: input.assignmentId,
  }
}

export const returnAssignment = createServerFn({
  method: 'POST',
})
  .validator(validateReturnAssignment)
  .handler(async ({ data }) => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Authentication required')
    }

    if (!['ADMINISTRATOR', 'ASSET_MANAGER'].includes(currentUser.role)) {
      throw new Error('You are not authorized to return assets')
    }

    return await db.transaction(async (tx) => {
      // Find the asset associated with this assignment.
      const [existingAssignment] = await tx
        .select({
          assetId: assetAssignments.assetId,
        })
        .from(assetAssignments)
        .where(eq(assetAssignments.assignmentId, data.assignmentId))
        .limit(1)

      if (!existingAssignment) {
        throw new Error('Assignment not found')
      }

      // Lock the asset row to coordinate with assignment and
      // retirement operations.
      const [asset] = await tx
        .select({
          assetId: assets.assetId,
          assetName: assets.assetName,
        })
        .from(assets)
        .where(eq(assets.assetId, existingAssignment.assetId))
        .limit(1)
        .for('update')

      if (!asset) {
        throw new Error('Asset not found')
      }

      // Recheck and lock the active assignment.
      const [activeAssignment] = await tx
        .select({
          assignmentId: assetAssignments.assignmentId,
          assignedToUserId: assetAssignments.userId,
          assignedToDepartment: assetAssignments.assignedToDepartment,
        })
        .from(assetAssignments)
        .where(
          and(
            eq(assetAssignments.assignmentId, data.assignmentId),
            eq(assetAssignments.assetId, asset.assetId),
            isNull(assetAssignments.returnedAt),
          ),
        )
        .limit(1)
        .for('update')

      if (!activeAssignment) {
        throw new Error('This assignment has already been returned or does not exist')
      }

      // Retrieve the recipient's email separately to avoid
      // the PostgreSQL FOR UPDATE and LEFT JOIN conflict.
      let recipientName: string

      if (activeAssignment.assignedToUserId) {
        const [assignedUser] = await tx
          .select({
            email: users.email,
          })
          .from(users)
          .where(eq(users.userId, activeAssignment.assignedToUserId))
          .limit(1)

        recipientName = assignedUser?.email ?? 'Unknown user'
      } else {
        recipientName = activeAssignment.assignedToDepartment ?? 'Unknown department'
      }

      const returnedAt = new Date()

      const [updatedAssignment] = await tx
        .update(assetAssignments)
        .set({
          returnedAt,
        })
        .where(
          and(
            eq(assetAssignments.assignmentId, data.assignmentId),
            isNull(assetAssignments.returnedAt),
          ),
        )
        .returning({
          assignmentId: assetAssignments.assignmentId,
          returnedAt: assetAssignments.returnedAt,
        })

      if (!updatedAssignment) {
        throw new Error('Unable to process the asset return')
      }

      await tx.insert(assetAuditLogs).values({
        assetId: asset.assetId,
        actorUserId: currentUser.userId,
        action: 'asset returned',
        details: `Asset "${asset.assetName}" returned from ${recipientName}.`,
      })

      return {
        success: true as const,
        message: 'Asset returned successfully',
        data: {
          assignmentId: updatedAssignment.assignmentId,
          returnedAt: updatedAssignment.returnedAt!.toISOString(),
        },
      }
    })
  })
