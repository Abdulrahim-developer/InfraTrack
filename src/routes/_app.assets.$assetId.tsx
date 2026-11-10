import { useEffect, useState } from 'react'
import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router'
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Clock,
  FileText,
  Info,
  Loader2,
  MapPin,
  Network,
  Pencil,
  Plus,
  Server,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'

import EditAssetForm from '#/features/assets/components/EditAssetForm'
import AssetAssignmentHistory from '#/features/assets/components/AssetAssignmentHistory'
import AssetMaintenanceHistory from '#/features/assets/components/AssetMaintenanceHistory'
import { getAssetById } from '#/features/assets/server/get-asset-by-id'
import { retireAsset } from '#/features/assets/server/retire-asset'

export const Route = createFileRoute('/_app/assets/$assetId')({
  component: AssetDetailsPage,
})

type DetailTab = 'Overview' | 'Assignments' | 'Maintenance' | 'Audit Logs'

const tabs: { label: DetailTab; icon: typeof Boxes }[] = [
  { label: 'Overview', icon: Info },
  { label: 'Assignments', icon: Users },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Audit Logs', icon: ShieldCheck },
]

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Storage': 'bg-violet-50 text-violet-700 ring-violet-200',
  Retired: 'bg-slate-100 text-slate-600 ring-slate-200',
}

type AssetDetails = NonNullable<Awaited<ReturnType<typeof getAssetById>>['data']>

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString()
}

function AssetDetailsPage() {
  const { assetId } = Route.useParams()
  const { authenticatedUser } = useRouteContext({ from: '/_app' })

  const canEditAsset =
    authenticatedUser.role === 'Administrator' ||
    authenticatedUser.role === 'Asset Manager'

  const [activeTab, setActiveTab] = useState<DetailTab>('Overview')
  const [asset, setAsset] = useState<AssetDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [isRetireDialogOpen, setIsRetireDialogOpen] = useState(false)
  const [isRetiring, setIsRetiring] = useState(false)
  const [retireError, setRetireError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadAsset() {
      setIsLoading(true)
      setErrorMessage('')
      setAsset(null)

      try {
        const result = await getAssetById({
          data: { assetId },
        })

        if (cancelled) return

        if (!result.success || !result.data) {
          setErrorMessage(
            'No asset matches the supplied ID. It may not exist or you may not have permission to view it.',
          )
          return
        }

        setAsset(result.data)
      } catch (error) {
        if (cancelled) return

        console.error('Failed to load asset details:', error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load asset details. Please try again.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadAsset()

    return () => {
      cancelled = true
    }
  }, [assetId, refreshKey])

  async function handleRetireAsset() {
    if (!asset || isRetiring) return

    setRetireError('')

    try {
      setIsRetiring(true)

      const result = await retireAsset({
        data: {
          assetId: asset.assetId,
        },
      })

      if (result.success) {
        setIsRetireDialogOpen(false)
        setRefreshKey((current) => current + 1)
      }
    } catch (error) {
      setRetireError(
        error instanceof Error
          ? error.message
          : 'Unable to retire this asset. Please try again.',
      )
    } finally {
      setIsRetiring(false)
    }
  }

  // Show the edit form when the user clicks Edit Asset.
  if (isEditing && asset) {
    return (
      <main className="min-w-0 space-y-6">
        <EditAssetForm
          asset={asset}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            setRefreshKey((current) => current + 1)
          }}
        />
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <Boxes size={32} className="mx-auto text-blue-500" />
        <p className="mt-4 text-sm font-medium text-slate-600">
          Loading asset details...
        </p>
      </main>
    )
  }

  if (errorMessage || !asset) {
    return (
      <main className="space-y-5">
        <Link
          to="/assets"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to Asset Inventory
        </Link>

        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Boxes size={36} className="mx-auto text-slate-300" />

          <h1 className="mt-3 text-xl font-semibold text-slate-900">Asset unavailable</h1>

          <p role="alert" className="mt-2 text-sm text-slate-500">
            {errorMessage || 'Unable to find this asset.'}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </section>
      </main>
    )
  }

  const AssetIcon =
    asset.assetType === 'Router' ? Network : asset.assetType === 'Server' ? Server : Boxes

  const currentAssignee =
    asset.assignedToUserName ?? asset.assignedToDepartment ?? 'Unassigned'

  const isAssignmentAvailable =
    canEditAsset && asset.status === 'Active' && !asset.assignedAt

  return (
    <main className="min-w-0 space-y-6">
      {/* Breadcrumb and page heading */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">
            Dashboard
          </Link>

          <span>/</span>

          <Link to="/assets" className="hover:text-blue-600">
            Asset Inventory
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-700">Asset Details</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asset Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View complete information, assignment, maintenance and audit history for this
            asset.
          </p>
        </div>
      </section>

      {/* Asset header */}
      <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <AssetIcon size={29} />
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-slate-900">
              {asset.assetName}
            </h2>

            <p className="mt-1 break-all text-sm text-slate-500">
              Asset ID: {asset.assetId}
            </p>
          </div>

          <div className="hidden h-12 w-px bg-slate-200 xl:block" />

          <div>
            <p className="text-xs text-slate-500">Status</p>

            <span
              className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                statusStyles[asset.status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
              }`}
            >
              {asset.status}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-500">Type</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{asset.assetType}</p>
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500">Location</p>

            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
              <MapPin size={15} className="shrink-0 text-slate-400" />
              {asset.location || '—'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            disabled={!canEditAsset || asset.status === 'Retired'}
            title={
              !canEditAsset
                ? 'You do not have permission to edit assets'
                : asset.status === 'Retired'
                  ? 'Retired assets cannot be edited'
                  : 'Edit asset information'
            }
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={16} />
            Edit Asset
          </button>

          <Link
            to="/assignments"
            search={{
              assetId: asset.assetId,
              action: 'create',
            }}
            aria-disabled={!isAssignmentAvailable}
            onClick={(event) => {
              if (!isAssignmentAvailable) {
                event.preventDefault()
              }
            }}
            title={
              !canEditAsset
                ? 'You do not have permission to assign assets'
                : asset.status !== 'Active'
                  ? 'Only active assets can be assigned'
                  : asset.assignedAt
                    ? 'This asset already has an active assignment'
                    : 'Assign this asset'
            }
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
              isAssignmentAvailable
                ? 'border-slate-200 text-slate-700 transition hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-200 text-slate-400'
            }`}
          >
            <UserRound size={16} />
            Assign
          </Link>

          <button
            type="button"
            onClick={() => {
              window.location.href = `/maintenance?assetId=${asset.assetId}&action=create`
            }}
            disabled={
              !['Administrator', 'Asset Manager', 'Technician'].includes(
                authenticatedUser.role,
              )
            }
            title="Create a maintenance record for this asset"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            Add Maintenance
          </button>

          <button
            type="button"
            onClick={() => {
              setRetireError('')
              setIsRetireDialogOpen(true)
            }}
            disabled={!canEditAsset || asset.status === 'Retired'}
            title={
              !canEditAsset
                ? 'You do not have permission to retire assets'
                : asset.status === 'Retired'
                  ? 'This asset is already retired'
                  : 'Retire this asset'
            }
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            Retire
          </button>
        </div>
      </section>

      {/* Retirement confirmation dialog */}
      {isRetireDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isRetiring) {
              setIsRetireDialogOpen(false)
              setRetireError('')
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="retire-dialog-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={23} />
            </div>

            <h2
              id="retire-dialog-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              Retire this asset?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You are about to retire{' '}
              <span className="font-semibold text-slate-900">{asset.assetName}</span>. Its
              status will change to Retired, and the action will be recorded in the asset
              audit log.
            </p>

            <p className="mt-3 text-sm text-slate-500">
              This action cannot be reversed through the normal Edit Asset form.
            </p>

            {retireError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {retireError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRetireDialogOpen(false)
                  setRetireError('')
                }}
                disabled={isRetiring}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRetireAsset}
                disabled={isRetiring}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRetiring ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Retiring...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Confirm Retirement
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Tabs */}
      <nav
        aria-label="Asset detail sections"
        className="flex min-w-0 gap-2 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.label

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Info size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-900">Asset Information</h3>

                <p className="text-xs text-slate-500">Registered asset details</p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-100">
              {[
                ['Asset Name', asset.assetName],
                ['Asset ID', asset.assetId],
                ['Asset Type', asset.assetType],
                ['Serial Number', asset.serialNumber || '—'],
                ['Manufacturer', asset.manufacturer || '—'],
                ['Model Number', asset.modelNumber || '—'],
                ['Location', asset.location || '—'],
                ['Purchase Date', asset.purchaseDate || '—'],
                ['Warranty Expiry', asset.warrantyExpiry || '—'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1 px-3 py-3 odd:bg-slate-50 sm:grid-cols-2 sm:gap-4"
                >
                  <dt className="text-sm font-medium text-slate-700">{label}</dt>

                  <dd className="break-all text-sm text-slate-600">{value}</dd>
                </div>
              ))}

              <div className="grid grid-cols-1 gap-1 px-3 py-3 odd:bg-slate-50 sm:grid-cols-2 sm:gap-4">
                <dt className="text-sm font-medium text-slate-700">Status</dt>

                <dd>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      statusStyles[asset.status] ??
                      'bg-slate-100 text-slate-600 ring-slate-200'
                    }`}
                  >
                    {asset.status}
                  </span>
                </dd>
              </div>

              <div className="grid grid-cols-1 gap-1 px-3 py-3 odd:bg-slate-50 sm:grid-cols-2 sm:gap-4">
                <dt className="text-sm font-medium text-slate-700">Current Assignment</dt>

                <dd className="text-sm text-slate-600">{currentAssignee}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <p className="flex items-start gap-2">
                <CalendarDays size={16} className="mt-0.5 shrink-0" />
                Created: {formatDate(asset.createdAt)}
              </p>

              <p className="flex items-start gap-2">
                <Clock size={16} className="mt-0.5 shrink-0" />
                Last updated: {formatDate(asset.updatedAt)}
              </p>
            </div>
          </section>

          <div className="space-y-5">
            {/* Asset visual */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <AssetIcon size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Asset Visual</h3>

                  <p className="text-xs text-slate-500">Asset category preview</p>
                </div>
              </div>

              <div className="mt-4 flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-4">
                {asset.assetType === 'Router' ? (
                  <img
                    src="/images/router-illustration.png"
                    alt="Router illustration"
                    className="max-h-48 w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <AssetIcon size={64} className="mx-auto text-blue-500" />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {asset.assetType}
                    </p>

                    <p className="mt-1 text-xs">Category illustration placeholder</p>
                  </div>
                )}
              </div>
            </section>

            {/* Current assignment */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Users size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Current Assignment</h3>

                  <p className="text-xs text-slate-500">
                    Current assignment information from PostgreSQL
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Assigned To</p>

                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {currentAssignee}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Assigned At</p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(asset.assignedAt)}
                  </p>
                </div>
              </div>
            </section>

            {/* Recent activity placeholder */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">Recent Activity</h3>

                  <p className="text-xs text-slate-500">
                    Assignment and maintenance events
                  </p>
                </div>
              </div>

              <p className="py-8 text-center text-sm text-slate-500">
                Assignment and maintenance activity history will appear here after those
                modules are connected to PostgreSQL.
              </p>
            </section>
          </div>
        </div>
      )}

      {/* Assignment history */}
      {activeTab === 'Assignments' && <AssetAssignmentHistory assetId={asset.assetId} />}

      {/* Maintenance history */}
      {activeTab === 'Maintenance' && <AssetMaintenanceHistory assetId={asset.assetId} />}

      {/* Audit log placeholder */}
      {activeTab === 'Audit Logs' && (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText size={36} className="mx-auto text-slate-300" />

          <h3 className="mt-3 font-semibold text-slate-800">Asset Audit History</h3>

          <p className="mt-2 text-sm text-slate-500">
            Audit log records will appear here when the audit data is connected.
          </p>
        </section>
      )}

      <div className="flex justify-start">
        <Link
          to="/assets"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to Asset Inventory
        </Link>
      </div>
    </main>
  )
}
