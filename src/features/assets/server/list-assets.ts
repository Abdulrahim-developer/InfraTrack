import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

type ListAssetsInput = {
  search: string
  type: string
  status: string
  location: string
  page: number
  pageSize: number
}

function validateListAssetsInput(data: unknown): ListAssetsInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid asset inventory request')
  }

  const input = data as Record<string, unknown>

  const search = input.search ?? ''
  const type = input.type ?? ''
  const status = input.status ?? ''
  const location = input.location ?? ''
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 10

  if (
    typeof search !== 'string' ||
    search.length > 100 ||
    typeof type !== 'string' ||
    type.length > 50 ||
    typeof status !== 'string' ||
    status.length > 30 ||
    typeof location !== 'string' ||
    location.length > 150
  ) {
    throw new Error('Invalid asset filter')
  }

  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
    throw new Error('Invalid page number')
  }

  if (
    typeof pageSize !== 'number' ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    throw new Error('Page size must be between 1 and 100')
  }

  return {
    search: search.trim(),
    type: type.trim(),
    status: status.trim(),
    location: location.trim(),
    page,
    pageSize,
  }
}

export const listAssets = createServerFn({
  method: 'GET',
})
  .validator(validateListAssetsInput)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    const allowedRoles = [
      'ADMINISTRATOR',
      'ASSET_MANAGER',
      'TECHNICIAN',
      'VIEWER_AUDITOR',
    ]

    if (!allowedRoles.includes(user.role)) {
      throw new Error('You are not authorized to view assets')
    }

    // Visibility conditions are shared by the inventory,
    // summary cards, and filter options.
    const visibilityConditions = []

    if (user.role === 'TECHNICIAN') {
      const assignedAssetIds = db
        .select({
          assetId: assetAssignments.assetId,
        })
        .from(assetAssignments)
        .where(
          and(
            eq(assetAssignments.userId, user.userId),
            isNull(assetAssignments.returnedAt),
          ),
        )

      visibilityConditions.push(inArray(assets.assetId, assignedAssetIds))
    }

    const visibilityCondition =
      visibilityConditions.length > 0 ? and(...visibilityConditions) : undefined

    // Search and filters apply only to the inventory list.
    const filterConditions = []

    if (data.search) {
      const searchPattern = `%${data.search}%`

      filterConditions.push(
        or(
          ilike(assets.assetName, searchPattern),
          ilike(assets.assetType, searchPattern),
          ilike(assets.serialNumber, searchPattern),
          ilike(assets.location, searchPattern),
          sql`${assets.assetId}::text ILIKE ${searchPattern}`,
        )!,
      )
    }

    if (data.type) {
      filterConditions.push(eq(assets.assetType, data.type))
    }

    if (data.status) {
      filterConditions.push(eq(assets.status, data.status))
    }

    if (data.location) {
      filterConditions.push(eq(assets.location, data.location))
    }

    const whereConditions = [...visibilityConditions, ...filterConditions]

    const whereCondition =
      whereConditions.length > 0 ? and(...whereConditions) : undefined

    const offset = (data.page - 1) * data.pageSize

    const [assetRecords, totalResult, statusCounts, typeRecords, locationRecords] =
      await Promise.all([
        // Paginated inventory with active assignment details.
        db
          .select({
            assetId: assets.assetId,
            assetName: assets.assetName,
            assetType: assets.assetType,
            serialNumber: assets.serialNumber,
            manufacturer: assets.manufacturer,
            modelNumber: assets.modelNumber,
            location: assets.location,
            status: assets.status,
            purchaseDate: assets.purchaseDate,
            warrantyExpiry: assets.warrantyExpiry,
            createdAt: assets.createdAt,
            updatedAt: assets.updatedAt,
            assignedToUserId: assetAssignments.userId,
            assignedToUserName: users.fullName,
            assignedToDepartment: assetAssignments.assignedToDepartment,
            assignedAt: assetAssignments.assignedAt,
          })
          .from(assets)
          .leftJoin(
            assetAssignments,
            and(
              eq(assetAssignments.assetId, assets.assetId),
              isNull(assetAssignments.returnedAt),
            ),
          )
          .leftJoin(users, eq(users.userId, assetAssignments.userId))
          .where(whereCondition)
          .orderBy(desc(assets.createdAt))
          .limit(data.pageSize)
          .offset(offset),

        // Number of records matching the selected filters.
        db
          .select({
            total: count(),
          })
          .from(assets)
          .where(whereCondition),

        // Overall status summary, without search/filter conditions.
        db
          .select({
            status: assets.status,
            total: count(),
          })
          .from(assets)
          .where(visibilityCondition)
          .groupBy(assets.status),

        // Available asset types for the filter dropdown.
        db
          .selectDistinct({
            type: assets.assetType,
          })
          .from(assets)
          .where(visibilityCondition)
          .orderBy(assets.assetType),

        // Available locations for the filter dropdown.
        db
          .selectDistinct({
            location: assets.location,
          })
          .from(assets)
          .where(visibilityCondition)
          .orderBy(assets.location),
      ])

    const total = totalResult[0]?.total ?? 0

    const summary = {
      total: statusCounts.reduce((sum, record) => sum + record.total, 0),
      active: 0,
      maintenance: 0,
      storage: 0,
      retired: 0,
    }

    for (const record of statusCounts) {
      switch (record.status) {
        case 'Active':
          summary.active = record.total
          break
        case 'Maintenance':
          summary.maintenance = record.total
          break
        case 'In Storage':
          summary.storage = record.total
          break
        case 'Retired':
          summary.retired = record.total
          break
      }
    }

    return {
      success: true,
      data: assetRecords,
      pagination: {
        page: data.page,
        pageSize: data.pageSize,
        total,
        totalPages: Math.ceil(total / data.pageSize),
      },
      summary,
      filterOptions: {
        types: typeRecords.map((record) => record.type),
        locations: locationRecords
          .map((record) => record.location)
          .filter((location): location is string => location !== null),
      },
    }
  })
