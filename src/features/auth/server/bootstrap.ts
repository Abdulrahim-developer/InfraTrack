import { createServerFn } from '@tanstack/react-start'
import { setCookie } from '@tanstack/react-start/server'
import argon2 from 'argon2'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema/users'
import { roles } from '#/db/schema/roles'
import { userRoles } from '#/db/schema/user-roles'
import { sessions } from '#/db/schema/sessions'

const SESSION_COOKIE = 'infratrack_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7

type BootstrapInput = {
  setupKey: string
  fullName: string
  email: string
  password: string
}

function validateBootstrapInput(data: unknown): BootstrapInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request')
  }

  const input = data as Record<string, unknown>

  if (
    typeof input.setupKey !== 'string' ||
    typeof input.fullName !== 'string' ||
    typeof input.email !== 'string' ||
    typeof input.password !== 'string'
  ) {
    throw new Error('All fields are required')
  }

  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()

  if (!fullName || fullName.length > 120) {
    throw new Error('Enter a valid full name')
  }

  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address')
  }

  if (input.password.length < 12 || input.password.length > 128) {
    throw new Error('Password must contain 12 to 128 characters')
  }

  if (!input.setupKey.trim()) {
    throw new Error('Setup authorization is required')
  }

  return {
    setupKey: input.setupKey,
    fullName,
    email,
    password: input.password,
  }
}

function verifySetupKey(providedKey: string, expectedKey: string) {
  const provided = Buffer.from(providedKey)
  const expected = Buffer.from(expectedKey)

  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export const bootstrapAdministrator = createServerFn({
  method: 'POST',
})
  .validator(validateBootstrapInput)
  .handler(async ({ data }) => {
    const expectedKey = process.env.INITIAL_ADMIN_SETUP_KEY

    if (!expectedKey) {
      throw new Error('Administrator setup is not configured')
    }

    if (!verifySetupKey(data.setupKey, expectedKey)) {
      throw new Error('Invalid setup authorization')
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
    })

    const rawSessionToken = randomBytes(32).toString('hex')

    const tokenHash = createHash('sha256').update(rawSessionToken).digest('hex')

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000)

    await db.transaction(async (tx) => {
      // Prevent two simultaneous first-admin setup requests.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(2147483000, 101)`)

      const existingUsers = await tx.select({ userId: users.userId }).from(users).limit(1)

      if (existingUsers.length > 0) {
        throw new Error('Administrator setup has already been completed')
      }

      const [adminRole] = await tx
        .select({ roleId: roles.roleId })
        .from(roles)
        .where(eq(roles.roleName, 'ADMINISTRATOR'))
        .limit(1)

      if (!adminRole) {
        throw new Error('Administrator role is missing')
      }

      const [newUser] = await tx
        .insert(users)
        .values({
          fullName: data.fullName,
          email: data.email,
          passwordHash,
          accountStatus: 'ACTIVE',
        })
        .returning({ userId: users.userId })

      if (!newUser) {
        throw new Error('Could not create administrator')
      }

      await tx.insert(userRoles).values({
        userId: newUser.userId,
        roleId: adminRole.roleId,
        assignedBy: null,
      })

      await tx.insert(sessions).values({
        userId: newUser.userId,
        tokenHash,
        expiresAt,
      })
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
      message: 'Administrator account created successfully',
    }
  })
