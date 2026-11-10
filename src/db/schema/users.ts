import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { sql } from 'drizzle-orm'

export const users = pgTable(
  'users',
  {
    userId: uuid('user_id').defaultRandom().primaryKey(),

    fullName: varchar('full_name', { length: 120 }).notNull(),

    email: varchar('email', { length: 255 }).notNull(),

    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    emailVerifiedAt: timestamp('email_verified_at', {
      withTimezone: true,
    }),

    accountStatus: varchar('account_status', { length: 30 }).notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(sql`lower(${table.email})`)],
)
