import { useMemo, useState } from 'react'
import { Archive, Boxes, Search, UserCheck, Wrench, Trash2, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { AppRole } from '#/features/navigation/navigation.config'
import {
  assetInventory,
  type AssetStatus,
  type AssetType,
} from '#/features/dashboard/data/dashboard.mock'

interface AssetInventoryProps {
  role: AppRole
}

const statusStyles: Record<AssetStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Storage': 'bg-violet-50 text-violet-700 ring-violet-200',
  Retired: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const assetTypes: AssetType[] = ['Router', 'Server', 'Switch']

const assetStatuses: AssetStatus[] = ['Active', 'Maintenance', 'In Storage', 'Retired']

export default function AssetInventory({ role }: AssetInventoryProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [locationFilter, setLocationFilter] = useState('All Locations')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const locations = useMemo(
    () => [...new Set(assetInventory.map((asset) => asset.location))].sort(),
    [],
  )

  const summary = useMemo(
    () => ({
      total: assetInventory.length,
      active: assetInventory.filter((asset) => asset.status === 'Active').length,
      maintenance: assetInventory.filter((asset) => asset.status === 'Maintenance')
        .length,
      storage: assetInventory.filter((asset) => asset.status === 'In Storage').length,
      retired: assetInventory.filter((asset) => asset.status === 'Retired').length,
    }),
    [],
  )

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return assetInventory.filter((asset) => {
      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.id.toLowerCase().includes(normalizedSearch) ||
        asset.serialNumber.toLowerCase().includes(normalizedSearch)

      const matchesType = typeFilter === 'All Types' || asset.type === typeFilter

      const matchesStatus = statusFilter === 'All Status' || asset.status === statusFilter

      const matchesLocation =
        locationFilter === 'All Locations' || asset.location === locationFilter

      return matchesSearch && matchesType && matchesStatus && matchesLocation
    })
  }, [search, typeFilter, statusFilter, locationFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedAssets = filteredAssets.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const canManageAssets = role === 'Administrator' || role === 'Asset Manager'

  function clearFilters() {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
    setLocationFilter('All Locations')
    setCurrentPage(1)
  }

  function updateSearch(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function updateType(value: string) {
    setTypeFilter(value)
    setCurrentPage(1)
  }

  function updateStatus(value: string) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  function updateLocation(value: string) {
    setLocationFilter(value)
    setCurrentPage(1)
  }

  function updatePageSize(value: number) {
    setPageSize(value)
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
            View, search and review registered infrastructure assets.
          </p>
        </div>

        {canManageAssets && (
          <Link
            to="/assets/new"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Register New Asset
          </Link>
        )}
      </section>

      {/* Asset summary */}
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

      {/* Search and filters */}
      <section
        aria-label="Search and filter assets"
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="relative min-w-0 sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Search assets</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by ID, name or serial number..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by asset type</span>
          <select
            value={typeFilter}
            onChange={(event) => updateType(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Types</option>
            {assetTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => updateStatus(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Status</option>
            {assetStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by location</span>
          <select
            value={locationFilter}
            onChange={(event) => updateLocation(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option>All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
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

      {/* Inventory table */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">All Assets</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current registered infrastructure inventory
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {filteredAssets.length} assets
          </span>
        </div>

        {paginatedAssets.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Boxes size={32} className="mx-auto text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-medium text-slate-700">No assets found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile asset cards */}
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
                        {asset.type} · {asset.serialNumber}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[asset.status]}`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="mt-1 break-words text-slate-600">{asset.location}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Assigned To</p>
                      <p className="mt-1 text-slate-600">
                        {asset.assignedTo ?? 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    {canManageAssets ? 'Management access' : 'Read-only access'}
                  </p>
                </article>
              ))}
            </div>

            {/* Desktop and tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1000px] text-left text-sm">
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
                    <th className="px-4 py-3 font-medium">Access</th>
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

                      <td className="px-4 py-4 text-slate-600">{asset.serialNumber}</td>

                      <td className="px-4 py-4 text-slate-600">{asset.location}</td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[asset.status]}`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {asset.assignedTo ?? 'Unassigned'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="whitespace-nowrap text-xs text-slate-500">
                          {canManageAssets ? 'Management' : 'Read only'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing{' '}
            {filteredAssets.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1} –{' '}
            {Math.min(safeCurrentPage * pageSize, filteredAssets.length)} of{' '}
            {filteredAssets.length} assets
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => updatePageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="min-w-16 text-center text-xs text-slate-500">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
