import { createServerFn } from '@tanstack/react-start'
import { setCookie } from '@tanstack/react-start/server'
import argon2 from 'argon2'
import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema/users'
import { userRoles } from '#/db/schema/user-roles'
import { roles } from '#/db/schema/roles'
import { sessions } from '#/db/schema/sessions'

const SESSION_COOKIE = 'infratrack_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

type LoginInput = {
  email: string
  password: string
}

function validateLoginInput(data: unknown): LoginInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid login request')
  }

  const input = data as Record<string, unknown>

  if (typeof input.email !== 'string' || typeof input.password !== 'string') {
    throw new Error('Email and password are required')
  }

  const email = input.email.trim().toLowerCase()

  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address')
  }

  if (!input.password || input.password.length > 128) {
    throw new Error('Invalid email or password')
  }

  return {
    email,
    password: input.password,
  }
}

export const login = createServerFn({
  method: 'POST',
})
  .validator(validateLoginInput)
  .handler(async ({ data }) => {
    const [user] = await db
      .select({
        userId: users.userId,
        passwordHash: users.passwordHash,
        accountStatus: users.accountStatus,
      })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new Error('Invalid email or password')
    }

    const passwordMatches = await argon2.verify(user.passwordHash, data.password)

    if (!passwordMatches) {
      throw new Error('Invalid email or password')
    }

    const [userRole] = await db
      .select({
        roleName: roles.roleName,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.roleId))
      .where(eq(userRoles.userId, user.userId))
      .limit(1)

    if (!userRole) {
      throw new Error('Your account has no assigned role')
    }

    const rawSessionToken = randomBytes(32).toString('hex')

    const tokenHash = createHash('sha256').update(rawSessionToken).digest('hex')

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)

    await db.insert(sessions).values({
      userId: user.userId,
      tokenHash,
      expiresAt,
    })

    setCookie(SESSION_COOKIE, rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    })

    return {
      success: true,
      role: userRole.roleName,
    }
  })
