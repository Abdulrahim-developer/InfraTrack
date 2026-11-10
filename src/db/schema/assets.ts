import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

export const assets = pgTable(
  'assets',
  {
    assetId: uuid('asset_id').defaultRandom().primaryKey(),

    assetName: varchar('asset_name', { length: 150 }).notNull(),

    assetType: varchar('asset_type', { length: 50 }).notNull(),

    serialNumber: varchar('serial_number', { length: 100 }),

    manufacturer: varchar('manufacturer', { length: 100 }),

    modelNumber: varchar('model_number', { length: 100 }),

    location: varchar('location', { length: 150 }),

    status: varchar('status', { length: 30 }).notNull(),

    purchaseDate: date('purchase_date', {
      mode: 'string',
    }),

    warrantyExpiry: date('warranty_expiry', {
      mode: 'string',
    }),

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
  (table) => [
    uniqueIndex('assets_serial_number_unique').on(table.serialNumber),

    index('assets_asset_type_idx').on(table.assetType),

    index('assets_status_idx').on(table.status),

    index('assets_location_idx').on(table.location),
  ],
)
