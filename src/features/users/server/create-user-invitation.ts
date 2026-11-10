import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { Resend } from 'resend'
import { z } from 'zod'

import { db } from '#/db'
import { roles } from '#/db/schema/roles'
import { users } from '#/db/schema/users'
import { userInvitations } from '#/db/schema/user-invitations'
import { getCurrentUser } from '#/features/auth/server/session'

const invitationSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(255),
  roleName: z.enum(['ADMINISTRATOR', 'ASSET_MANAGER', 'TECHNICIAN', 'VIEWER_AUDITOR']),
})

const roleLabels: Record<string, string> = {
  ADMINISTRATOR: 'Administrator',
  ASSET_MANAGER: 'Asset Manager',
  TECHNICIAN: 'Technician',
  VIEWER_AUDITOR: 'Viewer/Auditor',
}

export const createUserInvitation = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => invitationSchema.parse(data))
  .handler(async ({ data }) => {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Authentication required')
    }

    if (currentUser.role !== 'ADMINISTRATOR') {
      throw new Error('You are not authorized to invite users')
    }

    const apiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM
    const appUrl = process.env.APP_URL

    if (!apiKey || !emailFrom || !appUrl) {
      throw new Error('Email configuration is incomplete')
    }

    const email = data.email.toLowerCase()
    const roleName = data.roleName
    const roleLabel = roleLabels[roleName]

    const existingUser = await db
      .select({ userId: users.userId })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1)

    if (existingUser.length > 0) {
      throw new Error('A user with this email already exists')
    }

    const now = new Date()

    const existingInvitation = await db
      .select({ invitationId: userInvitations.invitationId })
      .from(userInvitations)
      .where(
        and(
          sql`lower(${userInvitations.email}) = ${email}`,
          isNull(userInvitations.acceptedAt),
          isNull(userInvitations.revokedAt),
          gt(userInvitations.expiresAt, now),
        ),
      )
      .limit(1)

    if (existingInvitation.length > 0) {
      throw new Error('An active invitation already exists for this email')
    }

    const [role] = await db
      .select({ roleId: roles.roleId })
      .from(roles)
      .where(eq(roles.roleName, roleName))
      .limit(1)

    if (!role) {
      throw new Error('The selected role does not exist')
    }

    const token = randomBytes(32).toString('hex')

    const tokenHash = createHash('sha256').update(token).digest('hex')

    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [invitation] = await db
      .insert(userInvitations)
      .values({
        email,
        roleId: role.roleId,
        invitedBy: currentUser.userId,
        tokenHash,
        expiresAt,
      })
      .returning({
        invitationId: userInvitations.invitationId,
      })

    const invitationUrl = new URL('/accept-invitation', appUrl)
    invitationUrl.searchParams.set('token', token)

    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'You are invited to join InfraTrack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
          <h2>Welcome to InfraTrack</h2>
          <p>You have been invited to join InfraTrack.</p>
          <p>Your assigned role is <strong>${roleLabel}</strong>.</p>
          <p>Click the button below to accept your invitation and create your account.</p>
          <a
            href="${invitationUrl.toString()}"
            style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;"
          >
            Accept Invitation
          </a>
          <p>This invitation expires in 7 days.</p>
          <p>If you were not expecting this invitation, you can ignore this email.</p>
        </div>
      `,
    })

    if (error) {
      await db
        .update(userInvitations)
        .set({ revokedAt: new Date() })
        .where(eq(userInvitations.invitationId, invitation.invitationId))

      throw new Error(`Unable to send invitation email: ${error.message}`)
    }

    return {
      success: true,
      message: `Invitation email sent to ${email}`,
    }
  })
