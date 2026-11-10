import { useEffect, useState } from 'react'
import {
  Archive,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Search,
  Trash2,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { AppRole } from '#/features/navigation/navigation.config'
import type { AssetStatus, AssetType } from '#/features/dashboard/data/dashboard.mock'
import { listAssets } from '#/features/assets/server/list-assets'

interface AssetInventoryProps {
  role: AppRole
}

type InventoryResponse = Awaited<ReturnType<typeof listAssets>>

type InventoryAsset = {
  id: string
  name: string
  type: AssetType
  serialNumber: string
  location: string
  status: AssetStatus
  assignedTo: string
}

const statusStyles: Record<AssetStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Storage': 'bg-violet-50 text-violet-700 ring-violet-200',
  Retired: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const assetStatuses: AssetStatus[] = ['Active', 'Maintenance', 'In Storage', 'Retired']

const defaultSummary: InventoryResponse['summary'] = {
  total: 0,
  active: 0,
  maintenance: 0,
  storage: 0,
  retired: 0,
}

const defaultPagination: InventoryResponse['pagination'] = {
  page: 1,
  pageSize: 5,
  total: 0,
  totalPages: 0,
}

export default function AssetInventory({ role }: AssetInventoryProps) {
  const canManageAssets = role === 'Administrator' || role === 'Asset Manager'

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [locationFilter, setLocationFilter] = useState('All Locations')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [inventoryAssets, setInventoryAssets] = useState<InventoryAsset[]>([])
  const [summary, setSummary] = useState(defaultSummary)

  const [filterOptions, setFilterOptions] = useState<InventoryResponse['filterOptions']>({
    types: [],
    locations: [],
  })

  const [pagination, setPagination] = useState(defaultPagination)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [successMessage, setSuccessMessage] = useState('')

  const locations = filterOptions.locations
  const assetTypes = filterOptions.types

  const totalPages = Math.max(1, pagination.totalPages)
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedAssets = inventoryAssets

  useEffect(() => {
    let cancelled = false

    async function loadInventory() {
      setIsLoading(true)
      setLoadError('')

      try {
        const result = await listAssets({
          data: {
            search,
            type: typeFilter === 'All Types' ? '' : typeFilter,
            status: statusFilter === 'All Status' ? '' : statusFilter,
            location: locationFilter === 'All Locations' ? '' : locationFilter,
            page: currentPage,
            pageSize,
          },
        })

        if (cancelled) return

        setInventoryAssets(
          result.data.map((asset) => ({
            id: asset.assetId,
            name: asset.assetName,
            type: asset.assetType as AssetType,
            serialNumber: asset.serialNumber ?? '',
            location: asset.location ?? '',
            status: asset.status as AssetStatus,
            assignedTo:
              asset.assignedToUserName ?? asset.assignedToDepartment ?? 'Unassigned',
          })),
        )

        setSummary(result.summary)
        setFilterOptions(result.filterOptions)
        setPagination(result.pagination)
      } catch (error) {
        if (cancelled) return

        console.error('Failed to load asset inventory:', error)
        setLoadError('Unable to load asset inventory. Please try again.')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInventory()

    return () => {
      cancelled = true
    }
  }, [search, typeFilter, statusFilter, locationFilter, currentPage, pageSize, reloadKey])

  function clearFilters() {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
    setLocationFilter('All Locations')
    setCurrentPage(1)
  }

  const summaryCards = [
    {
      label: 'Total Assets',
      value: summary.total,
      icon: Boxes,
      iconStyle: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Active',
      value: summary.active,
      icon: UserCheck,
      iconStyle: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Maintenance',
      value: summary.maintenance,
      icon: Wrench,
      iconStyle: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'In Storage',
      value: summary.storage,
      icon: Archive,
      iconStyle: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Retired',
      value: summary.retired,
      icon: Trash2,
      iconStyle: 'bg-slate-100 text-slate-600',
    },
  ]

  return (
    <main className="min-w-0 space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asset Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, search and manage registered infrastructure assets.
          </p>
        </div>

        {canManageAssets && (
          <Link
            to="/assets/new"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            Register New Asset
          </Link>
        )}
      </section>

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} />
          {successMessage}
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="ml-auto rounded p-1 hover:bg-emerald-100"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section
        aria-label="Asset inventory statistics"
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.label}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconStyle}`}
              >
                <Icon size={21} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {card.value}
                </p>
              </div>
            </article>
          )
        })}
      </section>

      <section
        aria-label="Search and filter assets"
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="relative min-w-0 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Search assets</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by ID, name or serial number..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by asset type</span>
          <select
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Types</option>
            {assetTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Status</option>
            {assetStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by location</span>
          <select
            value={locationFilter}
            onChange={(event) => {
              setLocationFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Locations</option>
            {locations.map((location) => (
              <option key={location}>{location}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="text-left text-sm font-medium text-blue-600 transition hover:text-blue-800 sm:col-span-2 xl:col-span-4"
        >
          Clear filters
        </button>
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">All Assets</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current registered infrastructure inventory
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {pagination.total} assets
          </span>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">Loading assets...</p>
          </div>
        ) : loadError ? (
          <div className="px-4 py-12 text-center">
            <p role="alert" className="font-medium text-red-600">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : paginatedAssets.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Boxes size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No assets found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedAssets.map((asset) => (
                <article key={asset.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600">
                        {asset.id.slice(0, 8).toUpperCase()}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900">{asset.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {asset.type} · {asset.serialNumber || 'No serial number'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        statusStyles[asset.status] ??
                        'bg-slate-100 text-slate-600 ring-slate-200'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="mt-1 break-words text-slate-600">
                        {asset.location || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Assigned To</p>
                      <p className="mt-1 text-slate-600">{asset.assignedTo}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs">
                    <Link
                      to="/assets/$assetId"
                      params={{ assetId: asset.id }}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Asset ID</th>
                    <th className="px-4 py-3 font-medium">Asset Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Serial Number</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedAssets.map((asset, index) => (
                    <tr key={asset.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4 font-medium text-blue-600">
                        {asset.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {asset.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{asset.type}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {asset.serialNumber || '—'}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {asset.location || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusStyles[asset.status] ??
                            'bg-slate-100 text-slate-600 ring-slate-200'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{asset.assignedTo}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to="/assets/$assetId"
                            params={{ assetId: asset.id }}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>

                          <Link
                            to="/assignments"
                            search={{ assetId: asset.id }}
                            className="text-slate-500 hover:text-blue-600"
                            title="View assignments"
                          >
                            <ClipboardList size={16} />
                          </Link>

                          <Link
                            to="/maintenance"
                            search={{ assetId: asset.id }}
                            className="text-slate-500 hover:text-blue-600"
                            title="View maintenance"
                          >
                            <Wrench size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {pagination.total === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
            {' – '}
            {Math.min(safeCurrentPage * pageSize, pagination.total)} of {pagination.total}{' '}
            assets
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setCurrentPage(1)
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>

              <span className="min-w-16 text-center text-xs text-slate-500">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
