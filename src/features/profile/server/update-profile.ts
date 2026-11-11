import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

type UpdateProfileInput = {
  fullName: string
}

function validateInput(data: unknown): UpdateProfileInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid profile update request')
  }

  const input = data as Record<string, unknown>

  if (typeof input.fullName !== 'string') {
    throw new Error('Full name is required')
  }

  const fullName = input.fullName.trim()

  if (!fullName || fullName.length > 120) {
    throw new Error('Full name must be between 1 and 120 characters')
  }

  return { fullName }
}

export const updateProfile = createServerFn({
  method: 'POST',
})
  .validator(validateInput)
  .handler(async ({ data }) => {
    const authenticatedUser = await getCurrentUser()

    if (!authenticatedUser) {
      throw new Error('You must be signed in to update your profile')
    }

    await db
      .update(users)
      .set({
        fullName: data.fullName,
        updatedAt: new Date(),
      })
      .where(eq(users.userId, authenticatedUser.userId))

    return {
      success: true,
      fullName: data.fullName,
    }
  })
