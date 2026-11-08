import { useMemo, useState } from 'react'
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Search,
  UserRound,
} from 'lucide-react'

import {
  assignments,
  assetInventory,
  currentMockTechnicianId,
  currentMockUserId,
  type AssetType,
} from '#/features/dashboard/data/dashboard.mock'

type AssignmentStatus = 'Assigned' | 'Returned'

const assetTypes: AssetType[] = ['Router', 'Server', 'Switch']

// Temporary display names for UI development.
// These are mock names, not actual registered company users.
const mockUserNames: Record<string, string> = {
  [currentMockUserId]: 'Rahim',
  [currentMockTechnicianId]: 'Karthick',
}

function getUserName(userId: string | null) {
  if (!userId) return 'Unassigned'
  return mockUserNames[userId] ?? 'Other User'
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default function AssignmentManagement() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [userFilter, setUserFilter] = useState('All Users')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const assignmentRows = useMemo(
    () =>
      assignments.flatMap((assignment) => {
        const asset = assetInventory.find((item) => item.id === assignment.assetId)

        if (!asset) return []

        const status: AssignmentStatus = assignment.returnedAt ? 'Returned' : 'Assigned'

        return [
          {
            ...assignment,
            assetName: asset.name,
            assetType: asset.type,
            assetShortId: asset.id.slice(0, 8).toUpperCase(),
            serialNumber: asset.serialNumber,
            assignedUser: getUserName(assignment.assignedToUserId),
            status,
          },
        ]
      }),
    [],
  )

  const summary = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return {
      total: assignmentRows.length,
      assigned: assignmentRows.filter((item) => !item.returnedAt).length,
      returned: assignmentRows.filter((item) => item.returnedAt).length,
      thisMonth: assignmentRows.filter((item) => {
        const date = new Date(item.assignedAt)

        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).length,
    }
  }, [assignmentRows])

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return assignmentRows.filter((item) => {
      // Search supports assignment ID, short/full asset UUID,
      // asset name, serial number, and assigned person's name.
      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.assetName.toLowerCase().includes(query) ||
        item.assetShortId.toLowerCase().includes(query) ||
        item.assetId.toLowerCase().includes(query) ||
        item.serialNumber.toLowerCase().includes(query) ||
        item.assignedUser.toLowerCase().includes(query)

      const matchesType = typeFilter === 'All Types' || item.assetType === typeFilter

      const matchesStatus = statusFilter === 'All Status' || item.status === statusFilter

      const matchesUser = userFilter === 'All Users' || item.assignedUser === userFilter

      return matchesSearch && matchesType && matchesStatus && matchesUser
    })
  }, [assignmentRows, search, typeFilter, statusFilter, userFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize))

  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedAssignments = filteredAssignments.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const users = [...new Set(assignmentRows.map((item) => item.assignedUser))]

  function clearFilters() {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
    setUserFilter('All Users')
    setCurrentPage(1)
  }

  const summaryCards = [
    {
      label: 'Total Assignments',
      value: summary.total,
      icon: ClipboardList,
      style: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Currently Assigned',
      value: summary.assigned,
      icon: UserRound,
      style: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Returned',
      value: summary.returned,
      icon: Archive,
      style: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Assignments This Month',
      value: summary.thisMonth,
      icon: CalendarClock,
      style: 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <main className="min-w-0 space-y-6">
      {/* Page heading */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asset Assignments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign infrastructure assets to authorized users and manage assignment
            history.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="New assignment workflow will be implemented later"
          className="inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
        >
          <span className="text-lg leading-none">+</span>
          New Assignment
        </button>
      </section>

      {/* Summary cards */}
      <section
        aria-label="Assignment statistics"
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.label}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${card.style}`}
              >
                <Icon size={23} />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-slate-500">{card.label}</p>
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
        aria-label="Search and filter assignments"
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="relative min-w-0 xl:col-span-1">
          <span className="sr-only">Search assignments</span>
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
            placeholder="Search ID, asset, serial or user..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Types</option>
            {assetTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by assignment status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Status</option>
            <option value="Assigned">Assigned</option>
            <option value="Returned">Returned</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by assigned user</span>
          <select
            value={userFilter}
            onChange={(event) => {
              setUserFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Users</option>
            {users.map((user) => (
              <option key={user}>{user}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="text-left text-sm font-medium text-blue-600 hover:text-blue-800 sm:col-span-2 xl:col-span-4"
        >
          Clear filters
        </button>
      </section>

      {/* Assignment table */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Assignment Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current and historical asset assignments
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {filteredAssignments.length} records
          </span>
        </div>

        {paginatedAssignments.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <ClipboardList size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No assignments found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedAssignments.map((item) => (
                <article key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600">{item.id}</p>
                      <h3 className="mt-1 font-semibold text-slate-900">
                        {item.assetName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.assetType} · {item.assetShortId}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.status === 'Assigned'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Assigned To</p>
                      <p className="mt-1 text-slate-700">{item.assignedUser}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Assigned Date</p>
                      <p className="mt-1 text-slate-700">{formatDate(item.assignedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Return Date</p>
                      <p className="mt-1 text-slate-700">{formatDate(item.returnedAt)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop and tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Assignment ID</th>
                    <th className="px-4 py-3 font-medium">Asset</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Assigned Date</th>
                    <th className="px-4 py-3 font-medium">Return Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedAssignments.map((item, index) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4 font-medium text-blue-600">{item.id}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{item.assetName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.assetShortId}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.assetType}</td>
                      <td className="px-4 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <UserRound size={16} className="text-slate-400" />
                          {item.assignedUser}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.assignedAt)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.returnedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === 'Assigned'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {item.status === 'Assigned' ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Archive size={13} />
                          )}
                          {item.status}
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
            {filteredAssignments.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}{' '}
            – {Math.min(safeCurrentPage * pageSize, filteredAssignments.length)} of{' '}
            {filteredAssignments.length} assignments
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
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 disabled:opacity-40"
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 disabled:opacity-40"
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
