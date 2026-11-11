import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, setResponseHeaders } from '@tanstack/react-start/server'
import { createHash } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema/users'
import { sessions } from '#/db/schema/sessions'
import { userRoles } from '#/db/schema/user-roles'
import { roles } from '#/db/schema/roles'

const SESSION_COOKIE = 'infratrack_session'

async function findAuthenticatedUser() {
  const rawToken = getCookie(SESSION_COOKIE)

  if (!rawToken) {
    return null
  }

  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const [result] = await db
    .select({
      userId: users.userId,
      fullName: users.fullName,
      email: users.email,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
      role: roles.roleName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.userId))
    .innerJoin(userRoles, eq(userRoles.userId, users.userId))
    .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
        eq(users.accountStatus, 'ACTIVE'),
      ),
    )
    .limit(1)

  if (!result) {
    deleteCookie(SESSION_COOKIE, { path: '/' })
    return null
  }

  return result
}

export const getCurrentUser = createServerFn({
  method: 'GET',
}).handler(async () => {
  setResponseHeaders(
    new Headers({
      'Cache-Control': 'no-store',
    }),
  )

  return findAuthenticatedUser()
})

export const logout = createServerFn({
  method: 'POST',
}).handler(async () => {
  const rawToken = getCookie(SESSION_COOKIE)

  if (rawToken) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
  }

  deleteCookie(SESSION_COOKIE, { path: '/' })

  return { success: true }
})
