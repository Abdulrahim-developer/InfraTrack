import { createServerFn } from '@tanstack/react-start'
import argon2 from 'argon2'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

function validateInput(data: unknown): ChangePasswordInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid password change request')
  }

  const input = data as Record<string, unknown>

  if (
    typeof input.currentPassword !== 'string' ||
    typeof input.newPassword !== 'string'
  ) {
    throw new Error('Current password and new password are required')
  }

  if (input.currentPassword.length === 0 || input.currentPassword.length > 128) {
    throw new Error('Invalid current password')
  }

  if (input.newPassword.length < 8 || input.newPassword.length > 128) {
    throw new Error('New password must be between 8 and 128 characters')
  }

  return {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  }
}

export const changePassword = createServerFn({
  method: 'POST',
})
  .validator(validateInput)
  .handler(async ({ data }) => {
    const authenticatedUser = await getCurrentUser()

    if (!authenticatedUser) {
      throw new Error('You must be signed in to change your password')
    }

    const [user] = await db
      .select({
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.userId, authenticatedUser.userId))
      .limit(1)

    if (!user) {
      throw new Error('User account could not be found')
    }

    const passwordMatches = await argon2.verify(user.passwordHash, data.currentPassword)

    if (!passwordMatches) {
      throw new Error('Current password is incorrect')
    }

    const samePassword = await argon2.verify(user.passwordHash, data.newPassword)

    if (samePassword) {
      throw new Error('Your new password must be different from your current password')
    }

    const newPasswordHash = await argon2.hash(data.newPassword, {
      type: argon2.argon2id,
    })

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.userId, authenticatedUser.userId))

    return { success: true }
  })
