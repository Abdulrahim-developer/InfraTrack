import { createServerFn } from '@tanstack/react-start'
import { aliasedTable, eq, inArray, sql } from 'drizzle-orm'

import { db } from '#/db'
import { assetAuditLogs } from '#/db/schema/asset-audit-logs'
import { userAuditLogs } from '#/db/schema/user-audit-logs'
import { assets } from '#/db/schema/assets'
import { users } from '#/db/schema/users'
import { userRoles } from '#/db/schema/user-roles'
import { roles } from '#/db/schema/roles'
import { getCurrentUser } from '#/features/auth/server/session'

export const listAuditLogs = createServerFn({
  method: 'GET',
}).handler(async () => {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('Authentication required')
  }

  const allowedRoles = ['ADMINISTRATOR', 'VIEWER_AUDITOR']

  if (!allowedRoles.includes(currentUser.role)) {
    throw new Error('You are not authorized to view audit logs')
  }

  const targetUsers = aliasedTable(users, 'target_users')

  const [assetLogs, userLogs] = await Promise.all([
    db
      .select({
        id: assetAuditLogs.auditId,
        category: sql<'Asset'>`'Asset'`,
        action: assetAuditLogs.action,
        actorUserId: users.userId,
        actorName: users.fullName,
        actorEmail: users.email,
        actorRole: sql<string>`'Unknown'`,
        targetUserId: sql<string | null>`null`,
        targetUserName: sql<string | null>`null`,
        targetUserEmail: sql<string | null>`null`,
        targetUserRole: sql<string | null>`null`,
        targetAssetName: assets.assetName,
        details: assetAuditLogs.details,
        timestamp: assetAuditLogs.createdAt,
      })
      .from(assetAuditLogs)
      .innerJoin(users, eq(assetAuditLogs.actorUserId, users.userId))
      .innerJoin(assets, eq(assetAuditLogs.assetId, assets.assetId)),

    db
      .select({
        id: userAuditLogs.auditId,
        category: sql<'User'>`'User'`,
        action: userAuditLogs.action,
        actorUserId: users.userId,
        actorName: users.fullName,
        actorEmail: users.email,
        actorRole: sql<string>`'Unknown'`,
        targetUserId: targetUsers.userId,
        targetUserName: targetUsers.fullName,
        targetUserEmail: targetUsers.email,
        targetUserRole: sql<string | null>`'Unknown'`,
        targetAssetName: sql<string | null>`null`,
        details: userAuditLogs.details,
        timestamp: userAuditLogs.createdAt,
      })
      .from(userAuditLogs)
      .innerJoin(users, eq(userAuditLogs.actorUserId, users.userId))
      .leftJoin(targetUsers, eq(userAuditLogs.targetUserId, targetUsers.userId)),
  ])

  const logs = [...assetLogs, ...userLogs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  )

  const involvedUserIds = [
    ...new Set(
      logs.flatMap((log) =>
        log.targetUserId ? [log.actorUserId, log.targetUserId] : [log.actorUserId],
      ),
    ),
  ]

  const userRoleRecords =
    involvedUserIds.length > 0
      ? await db
          .select({
            userId: userRoles.userId,
            roleName: roles.roleName,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
          .where(inArray(userRoles.userId, involvedUserIds))
      : []

  const roleByUserId = new Map(
    userRoleRecords.map((record) => [record.userId, record.roleName]),
  )

  return logs.map((log) => ({
    ...log,
    actorRole: roleByUserId.get(log.actorUserId) ?? 'Unknown',
    targetUserRole: log.targetUserId
      ? (roleByUserId.get(log.targetUserId) ?? 'Unknown')
      : null,
    details: log.details ?? '',
    timestamp: log.timestamp.toISOString(),
  }))
})
