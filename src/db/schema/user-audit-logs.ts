import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'

import { users } from './users'

export const userAuditLogs = pgTable(
  'user_audit_logs',
  {
    auditId: uuid('audit_id').defaultRandom().primaryKey(),

    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.userId, {
        onDelete: 'restrict',
      }),

    targetUserId: uuid('target_user_id').references(() => users.userId, {
      onDelete: 'restrict',
    }),

    action: varchar('action', { length: 60 }).notNull(),

    details: varchar('details', { length: 2000 }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('user_audit_logs_actor_user_id_idx').on(table.actorUserId),

    index('user_audit_logs_target_user_id_idx').on(table.targetUserId),
  ],
)
