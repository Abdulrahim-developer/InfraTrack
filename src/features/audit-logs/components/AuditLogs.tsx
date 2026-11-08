import { useMemo, useState } from 'react'
import { Activity, ClipboardList, Search, ShieldCheck, Users } from 'lucide-react'

import { recentActivity } from '#/features/dashboard/data/dashboard.mock'
import type { AppRole } from '#/features/navigation/navigation.config'

interface AuditLogsProps {
  role: AppRole
}

type AuditCategory = 'Asset' | 'User'

interface MockAuditUser {
  id: string
  name: string
  email: string
  role: AppRole
}

interface AuditEntry {
  id: string
  category: AuditCategory
  action: string
  actorUserId: string
  targetUserId: string | null
  targetAssetName: string | null
  details: string
  timestamp: string
}

// Fictional identities for audit-log UI development.
// These will later be retrieved from PostgreSQL.
const mockUsers: MockAuditUser[] = [
  {
    id: 'user-administrator-01',
    name: 'Abdul Rahim',
    email: 'rahim@example.test',
    role: 'Administrator',
  },
  {
    id: 'user-asset-manager-01',
    name: 'Naveen K',
    email: 'naveen@example.test',
    role: 'Asset Manager',
  },
  {
    id: 'user-technician-01',
    name: 'Karthick',
    email: 'karthick@example.test',
    role: 'Technician',
  },
  {
    id: 'user-technician-02',
    name: 'Satish M',
    email: 'satish@example.test',
    role: 'Technician',
  },
  {
    id: 'user-viewer-02',
    name: 'Arun P',
    email: 'arun@example.test',
    role: 'Viewer/Auditor',
  },
]

const userById = new Map(mockUsers.map((user) => [user.id, user]))

const mockUserAuditLogs: AuditEntry[] = [
  {
    id: 'USR-AUD-001',
    category: 'User',
    action: 'Invitation Created',
    actorUserId: 'user-administrator-01',
    targetUserId: 'user-asset-manager-01',
    targetAssetName: null,
    details: 'Invitation created with Asset Manager role.',
    timestamp: '2026-11-05T11:30:00',
  },
  {
    id: 'USR-AUD-002',
    category: 'User',
    action: 'Role Assigned',
    actorUserId: 'user-administrator-01',
    targetUserId: 'user-technician-02',
    targetAssetName: null,
    details: 'Technician role assigned to user.',
    timestamp: '2026-11-04T15:20:00',
  },
  {
    id: 'USR-AUD-003',
    category: 'User',
    action: 'Account Deactivated',
    actorUserId: 'user-administrator-01',
    targetUserId: 'user-viewer-02',
    targetAssetName: null,
    details: 'User account deactivated.',
    timestamp: '2026-11-03T12:45:00',
  },
  {
    id: 'USR-AUD-004',
    category: 'User',
    action: 'Invitation Accepted',
    actorUserId: 'user-asset-manager-01',
    targetUserId: 'user-asset-manager-01',
    targetAssetName: null,
    details: 'User accepted the invitation.',
    timestamp: '2026-11-02T09:15:00',
  },
]

const mockAssetAuditLogs: AuditEntry[] = recentActivity.map((activity) => ({
  id: `AST-AUD-${activity.id}`,
  category: 'Asset',
  action: activity.action,
  actorUserId: activity.performedByUserId,
  targetUserId: null,
  targetAssetName: activity.assetName,
  details: activity.details,
  timestamp: activity.timestamp,
}))

const initialAuditLogs = [...mockAssetAuditLogs, ...mockUserAuditLogs].sort(
  (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
)

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function getActionStyle(action: string) {
  const normalized = action.toLowerCase()

  if (
    normalized.includes('created') ||
    normalized.includes('registered') ||
    normalized.includes('assigned')
  ) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (
    normalized.includes('deactivated') ||
    normalized.includes('retired') ||
    normalized.includes('returned')
  ) {
    return 'bg-orange-50 text-orange-700'
  }

  if (normalized.includes('updated') || normalized.includes('changed')) {
    return 'bg-blue-50 text-blue-700'
  }

  return 'bg-slate-100 text-slate-700'
}

function PersonDetails({ userId }: { userId: string }) {
  const user = userById.get(userId)

  if (!user) {
    return (
      <div>
        <p className="font-medium text-slate-700">Unknown user</p>
        <p className="text-xs text-slate-400">User information unavailable</p>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-0.5">
      <p className="font-medium text-slate-800">{user.name}</p>
      <p className="break-all text-xs text-slate-500">{user.email}</p>
      <p className="text-xs text-slate-400">{user.role}</p>
    </div>
  )
}

function TargetDetails({ log }: { log: AuditEntry }) {
  if (log.category === 'Asset') {
    return (
      <div>
        <p className="font-medium text-slate-700">{log.targetAssetName}</p>
        <p className="text-xs text-slate-400">Infrastructure asset</p>
      </div>
    )
  }

  if (log.targetUserId) {
    return <PersonDetails userId={log.targetUserId} />
  }

  return <span className="text-slate-400">System-level event</span>
}

export default function AuditLogs({ role }: AuditLogsProps) {
  const isAdministrator = role === 'Administrator'

  const [logs] = useState<AuditEntry[]>(initialAuditLogs)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Activities')
  const [actionFilter, setActionFilter] = useState('All Actions')
  const [dateFilter, setDateFilter] = useState('30')
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)

  const summary = useMemo(
    () => ({
      total: logs.length,
      asset: logs.filter((log) => log.category === 'Asset').length,
      user: logs.filter((log) => log.category === 'User').length,
    }),
    [logs],
  )

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = new Date()

    if (dateFilter !== 'all') {
      cutoff.setDate(cutoff.getDate() - Number(dateFilter))
    }

    return logs
      .filter((log) => {
        const actor = userById.get(log.actorUserId)
        const targetUser = log.targetUserId ? userById.get(log.targetUserId) : undefined

        const searchableValues = [
          log.id,
          log.action,
          log.details,
          log.targetAssetName ?? '',
          actor?.name ?? '',
          actor?.email ?? '',
          actor?.role ?? '',
          targetUser?.name ?? '',
          targetUser?.email ?? '',
          targetUser?.role ?? '',
        ]

        const matchesSearch =
          !query || searchableValues.some((value) => value.toLowerCase().includes(query))

        const matchesCategory =
          categoryFilter === 'All Activities' || log.category === categoryFilter

        const matchesAction =
          actionFilter === 'All Actions' || log.action === actionFilter

        const matchesDate = dateFilter === 'all' || new Date(log.timestamp) >= cutoff

        return matchesSearch && matchesCategory && matchesAction && matchesDate
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [logs, search, categoryFilter, actionFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedLogs = filteredLogs.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const availableActions = [...new Set(logs.map((log) => log.action))]

  function clearFilters() {
    setSearch('')
    setCategoryFilter('All Activities')
    setActionFilter('All Actions')
    setDateFilter('30')
    setCurrentPage(1)
  }

  const summaryCards = [
    {
      label: 'Total Logs',
      value: summary.total,
      description: 'All recorded activities',
      icon: ClipboardList,
      style: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Asset Activities',
      value: summary.asset,
      description: 'Changes to infrastructure assets',
      icon: Activity,
      style: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'User Activities',
      value: summary.user,
      description: 'User and role management events',
      icon: Users,
      style: 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <main className="min-w-0 space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track user activities and changes made to infrastructure assets.
        </p>
      </section>

      <section
        aria-label="Audit statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${card.style}`}
              >
                <Icon size={23} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{card.description}</p>
              </div>
            </article>
          )
        })}
      </section>

      <section
        aria-label="Search and filter audit logs"
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="relative min-w-0 xl:col-span-2">
          <span className="sr-only">Search audit logs</span>
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
            placeholder="Search user, email, asset, action or details..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter activity category</span>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Activities</option>
            <option>Asset</option>
            <option>User</option>
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by action</span>
          <select
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Actions</option>
            {availableActions.map((action) => (
              <option key={action}>{action}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by date</span>
          <select
            value={dateFilter}
            onChange={(event) => {
              setDateFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last 12 Months</option>
            <option value="all">All Time</option>
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

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Activity History</h2>
            <p className="mt-1 text-xs text-slate-500">
              Recorded actions across InfraTrack
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {filteredLogs.length} activities
          </span>
        </div>

        {paginatedLogs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <ShieldCheck size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No audit records found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedLogs.map((log) => (
                <article key={log.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400">{log.id}</p>
                      <p className="mt-1 font-semibold text-slate-900">{log.action}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getActionStyle(log.action)}`}
                    >
                      {log.category}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600">{log.details}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs text-slate-400">Performed By</p>
                      <PersonDetails userId={log.actorUserId} />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs text-slate-400">Target</p>
                      <TargetDetails log={log} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">{formatDate(log.timestamp)}</p>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event ID</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Performed By</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-700">
                        {log.id}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {log.category}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getActionStyle(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="min-w-48 px-4 py-4">
                        <PersonDetails userId={log.actorUserId} />
                      </td>

                      <td className="min-w-48 px-4 py-4">
                        <TargetDetails log={log} />
                      </td>

                      <td className="max-w-xs px-4 py-4 text-slate-500">{log.details}</td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {formatDate(log.timestamp)}
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
            Showing {filteredLogs.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}{' '}
            – {Math.min(safeCurrentPage * pageSize, filteredLogs.length)} of{' '}
            {filteredLogs.length} activities
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

      {!isAdministrator && (
        <p className="text-xs text-slate-400">
          Audit records are read-only. Changes to audit history are not available from
          this page.
        </p>
      )}
    </main>
  )
}
