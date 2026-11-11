
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { assetAuditLogs } from '#/db/schema/asset-audit-logs'
import { maintenanceRecords } from '#/db/schema/maintenance-records'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

const activityLabels: Record<
  string,
  'Assigned' | 'Registered' | 'Maintenance' | 'Updated' | 'Returned'
> = {
  'asset assigned': 'Assigned',
  'asset registered': 'Registered',
  'maintenance recorded': 'Maintenance',
  'status changed': 'Updated',
  'asset returned': 'Returned',
}

export const getDashboardData = createServerFn({
  method: 'GET',
}).handler(async () => {
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
    throw new Error('You are not authorized to view dashboard data')
  }

  const isTechnician = currentUser.role === 'TECHNICIAN'

  const technicianAssetIds = db
    .select({
      assetId: assetAssignments.assetId,
    })
    .from(assetAssignments)
    .where(
      and(
        eq(assetAssignments.userId, currentUser.userId),
        isNull(assetAssignments.returnedAt),
      ),
    )

  const assetVisibility = isTechnician
    ? inArray(assets.assetId, technicianAssetIds)
    : undefined

  const assignmentVisibility = isTechnician
    ? eq(assetAssignments.userId, currentUser.userId)
    : undefined

  const maintenanceVisibility = isTechnician
    ? or(
        eq(maintenanceRecords.performedBy, currentUser.userId),
        inArray(maintenanceRecords.assetId, technicianAssetIds),
      )
    : undefined

  const auditVisibility = isTechnician
    ? inArray(assetAuditLogs.assetId, technicianAssetIds)
    : undefined

  const [assetRecords, assignmentRecords, maintenanceRecordsResult, auditRecords] =
    await Promise.all([
      db
        .select({
          id: assets.assetId,
          name: assets.assetName,
          type: assets.assetType,
          serialNumber: assets.serialNumber,
          status: assets.status,
          location: assets.location,
          createdAt: assets.createdAt,
          assignedToUserId: assetAssignments.userId,
          assignedToUserName: users.fullName,
          assignedToDepartment: assetAssignments.assignedToDepartment,
        })
        .from(assets)
        .leftJoin(
          assetAssignments,
          and(
            eq(assetAssignments.assetId, assets.assetId),
            isNull(assetAssignments.returnedAt),
          ),
        )
        .leftJoin(users, eq(users.userId, assetAssignments.userId))
        .where(assetVisibility)
        .orderBy(desc(assets.createdAt)),

      db
        .select({
          id: assetAssignments.assignmentId,
          assetId: assetAssignments.assetId,
          assignedToUserId: assetAssignments.userId,
          assignedToUserName: users.fullName,
          assignedToDepartment: assetAssignments.assignedToDepartment,
          assignedAt: assetAssignments.assignedAt,
          returnedAt: assetAssignments.returnedAt,
        })
        .from(assetAssignments)
        .leftJoin(users, eq(users.userId, assetAssignments.userId))
        .where(assignmentVisibility)
        .orderBy(desc(assetAssignments.assignedAt)),

      db
        .select({
          id: maintenanceRecords.maintenanceId,
          assetId: maintenanceRecords.assetId,
          performedBy: maintenanceRecords.performedBy,
          performedByName: users.fullName,
          maintenanceType: maintenanceRecords.maintenanceType,
          description: maintenanceRecords.description,
          performedAt: maintenanceRecords.performedAt,
        })
        .from(maintenanceRecords)
        .leftJoin(users, eq(users.userId, maintenanceRecords.performedBy))
        .where(maintenanceVisibility)
        .orderBy(desc(maintenanceRecords.performedAt)),

      db
        .select({
          id: assetAuditLogs.auditId,
          action: assetAuditLogs.action,
          assetId: assets.assetId,
          assetName: assets.assetName,
          actorUserId: users.userId,
          actorName: users.fullName,
          details: assetAuditLogs.details,
          timestamp: assetAuditLogs.createdAt,
        })
        .from(assetAuditLogs)
        .innerJoin(assets, eq(assetAuditLogs.assetId, assets.assetId))
        .innerJoin(users, eq(assetAuditLogs.actorUserId, users.userId))
        .where(auditVisibility)
        .orderBy(desc(assetAuditLogs.createdAt))
        .limit(10),
    ])

  const dashboardAssets = assetRecords.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    serialNumber: asset.serialNumber ?? '',
    status: asset.status as 'Active' | 'Maintenance' | 'In Storage' | 'Retired',
    location: asset.location ?? 'Not specified',
    createdAt: asset.createdAt.toISOString(),
    assignedTo: asset.assignedToUserName ?? asset.assignedToDepartment ?? null,
  }))

  const dashboardAssignments = assignmentRecords.map((assignment) => ({
    id: assignment.id,
    assetId: assignment.assetId,
    assignedToUserId: assignment.assignedToUserId,
    assignedToUserName: assignment.assignedToUserName,
    assignedToDepartment: assignment.assignedToDepartment,
    assignedAt: assignment.assignedAt.toISOString(),
    returnedAt: assignment.returnedAt?.toISOString() ?? null,
  }))

  const dashboardMaintenanceRecords = maintenanceRecordsResult.map((record) => ({
    id: record.id,
    assetId: record.assetId,
    performedBy: record.performedBy,
    performedByName: record.performedByName,
    maintenanceType: record.maintenanceType,
    description: record.description,
    performedAt: record.performedAt.toISOString(),
  }))

  const dashboardActivities = auditRecords.flatMap((record) => {
    const action = activityLabels[record.action.toLowerCase()]

    if (!action) {
      return []
    }

    return [
      {
        id: record.id,
        action,
        assetName: record.assetName,
        assetReferenceId: record.assetId.slice(0, 8).toUpperCase(),
        details: record.details ?? '',
        timestamp: record.timestamp.toISOString(),
        performedBy: record.actorName,
        performedByUserId: record.actorUserId,
      },
    ]
  })

  return {
    success: true,
    data: {
      currentUserId: currentUser.userId,
      assets: dashboardAssets,
      assignments: dashboardAssignments,
      maintenanceRecords: dashboardMaintenanceRecords,
      activities: dashboardActivities,
    },
  }
})
