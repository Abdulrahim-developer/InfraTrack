import { useMemo, useState } from 'react'
import { Boxes, CalendarDays, Search, Wrench } from 'lucide-react'

import {
  currentMockTechnicianId,
  type AssetStatus,
  type AssetType,
} from '#/features/dashboard/data/dashboard.mock'
import { useAppData } from '#/features/dashboard/context/AppDataContext'

const statusStyles: Record<AssetStatus, string> = {
  Active:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-800',
  Maintenance:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800',
  'In Storage':
    'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800',
  Retired:
    'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
}

const assetTypes: AssetType[] = ['Router', 'Server', 'Switch']

const assetStatuses: AssetStatus[] = ['Active', 'Maintenance', 'In Storage', 'Retired']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function MyAssignedAssets() {
  const { assets, assignments } = useAppData()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Get only the assets currently assigned to the preview technician.
  const technicianAssets = useMemo(
    () =>
      assignments
        .filter(
          (assignment) =>
            assignment.assignedToUserId === currentMockTechnicianId &&
            assignment.returnedAt === null,
        )
        .flatMap((assignment) => {
          const asset = assets.find((item) => item.id === assignment.assetId)

          if (!asset) return []

          return [
            {
              ...asset,
              assignedAt: assignment.assignedAt,
            },
          ]
        }),
    [assignments, assets],
  )

  const summary = useMemo(
    () => ({
      total: technicianAssets.length,
      active: technicianAssets.filter((asset) => asset.status === 'Active').length,
      maintenance: technicianAssets.filter((asset) => asset.status === 'Maintenance')
        .length,
    }),
    [technicianAssets],
  )

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return technicianAssets.filter((asset) => {
      const matchesSearch =
        !normalizedSearch ||
        asset.name.toLowerCase().includes(normalizedSearch) ||
        asset.id.toLowerCase().includes(normalizedSearch) ||
        asset.serialNumber.toLowerCase().includes(normalizedSearch)

      const matchesType = typeFilter === 'All Types' || asset.type === typeFilter

      const matchesStatus = statusFilter === 'All Status' || asset.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [technicianAssets, search, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedAssets = filteredAssets.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  function clearFilters() {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
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

  function updatePageSize(value: number) {
    setPageSize(value)
    setCurrentPage(1)
  }

  const summaryCards = [
    {
      label: 'Assigned Assets',
      value: summary.total,
      icon: Boxes,
      iconStyle: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
    {
      label: 'Active Assets',
      value: summary.active,
      icon: CalendarDays,
      iconStyle:
        'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    },
    {
      label: 'Under Maintenance',
      value: summary.maintenance,
      icon: Wrench,
      iconStyle: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
  ]

  return (
    <main className="min-w-0 space-y-6">
      {/* Page heading */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Assigned Assets
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and monitor infrastructure assets currently assigned to you.
        </p>
      </section>

      {/* Summary cards */}
      <section
        aria-label="My assigned asset statistics"
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.label}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.iconStyle}`}
              >
                <Icon size={21} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            </article>
          )
        })}
      </section>

      {/* Search and filters */}
      <section
        aria-label="Search and filter assigned assets"
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2 xl:grid-cols-3"
      >
        <label className="relative min-w-0">
          <span className="sr-only">Search assigned assets</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by ID, name or serial number..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-900"
          />
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by asset type</span>
          <select
            value={typeFilter}
            onChange={(event) => updateType(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900"
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900"
          >
            <option>All Status</option>
            {assetStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="text-left text-sm font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 sm:col-span-2 xl:col-span-3"
        >
          Clear filters
        </button>
      </section>

      {/* Assigned assets */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Assigned to Me
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Assets with active assignments under your account
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {filteredAssets.length} assets
          </span>
        </div>

        {paginatedAssets.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Boxes
              size={32}
              className="mx-auto text-slate-300 dark:text-slate-600"
              aria-hidden="true"
            />
            <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">
              No assigned assets found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {paginatedAssets.map((asset) => (
                <article key={asset.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {asset.id.slice(0, 8).toUpperCase()}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {asset.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                      <p className="mt-1 break-words text-slate-600 dark:text-slate-300">
                        {asset.location}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Assigned Date</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        {formatDate(asset.assignedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop and tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Asset ID</th>
                    <th className="px-4 py-3 font-medium">Asset Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Serial Number</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedAssets.map((asset, index) => (
                    <tr
                      key={asset.id}
                      className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="px-4 py-4 font-medium text-blue-600 dark:text-blue-400">
                        {asset.id.slice(0, 8).toUpperCase()}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                        {asset.name}
                      </td>

                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        {asset.type}
                      </td>

                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        {asset.serialNumber}
                      </td>

                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        {asset.location}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[asset.status]}`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                        {formatDate(asset.assignedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing{' '}
            {filteredAssets.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1} –{' '}
            {Math.min(safeCurrentPage * pageSize, filteredAssets.length)} of{' '}
            {filteredAssets.length} assets
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => updatePageSize(Number(event.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </button>

              <span className="min-w-16 text-center text-xs text-slate-500 dark:text-slate-400">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
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
