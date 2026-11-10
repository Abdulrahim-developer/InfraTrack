import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { users } from '#/db/schema/users'
import { getCurrentUser } from '#/features/auth/server/session'

function validateAssetId(data: unknown): { assetId: string } {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid asset request')
  }

  const assetId = (data as Record<string, unknown>).assetId

  if (
    typeof assetId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assetId)
  ) {
    throw new Error('Invalid asset ID')
  }

  return { assetId }
}

export const getAssetById = createServerFn({
  method: 'GET',
})
  .validator(validateAssetId)
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

    const conditions = [eq(assets.assetId, data.assetId)]

    if (user.role === 'TECHNICIAN') {
      conditions.push(
        // Technician can only view their currently assigned assets.
        // This condition is applied using the assignment subquery below.
        eq(assets.assetId, data.assetId),
      )
    }

    const [asset] = await db
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
      .where(
        and(
          ...conditions,
          user.role === 'TECHNICIAN'
            ? eq(assetAssignments.userId, user.userId)
            : undefined,
        ),
      )
      .limit(1)

    if (!asset) {
      return {
        success: false as const,
        data: null,
      }
    }

    return {
      success: true as const,
      data: asset,
    }
  })
