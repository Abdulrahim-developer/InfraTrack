import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { assets } from '#/db/schema/assets'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

export const listAssignments = createServerFn({
  method: 'GET',
}).handler(async () => {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('Authentication required')
  }

  const allowedRoles = ['ADMINISTRATOR', 'ASSET_MANAGER', 'TECHNICIAN', 'VIEWER_AUDITOR']

  if (!allowedRoles.includes(currentUser.role)) {
    throw new Error('You are not authorized to view assignments')
  }

  // Technicians can view assignments linked to their own account.
  // Other authorized roles can view the assignment records.
  const visibilityCondition =
    currentUser.role === 'TECHNICIAN'
      ? eq(assetAssignments.userId, currentUser.userId)
      : undefined

  const records = await db
    .select({
      assignmentId: assetAssignments.assignmentId,
      assetId: assetAssignments.assetId,
      assignedToUserId: assetAssignments.userId,
      assignedToDepartment: assetAssignments.assignedToDepartment,
      assignedAt: assetAssignments.assignedAt,
      returnedAt: assetAssignments.returnedAt,

      assetName: assets.assetName,
      assetType: assets.assetType,
      serialNumber: assets.serialNumber,
      location: assets.location,
      assetStatus: assets.status,

      assignedUserName: users.fullName,
      assignedUserEmail: users.email,
    })
    .from(assetAssignments)
    .innerJoin(assets, eq(assetAssignments.assetId, assets.assetId))
    .leftJoin(users, eq(assetAssignments.userId, users.userId))
    .where(visibilityCondition)
    .orderBy(desc(assetAssignments.assignedAt))

  const data = records.map((record) => ({
    ...record,
    assignedAt: record.assignedAt.toISOString(),
    returnedAt: record.returnedAt?.toISOString() ?? null,
    assignmentStatus: record.returnedAt ? 'Returned' : 'Assigned',
    assignedTo:
      record.assignedUserName ?? record.assignedToDepartment ?? 'Unknown recipient',
  }))

  return {
    success: true,
    data,
  }
})
