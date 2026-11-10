import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema/users'
import { userRoles } from '#/db/schema/user-roles'
import { roles } from '#/db/schema/roles'
import { getCurrentUser } from '#/features/auth/server/session'

const roleLabels: Record<string, string> = {
  ADMINISTRATOR: 'Administrator',
  ASSET_MANAGER: 'Asset Manager',
  TECHNICIAN: 'Technician',
  VIEWER_AUDITOR: 'Viewer/Auditor',
}

export const listAssignmentUsers = createServerFn({
  method: 'GET',
}).handler(async () => {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('Authentication required')
  }

  if (!['ADMINISTRATOR', 'ASSET_MANAGER'].includes(currentUser.role)) {
    throw new Error('You are not authorized to view assignment recipients')
  }

  const records = await db
    .select({
      userId: users.userId,
      fullName: users.fullName,
      email: users.email,
      accountStatus: users.accountStatus,
      roleName: roles.roleName,
    })
    .from(users)
    .innerJoin(userRoles, eq(users.userId, userRoles.userId))
    .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
    .where(eq(users.accountStatus, 'ACTIVE'))
    .orderBy(asc(users.fullName))

  const userMap = new Map<
    string,
    {
      id: string
      name: string
      email: string
      accountStatus: string
      roles: string[]
    }
  >()

  for (const record of records) {
    const existingUser = userMap.get(record.userId)

    const roleLabel = roleLabels[record.roleName] ?? record.roleName

    if (existingUser) {
      if (!existingUser.roles.includes(roleLabel)) {
        existingUser.roles.push(roleLabel)
      }
    } else {
      userMap.set(record.userId, {
        id: record.userId,
        name: record.fullName,
        email: record.email,
        accountStatus: record.accountStatus,
        roles: [roleLabel],
      })
    }
  }

  return {
    success: true,
    data: Array.from(userMap.values()),
  }
})
