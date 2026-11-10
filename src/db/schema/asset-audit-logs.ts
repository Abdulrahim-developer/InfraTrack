import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'

import { assets } from './assets'
import { users } from './users'

export const assetAuditLogs = pgTable(
  'asset_audit_logs',
  {
    auditId: uuid('audit_id').defaultRandom().primaryKey(),

    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.assetId, {
        onDelete: 'restrict',
      }),

    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.userId, {
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
    index('asset_audit_logs_asset_id_idx').on(table.assetId),

    index('asset_audit_logs_actor_user_id_idx').on(table.actorUserId),
  ],
)
