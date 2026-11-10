import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { assetAssignments } from '#/db/schema/asset-assignments'
import { assetAuditLogs } from '#/db/schema/asset-audit-logs'
import { getCurrentUser } from '#/features/auth/server/session'

type RetireAssetInput = {
  assetId: string
}

function validateRetireAsset(data: unknown): RetireAssetInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid retirement request')
  }

  const input = data as Record<string, unknown>

  if (
    typeof input.assetId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.assetId)
  ) {
    throw new Error('Invalid asset ID')
  }

  return {
    assetId: input.assetId,
  }
}

export const retireAsset = createServerFn({
  method: 'POST',
})
  .validator(validateRetireAsset)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    if (!['ADMINISTRATOR', 'ASSET_MANAGER'].includes(user.role)) {
      throw new Error('You are not authorized to retire assets')
    }

    return await db.transaction(async (tx) => {
      // Lock the asset row to prevent concurrent retirement operations.
      const [asset] = await tx
        .select({
          assetId: assets.assetId,
          assetName: assets.assetName,
          status: assets.status,
        })
        .from(assets)
        .where(eq(assets.assetId, data.assetId))
        .limit(1)
        .for('update')

      if (!asset) {
        throw new Error('Asset not found')
      }

      if (asset.status === 'Retired') {
        throw new Error('This asset has already been retired')
      }

      // Check whether the asset still has an active assignment.
      const [activeAssignment] = await tx
        .select({
          assignmentId: assetAssignments.assignmentId,
        })
        .from(assetAssignments)
        .where(
          and(
            eq(assetAssignments.assetId, data.assetId),
            isNull(assetAssignments.returnedAt),
          ),
        )
        .limit(1)

      if (activeAssignment) {
        throw new Error(
          'This asset is currently assigned. Return the asset before retiring it.',
        )
      }

      const [updatedAsset] = await tx
        .update(assets)
        .set({
          status: 'Retired',
          updatedAt: new Date(),
        })
        .where(eq(assets.assetId, data.assetId))
        .returning({
          assetId: assets.assetId,
        })

      if (!updatedAsset) {
        throw new Error('Unable to retire this asset')
      }

      await tx.insert(assetAuditLogs).values({
        assetId: data.assetId,
        actorUserId: user.userId,
        action: 'status changed',
        details: `Asset "${asset.assetName}" status changed from "${asset.status}" to "Retired".`,
      })

      return {
        success: true as const,
        message: 'Asset retired successfully',
      }
    })
  })
