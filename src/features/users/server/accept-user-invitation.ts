import { createHash } from 'node:crypto'
import argon2 from 'argon2'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db'
import { userAuditLogs } from '#/db/schema/user-audit-logs'
import { users } from '#/db/schema/users'
import { userRoles } from '#/db/schema/user-roles'
import { userInvitations } from '#/db/schema/user-invitations'

const acceptanceSchema = z
  .object({
    token: z.string().min(1).max(128),
    fullName: z.string().trim().min(1, 'Enter your full name').max(120),
    password: z.string().min(8, 'Password must contain at least 8 characters').max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const acceptUserInvitation = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => acceptanceSchema.parse(data))
  .handler(async ({ data }) => {
    const tokenHash = createHash('sha256').update(data.token).digest('hex')

    const now = new Date()

    try {
      await db.transaction(async (tx) => {
        const [invitation] = await tx
          .select()
          .from(userInvitations)
          .where(
            and(
              eq(userInvitations.tokenHash, tokenHash),
              isNull(userInvitations.acceptedAt),
              isNull(userInvitations.revokedAt),
              gt(userInvitations.expiresAt, now),
            ),
          )
          .limit(1)
          .for('update')

        if (!invitation) {
          throw new Error(
            'This invitation is invalid, expired, revoked, or already used.',
          )
        }

        const existingUser = await tx
          .select({ userId: users.userId })
          .from(users)
          .where(sql`lower(${users.email}) = ${invitation.email.toLowerCase()}`)
          .limit(1)

        if (existingUser.length > 0) {
          throw new Error('An account with this email already exists.')
        }

        const passwordHash = await argon2.hash(data.password, {
          type: argon2.argon2id,
        })

        const [newUser] = await tx
          .insert(users)
          .values({
            fullName: data.fullName,
            email: invitation.email.toLowerCase(),
            passwordHash,
            emailVerifiedAt: now,
            accountStatus: 'ACTIVE',
          })
          .returning({
            userId: users.userId,
          })

        await tx.insert(userRoles).values({
          userId: newUser.userId,
          roleId: invitation.roleId,
          assignedBy: invitation.invitedBy,
        })

        await tx
          .update(userInvitations)
          .set({ acceptedAt: now })
          .where(eq(userInvitations.invitationId, invitation.invitationId))

        await tx.insert(userAuditLogs).values({
          actorUserId: newUser.userId,
          targetUserId: newUser.userId,
          action: 'Invitation Accepted',
          details: 'User accepted the invitation and activated their account.',
        })
      })

      return {
        success: true,
        message: 'Your account has been created successfully. Please sign in.',
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      throw new Error('Unable to create your account. Please try again.')
    }
  })
