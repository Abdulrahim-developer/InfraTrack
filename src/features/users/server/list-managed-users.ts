import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

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

export const listManagedUsers = createServerFn({
  method: 'GET',
}).handler(async () => {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error('Authentication required')
  }

  if (currentUser.role !== 'ADMINISTRATOR') {
    throw new Error('You are not authorized to manage users')
  }

  const records = await db
    .select({
      userId: users.userId,
      fullName: users.fullName,
      email: users.email,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
      roleName: roles.roleName,
    })
    .from(users)
    .innerJoin(userRoles, eq(users.userId, userRoles.userId))
    .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
    .orderBy(desc(users.createdAt))

  const managedUsers = records.map((record) => {
    const role = roleLabels[record.roleName]

    if (!role) {
      throw new Error(`Unknown role: ${record.roleName}`)
    }

    return {
      id: record.userId,
      name: record.fullName,
      email: record.email,
      role,
      status: record.accountStatus === 'ACTIVE' ? 'Active' : 'Deactivated',
      createdAt: record.createdAt.toISOString().slice(0, 10),
    }
  })

  return {
    success: true,
    data: managedUsers,
  }
})
