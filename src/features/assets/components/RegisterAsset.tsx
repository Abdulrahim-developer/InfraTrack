import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Info,
  Lightbulb,
  MapPin,
  Network,
  Plus,
  Server,
  ShieldCheck,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { AppRole } from '#/features/navigation/navigation.config'
import type { AssetStatus, AssetType } from '#/features/dashboard/data/dashboard.mock'

interface RegisterAssetProps {
  role: AppRole
}

const assetTypes: AssetType[] = ['Router', 'Server', 'Switch']

const assetStatuses: AssetStatus[] = ['Active', 'Maintenance', 'In Storage', 'Retired']

const inputStyles =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const labelStyles = 'mb-2 block text-sm font-semibold text-slate-700'

export default function RegisterAsset({ role }: RegisterAssetProps) {
  const canManageAssets = role === 'Administrator' || role === 'Asset Manager'

  const [assetName, setAssetName] = useState('')
  const [assetType, setAssetType] = useState<AssetType | ''>('')
  const [serialNumber, setSerialNumber] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<AssetStatus>('Active')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageAssets) return

    setSubmitted(true)
  }

  if (!canManageAssets) {
    return (
      <main className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldCheck size={36} className="mx-auto text-slate-400" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to register infrastructure assets.
        </p>
        <Link
          to="/assets"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to Asset Inventory
        </Link>
      </main>
    )
  }

  return (
    <main className="min-w-0 space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <Link to="/" className="hover:text-blue-600">
          Dashboard
        </Link>
        <span>/</span>
        <Link to="/assets" className="hover:text-blue-600">
          Asset Inventory
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">Register New Asset</span>
      </nav>

      {/* Page heading */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Register New Asset
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a new infrastructure asset to the inventory.
        </p>
      </section>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.95fr)]">
        {/* Registration form */}
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Boxes size={23} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Asset Details</h2>
              <p className="text-xs text-slate-500">
                Enter the required asset information.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
              {/* Asset name */}
              <div className="min-w-0">
                <label htmlFor="assetName" className={labelStyles}>
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="assetName"
                  name="assetName"
                  required
                  maxLength={150}
                  value={assetName}
                  onChange={(event) => {
                    setAssetName(event.target.value)
                    setSubmitted(false)
                  }}
                  placeholder="e.g. Cisco Router 2901"
                  className={inputStyles}
                />
              </div>

              {/* Asset type */}
              <div className="min-w-0">
                <label htmlFor="assetType" className={labelStyles}>
                  Asset Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Server
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <select
                    id="assetType"
                    name="assetType"
                    required
                    value={assetType}
                    onChange={(event) => {
                      setAssetType(event.target.value as AssetType | '')
                      setSubmitted(false)
                    }}
                    className={`${inputStyles} pl-10`}
                  >
                    <option value="">Select asset type</option>
                    {assetTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Serial number */}
              <div className="min-w-0">
                <label htmlFor="serialNumber" className={labelStyles}>
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="serialNumber"
                  name="serialNumber"
                  required
                  maxLength={100}
                  value={serialNumber}
                  onChange={(event) => {
                    setSerialNumber(event.target.value)
                    setSubmitted(false)
                  }}
                  placeholder="e.g. CSR2901-7843"
                  className={inputStyles}
                />
              </div>

              {/* Location */}
              <div className="min-w-0">
                <label htmlFor="location" className={labelStyles}>
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="location"
                    name="location"
                    required
                    maxLength={200}
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value)
                      setSubmitted(false)
                    }}
                    placeholder="e.g. Data Center - Rack A1"
                    className={`${inputStyles} pl-10`}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="min-w-0">
                <label htmlFor="status" className={labelStyles}>
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as AssetStatus)
                    setSubmitted(false)
                  }}
                  className={inputStyles}
                >
                  {assetStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* System-generated information */}
              <div className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 p-3 sm:mt-6">
                <CalendarDays
                  size={19}
                  className="shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <p className="text-xs leading-5 text-slate-500">
                  Asset ID and timestamps will be generated by the system.
                </p>
              </div>
            </div>

            {submitted && (
              <div
                role="status"
                className="mt-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
              >
                <Info size={18} className="mt-0.5 shrink-0" />
                <p>
                  Form validation passed. Database saving is not connected yet, so no
                  asset has been registered.
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
              <Link
                to="/assets"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Plus size={18} />
                Register Asset
              </button>
            </div>
          </form>
        </section>

        {/* Information panel */}
        <aside className="min-w-0 space-y-4">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Info size={20} aria-hidden="true" />
              </div>
              <h2 className="font-bold text-slate-900">Asset Information</h2>
            </div>

            {/* Dynamic asset illustration */}
            <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-blue-50 p-4">
              {assetType === 'Router' ? (
                <img
                  src="/images/router-illustration.png"
                  alt="Enterprise network router"
                  className="h-full w-full object-contain"
                />
              ) : assetType === 'Server' ? (
                <div className="flex flex-col items-center gap-3 text-blue-600">
                  <Server size={76} strokeWidth={1.4} />
                  <span className="text-sm font-semibold">Server Infrastructure</span>
                </div>
              ) : assetType === 'Switch' ? (
                <div className="flex flex-col items-center gap-3 text-blue-600">
                  <Network size={76} strokeWidth={1.4} />
                  <span className="text-sm font-semibold">Network Switch</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-blue-600">
                  <Boxes size={76} strokeWidth={1.4} />
                  <span className="text-sm font-semibold">Infrastructure Asset</span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={19} className="text-blue-600" />
              <h2 className="font-bold text-slate-900">Required Fields</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              The following fields are mandatory:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>Asset Name</li>
              <li>Asset Type</li>
              <li>Serial Number</li>
              <li>Location</li>
              <li>Status</li>
            </ul>
          </section>

          <section className="rounded-xl border border-amber-100 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={19} className="text-amber-600" />
              <h2 className="font-bold text-slate-900">Notes</h2>
            </div>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-5 text-slate-700">
              <li>Use a unique serial number for each asset.</li>
              <li>Set the initial status based on the current condition.</li>
              <li>Location can be a data center, building or floor.</li>
              <li>Asset ID is generated automatically.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  )
}
