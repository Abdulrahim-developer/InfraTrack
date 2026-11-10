import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'

import { assets } from './assets'
import { users } from './users'

export const maintenanceRecords = pgTable(
  'maintenance_records',
  {
    maintenanceId: uuid('maintenance_id').defaultRandom().primaryKey(),

    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.assetId, {
        onDelete: 'restrict',
      }),

    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.userId, {
        onDelete: 'restrict',
      }),

    maintenanceType: varchar('maintenance_type', {
      length: 60,
    }).notNull(),

    description: varchar('description', {
      length: 1000,
    }).notNull(),

    performedAt: timestamp('performed_at', {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    index('maintenance_records_asset_id_idx').on(table.assetId),

    index('maintenance_records_performed_by_idx').on(table.performedBy),
  ],
)
