
import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '#/db'
import { userInvitations } from '#/db/schema/user-invitations'
import { roles } from '#/db/schema/roles'

const tokenSchema = z.object({
  token: z.string().min(1).max(128),
})

const roleLabels: Record<string, string> = {
  ADMINISTRATOR: 'Administrator',
  ASSET_MANAGER: 'Asset Manager',
  TECHNICIAN: 'Technician',
  VIEWER_AUDITOR: 'Viewer/Auditor',
}

export const validateUserInvitation = createServerFn({
  method: 'GET',
})
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const tokenHash = createHash('sha256')
      .update(data.token)
      .digest('hex')

    const [invitation] = await db
      .select({
        email: userInvitations.email,
        expiresAt: userInvitations.expiresAt,
        acceptedAt: userInvitations.acceptedAt,
        revokedAt: userInvitations.revokedAt,
        roleName: roles.roleName,
      })
      .from(userInvitations)
      .innerJoin(
        roles,
        eq(userInvitations.roleId, roles.roleId),
      )
      .where(eq(userInvitations.tokenHash, tokenHash))
      .limit(1)

    if (!invitation) {
      return {
        valid: false,
        message: 'Invalid invitation link.',
      }
    }

    if (invitation.acceptedAt) {
      return {
        valid: false,
        message: 'This invitation has already been used.',
      }
    }

    if (invitation.revokedAt) {
      return {
        valid: false,
        message: 'This invitation has been revoked.',
      }
    }

    if (invitation.expiresAt <= new Date()) {
      return {
        valid: false,
        message: 'This invitation has expired.',
      }
    }

    return {
      valid: true,
      email: invitation.email,
      role: roleLabels[invitation.roleName] ?? invitation.roleName,
      expiresAt: invitation.expiresAt.toISOString(),
    }
  })
