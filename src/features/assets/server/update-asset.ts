import { createServerFn } from '@tanstack/react-start'
import { and, eq, ne, sql } from 'drizzle-orm'

import { db } from '#/db'
import { assets } from '#/db/schema/assets'
import { getCurrentUser } from '#/features/auth/server/session'

type UpdateAssetInput = {
  assetId: string
  assetName: string
  assetType: string
  serialNumber: string
  manufacturer: string | null
  modelNumber: string | null
  location: string
  status: string
  purchaseDate: string | null
  warrantyExpiry: string | null
}

function validateUpdateAsset(data: unknown): UpdateAssetInput {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid asset update request')
  }

  const input = data as Record<string, unknown>

  const assetId = input.assetId
  const assetName = input.assetName
  const assetType = input.assetType
  const serialNumber = input.serialNumber
  const manufacturer = input.manufacturer
  const modelNumber = input.modelNumber
  const location = input.location
  const status = input.status
  const purchaseDate = input.purchaseDate
  const warrantyExpiry = input.warrantyExpiry

  if (
    typeof assetId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assetId)
  ) {
    throw new Error('Invalid asset ID')
  }

  if (typeof assetName !== 'string' || !assetName.trim() || assetName.length > 150) {
    throw new Error('Enter a valid asset name')
  }

  if (typeof assetType !== 'string' || !assetType.trim() || assetType.length > 50) {
    throw new Error('Select a valid asset type')
  }

  if (
    typeof serialNumber !== 'string' ||
    !serialNumber.trim() ||
    serialNumber.length > 100
  ) {
    throw new Error('Enter a valid serial number')
  }

  if (typeof location !== 'string' || !location.trim() || location.length > 150) {
    throw new Error('Enter a valid location')
  }

  if (!['Active', 'Maintenance', 'In Storage', 'Retired'].includes(status as string)) {
    throw new Error('Invalid asset status')
  }

  if (
    manufacturer !== null &&
    (typeof manufacturer !== 'string' || manufacturer.length > 100)
  ) {
    throw new Error('Invalid manufacturer')
  }

  if (
    modelNumber !== null &&
    (typeof modelNumber !== 'string' || modelNumber.length > 100)
  ) {
    throw new Error('Invalid model number')
  }

  function validateDate(value: unknown, fieldName: string): string | null {
    if (value === null || value === '') return null

    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Invalid ${fieldName}`)
    }

    const date = new Date(`${value}T00:00:00.000Z`)

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error(`Invalid ${fieldName}`)
    }

    return value
  }

  return {
    assetId,
    assetName: assetName.trim(),
    assetType: assetType.trim(),
    serialNumber: serialNumber.trim(),
    manufacturer: typeof manufacturer === 'string' ? manufacturer.trim() || null : null,
    modelNumber: typeof modelNumber === 'string' ? modelNumber.trim() || null : null,
    location: location.trim(),
    status: status as string,
    purchaseDate: validateDate(purchaseDate, 'purchase date'),
    warrantyExpiry: validateDate(warrantyExpiry, 'warranty expiry'),
  }
}

export const updateAsset = createServerFn({
  method: 'POST',
})
  .validator(validateUpdateAsset)
  .handler(async ({ data }) => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    if (!['ADMINISTRATOR', 'ASSET_MANAGER'].includes(user.role)) {
      throw new Error('You are not authorized to update assets')
    }

    const [existingAsset] = await db
      .select({
        assetId: assets.assetId,
        status: assets.status,
      })
      .from(assets)
      .where(eq(assets.assetId, data.assetId))
      .limit(1)

    if (!existingAsset) {
      throw new Error('Asset not found')
    }

    // Retirement and reactivation must use their own controlled workflows.
    if (
      (existingAsset.status === 'Retired' && data.status !== 'Retired') ||
      (existingAsset.status !== 'Retired' && data.status === 'Retired')
    ) {
      throw new Error(
        'Asset retirement and reactivation must use their dedicated workflows',
      )
    }

    const duplicateSerial = await db
      .select({
        assetId: assets.assetId,
      })
      .from(assets)
      .where(
        and(
          sql`lower(${assets.serialNumber}) = ${data.serialNumber.toLowerCase()}`,
          ne(assets.assetId, data.assetId),
        ),
      )
      .limit(1)

    if (duplicateSerial.length) {
      throw new Error('This serial number is already registered')
    }

    try {
      const [updatedAsset] = await db
        .update(assets)
        .set({
          assetName: data.assetName,
          assetType: data.assetType,
          serialNumber: data.serialNumber,
          manufacturer: data.manufacturer,
          modelNumber: data.modelNumber,
          location: data.location,
          status: data.status,
          purchaseDate: data.purchaseDate,
          warrantyExpiry: data.warrantyExpiry,
          updatedAt: new Date(),
        })
        .where(eq(assets.assetId, data.assetId))
        .returning({
          assetId: assets.assetId,
        })

      if (!updatedAsset) {
        throw new Error('Unable to update asset')
      }

      return {
        success: true as const,
        message: 'Asset updated successfully',
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new Error('This serial number is already registered', {
          cause: error,
        })
      }

      throw error
    }
  })
