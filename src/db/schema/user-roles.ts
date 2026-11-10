import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core'

import { users } from './users'
import { roles } from './roles'

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),

    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.roleId, { onDelete: 'restrict' }),

    assignedBy: uuid('assigned_by').references(() => users.userId, {
      onDelete: 'restrict',
    }),

    assignedAt: timestamp('assigned_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.roleId],
    }),
  ],
)
