import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

import { roles } from './roles'
import { users } from './users'

export const userInvitations = pgTable(
  'user_invitations',
  {
    invitationId: uuid('invitation_id').defaultRandom().primaryKey(),

    email: varchar('email', { length: 255 }).notNull(),

    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.roleId, { onDelete: 'restrict' }),

    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.userId, { onDelete: 'restrict' }),

    tokenHash: varchar('token_hash', { length: 255 }).notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    acceptedAt: timestamp('accepted_at', {
      withTimezone: true,
    }),

    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_invitations_token_hash_unique').on(table.tokenHash),

    index('user_invitations_email_idx').on(table.email),
  ],
)
