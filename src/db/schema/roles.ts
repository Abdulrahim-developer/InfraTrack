import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core'

export const roles = pgTable('roles', {
  roleId: uuid('role_id').defaultRandom().primaryKey(),

  roleName: varchar('role_name', { length: 40 }).notNull().unique(),

  description: varchar('description', { length: 255 }),
})
