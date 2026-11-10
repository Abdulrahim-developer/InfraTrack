import { createServerFn } from '@tanstack/react-start'
import { ilike } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { getCurrentUser } from '#/features/auth/server/session'

type CreateAssetInput = {
  assetName: string
  assetType: string
  serialNumber: string
  location: string
  status: string
}

function validateCreateAssetInput(data: unknown): CreateAssetInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid asset registration request')
  }

  const input = data as Record<string, unknown>

  const assetName = input.assetName
  const assetType = input.assetType
  const serialNumber = input.serialNumber
  const location = input.location
  const status = input.status

  if (
    typeof assetName !== 'string' ||
    typeof assetType !== 'string' ||
    typeof serialNumber !== 'string' ||
    typeof location !== 'string' ||
    typeof status !== 'string'
  ) {
    throw new Error('Please provide all required asset details')
  }

  const normalized = {
    assetName: assetName.trim(),
    assetType: assetType.trim(),
    serialNumber: serialNumber.trim(),
    location: location.trim(),
    status: status.trim(),
  }

  if (
    !normalized.assetName ||
    !normalized.assetType ||
    !normalized.serialNumber ||
    !normalized.location ||
    !normalized.status
  ) {
    throw new Error('All asset fields are required')
  }

  if (normalized.assetName.length > 150) {
    throw new Error('Asset name must not exceed 150 characters')
  }

  if (normalized.assetType.length > 50) {
    throw new Error('Invalid asset type')
  }

  if (normalized.serialNumber.length > 100) {
    throw new Error('Serial number must not exceed 100 characters')
  }

  if (normalized.location.length > 150) {
    throw new Error('Location must not exceed 150 characters')
  }

  if (!['Router', 'Server', 'Switch'].includes(normalized.assetType)) {
    throw new Error('Invalid asset type')
  }

  if (!['Active', 'Maintenance', 'In Storage', 'Retired'].includes(normalized.status)) {
    throw new Error('Invalid asset status')
  }

  return normalized
}

export const createAsset = createServerFn({
  method: 'POST',
})
  .validator(validateCreateAssetInput)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    if (user.role !== 'ADMINISTRATOR' && user.role !== 'ASSET_MANAGER') {
      throw new Error('You are not authorized to register assets')
    }

    const duplicate = await db
      .select({ assetId: assets.assetId })
      .from(assets)
      .where(ilike(assets.serialNumber, data.serialNumber))
      .limit(1)

    if (duplicate.length > 0) {
      throw new Error(
        'This serial number is already registered. Please enter a unique serial number.',
      )
    }

    try {
      const [newAsset] = await db
        .insert(assets)
        .values({
          assetName: data.assetName,
          assetType: data.assetType,
          serialNumber: data.serialNumber,
          location: data.location,
          status: data.status,
        })
        .returning({
          assetId: assets.assetId,
          assetName: assets.assetName,
        })

      if (!newAsset) {
        throw new Error('Asset registration failed')
      }

      return {
        success: true,
        message: 'Asset registered successfully',
        asset: newAsset,
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new Error(
          'This serial number is already registered. Please enter a unique serial number.',
          { cause: error },
        )
      }

      throw error
    }
  })
