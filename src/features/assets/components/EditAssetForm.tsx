import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'

import { updateAsset } from '#/features/assets/server/update-asset'
import { getAssetById } from '#/features/assets/server/get-asset-by-id'
import { useAppData } from '#/features/dashboard/context/AppDataContext'

type AssetDetails = NonNullable<Awaited<ReturnType<typeof getAssetById>>['data']>

interface EditAssetFormProps {
  asset: AssetDetails
  onCancel: () => void
  onSaved: () => void
}

const assetTypes = ['Router', 'Server', 'Switch']

const assetStatuses = ['Active', 'Maintenance', 'In Storage']

const inputStyles =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-blue-900'

const labelStyles = 'mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200'

export default function EditAssetForm({ asset, onCancel, onSaved }: EditAssetFormProps) {
  const { refreshDashboard } = useAppData()

  const [assetName, setAssetName] = useState(asset.assetName)
  const [assetType, setAssetType] = useState(asset.assetType)

  const [serialNumber, setSerialNumber] = useState(asset.serialNumber ?? '')
  const [manufacturer, setManufacturer] = useState(asset.manufacturer ?? '')
  const [modelNumber, setModelNumber] = useState(asset.modelNumber ?? '')
  const [location, setLocation] = useState(asset.location ?? '')
  const [status, setStatus] = useState(asset.status)
  const [purchaseDate, setPurchaseDate] = useState(asset.purchaseDate ?? '')
  const [warrantyExpiry, setWarrantyExpiry] = useState(asset.warrantyExpiry ?? '')

  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) return

    setErrorMessage('')

    if (!assetName.trim() || !assetType || !serialNumber.trim() || !location.trim()) {
      setErrorMessage('Please complete all required fields.')
      return
    }

    try {
      setIsSaving(true)

      const result = await updateAsset({
        data: {
          assetId: asset.assetId,
          assetName: assetName.trim(),
          assetType,
          serialNumber: serialNumber.trim(),
          manufacturer: manufacturer.trim() || null,
          modelNumber: modelNumber.trim() || null,
          location: location.trim(),
          status,
          purchaseDate: purchaseDate || null,
          warrantyExpiry: warrantyExpiry || null,
        },
      })

      if (result.success) {
        await refreshDashboard()
        onSaved()
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update the asset. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-100 pb-5 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Asset</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update the registered asset information.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          aria-label="Close edit form"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <div>
            <label htmlFor="editAssetName" className={labelStyles}>
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              id="editAssetName"
              required
              maxLength={150}
              value={assetName}
              onChange={(event) => setAssetName(event.target.value)}
              className={inputStyles}
              placeholder="e.g. Cisco Router 2901"
            />
          </div>

          <div>
            <label htmlFor="editAssetType" className={labelStyles}>
              Asset Type <span className="text-red-500">*</span>
            </label>
            <select
              id="editAssetType"
              required
              value={assetType}
              onChange={(event) => setAssetType(event.target.value)}
              className={inputStyles}
            >
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="editSerialNumber" className={labelStyles}>
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              id="editSerialNumber"
              required
              maxLength={100}
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
              className={inputStyles}
              placeholder="Enter serial number"
            />
          </div>

          <div>
            <label htmlFor="editLocation" className={labelStyles}>
              Location <span className="text-red-500">*</span>
            </label>
            <input
              id="editLocation"
              required
              maxLength={150}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={inputStyles}
              placeholder="e.g. Data Center - Rack A1"
            />
          </div>

          <div>
            <label htmlFor="editManufacturer" className={labelStyles}>
              Manufacturer (Optional)
            </label>
            <input
              id="editManufacturer"
              maxLength={100}
              value={manufacturer}
              onChange={(event) => setManufacturer(event.target.value)}
              className={inputStyles}
              placeholder="e.g. Cisco"
            />
          </div>

          <div>
            <label htmlFor="editModelNumber" className={labelStyles}>
              Model Number (Optional)
            </label>
            <input
              id="editModelNumber"
              maxLength={100}
              value={modelNumber}
              onChange={(event) => setModelNumber(event.target.value)}
              className={inputStyles}
              placeholder="e.g. ISR 2901"
            />
          </div>

          <div>
            <label htmlFor="editPurchaseDate" className={labelStyles}>
              Purchase Date (Optional)
            </label>
            <input
              id="editPurchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="editWarrantyExpiry" className={labelStyles}>
              Warranty Expiry (Optional)
            </label>
            <input
              id="editWarrantyExpiry"
              type="date"
              value={warrantyExpiry}
              onChange={(event) => setWarrantyExpiry(event.target.value)}
              className={inputStyles}
            />
          </div>

          <div>
            <label htmlFor="editAssetStatus" className={labelStyles}>
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="editAssetStatus"
              required
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputStyles}
            >
              {assetStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  )
}
