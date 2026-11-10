import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'

import { assets } from './assets'
import { users } from './users'

export const assetAssignments = pgTable(
  'asset_assignments',
  {
    assignmentId: uuid('assignment_id').defaultRandom().primaryKey(),

    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.assetId, {
        onDelete: 'restrict',
      }),

    userId: uuid('user_id').references(() => users.userId, {
      onDelete: 'restrict',
    }),

    assignedToDepartment: varchar('assigned_to_department', {
      length: 120,
    }),

    assignedAt: timestamp('assigned_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    returnedAt: timestamp('returned_at', {
      withTimezone: true,
    }),
  },
  (table) => [
    index('asset_assignments_asset_id_idx').on(table.assetId),

    index('asset_assignments_user_id_idx').on(table.userId),

    uniqueIndex('asset_assignments_one_active_unique')
      .on(table.assetId)
      .where(sql`${table.returnedAt} IS NULL`),

    check(
      'asset_assignments_exactly_one_recipient_check',
      sql`
        (
          (${table.userId} IS NOT NULL AND ${table.assignedToDepartment} IS NULL)
          OR
          (
            ${table.userId} IS NULL
            AND ${table.assignedToDepartment} IS NOT NULL
            AND btrim(${table.assignedToDepartment}) <> ''
          )
        )
      `,
    ),
  ],
)
