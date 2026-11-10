import { useEffect, useMemo, useState, type FormEvent } from 'react'

import {
  CheckCircle2,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'

import { listManagedUsers } from '#/features/users/server/list-managed-users'
import { createUserInvitation } from '#/features/users/server/create-user-invitation'
import type { AppRole } from '#/features/navigation/navigation.config'

type ManagedRole = AppRole
type UserStatus = 'Active' | 'Invited' | 'Deactivated'

type InvitationRoleName =
  'ADMINISTRATOR' | 'ASSET_MANAGER' | 'TECHNICIAN' | 'VIEWER_AUDITOR'

interface ManagedUser {
  id: string
  name: string
  email: string
  role: ManagedRole
  status: UserStatus
  createdAt: string
}

const roles: ManagedRole[] = [
  'Administrator',
  'Asset Manager',
  'Technician',
  'Viewer/Auditor',
]

const invitationRoles: {
  label: ManagedRole
  value: InvitationRoleName
}[] = [
  { label: 'Administrator', value: 'ADMINISTRATOR' },
  { label: 'Asset Manager', value: 'ASSET_MANAGER' },
  { label: 'Technician', value: 'TECHNICIAN' },
  { label: 'Viewer/Auditor', value: 'VIEWER_AUDITOR' },
]

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`))
}

function getRoleStyle(role: ManagedRole) {
  switch (role) {
    case 'Administrator':
      return 'bg-violet-50 text-violet-700'
    case 'Asset Manager':
      return 'bg-blue-50 text-blue-700'
    case 'Technician':
      return 'bg-orange-50 text-orange-700'
    case 'Viewer/Auditor':
      return 'bg-sky-50 text-sky-700'
  }
}

function getStatusStyle(status: UserStatus) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-50 text-emerald-700'
    case 'Invited':
      return 'bg-amber-50 text-amber-700'
    case 'Deactivated':
      return 'bg-slate-100 text-slate-600'
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [pageSize, setPageSize] = useState(8)
  const [currentPage, setCurrentPage] = useState(1)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState('')
  const [formError, setFormError] = useState('')

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InvitationRoleName>('TECHNICIAN')
  const [isInviting, setIsInviting] = useState(false)

  async function loadUsers() {
    try {
      setIsLoading(true)
      setLoadError('')

      const result = await listManagedUsers()
      setUsers(result.data as ManagedUser[])
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load users. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const selectedUser = users.find((user) => user.id === selectedUserId)

  const summary = useMemo(
    () => ({
      total: users.length,
      administrators: users.filter((user) => user.role === 'Administrator').length,
      assetManagers: users.filter((user) => user.role === 'Asset Manager').length,
      technicians: users.filter((user) => user.role === 'Technician').length,
      viewers: users.filter((user) => user.role === 'Viewer/Auditor').length,
    }),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)

      const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter

      const matchesStatus = statusFilter === 'All Status' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  function clearFilters() {
    setSearch('')
    setRoleFilter('All Roles')
    setStatusFilter('All Status')
    setCurrentPage(1)
  }

  function closeDetails() {
    setSelectedUserId(null)
  }

  function openDetails(user: ManagedUser) {
    setSelectedUserId(user.id)
    setOpenMenuId(null)
  }

  function openInviteModal() {
    setInviteEmail('')
    setInviteRole('TECHNICIAN')
    setFormError('')
    setSuccessMessage('')
    setIsInviteModalOpen(true)
  }

  function closeInviteModal() {
    if (isInviting) return

    setIsInviteModalOpen(false)
    setFormError('')
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError('')
    setSuccessMessage('')

    const normalizedEmail = inviteEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      setFormError('Please enter an email address.')
      return
    }

    try {
      setIsInviting(true)

      const result = await createUserInvitation({
        data: {
          email: normalizedEmail,
          roleName: inviteRole,
        },
      })

      setIsInviteModalOpen(false)
      setInviteEmail('')

      setSuccessMessage(result.message)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to send invitation. Please try again.',
      )
    } finally {
      setIsInviting(false)
    }
  }

  const summaryCards = [
    {
      label: 'Total Users',
      value: summary.total,
      icon: Users,
      style: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Administrators',
      value: summary.administrators,
      icon: ShieldCheck,
      style: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Asset Managers',
      value: summary.assetManagers,
      icon: Users,
      style: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Technicians',
      value: summary.technicians,
      icon: Wrench,
      style: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Viewers / Auditors',
      value: summary.viewers,
      icon: Eye,
      style: 'bg-sky-50 text-sky-600',
    },
  ]

  return (
    <main className="min-w-0 space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage system users, invitations, roles and account access.
          </p>
        </div>

        <button
          type="button"
          onClick={openInviteModal}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New User
        </button>
      </section>

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
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
        aria-label="User statistics"
        className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
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
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {isLoading ? '—' : card.value}
                </p>
              </div>
            </article>
          )
        })}
      </section>

      <section
        aria-label="Search and filter users"
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="relative min-w-0 xl:col-span-2">
          <span className="sr-only">Search users</span>
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
            placeholder="Search by name or email..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by role</span>
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Roles</option>
            {roles.map((role) => (
              <option key={role}>{role}</option>
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Invited</option>
            <option>Deactivated</option>
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

      <section className="min-w-0 overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">System Users</h2>
            <p className="mt-1 text-xs text-slate-500">
              User accounts, assigned roles and access status
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {isLoading ? 'Loading...' : `${filteredUsers.length} users`}
          </span>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-slate-500">Loading users from the database...</p>
          </div>
        ) : loadError ? (
          <div role="alert" className="px-4 py-12 text-center">
            <p className="font-medium text-red-600">Unable to load users</p>
            <p className="mt-2 text-sm text-slate-500">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Try Again
            </button>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Users size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">No users found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedUsers.map((user) => (
                <article key={user.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="mt-1 break-all text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(openMenuId === user.id ? null : user.id)
                      }
                      className="rounded-lg border border-slate-200 p-2 text-slate-600"
                      aria-label={`Actions for ${user.name}`}
                      aria-expanded={openMenuId === user.id}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getRoleStyle(user.role)}`}
                    >
                      {user.role}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(user.status)}`}
                    >
                      {user.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Created {formatDate(user.createdAt)}
                  </p>

                  {openMenuId === user.id && (
                    <div className="rounded-lg bg-slate-50 p-2">
                      <button
                        type="button"
                        onClick={() => openDetails(user)}
                        className="w-full rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-white"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created At</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user, index) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{user.id}</p>
                      </td>

                      <td className="px-4 py-4 text-slate-600">{user.email}</td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getRoleStyle(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(user.status)}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {user.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="relative px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === user.id ? null : user.id)
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                          aria-label={`Actions for ${user.name}`}
                          aria-expanded={openMenuId === user.id}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenuId === user.id && (
                          <div className="absolute right-8 top-12 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                            <button
                              type="button"
                              onClick={() => openDetails(user)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={15} />
                              View Details
                            </button>
                          </div>
                        )}
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
            Showing{' '}
            {filteredUsers.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1} –{' '}
            {Math.min(safeCurrentPage * pageSize, filteredUsers.length)} of{' '}
            {filteredUsers.length} users
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
                <option value={8}>8</option>
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

      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInviteModal()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2 id="invite-modal-title" className="text-xl font-bold text-slate-900">
                  Invite New User
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Send an invitation to join InfraTrack.
                </p>
              </div>

              <button
                type="button"
                onClick={closeInviteModal}
                disabled={isInviting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                aria-label="Close invitation form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="invite-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  maxLength={255}
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="Enter user's email address"
                  disabled={isInviting}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="invite-role"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Assign Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(event.target.value as InvitationRoleName)
                  }
                  disabled={isInviting}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  {invitationRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                The invited person will receive an email with a secure link. They can use
                it to create their account and set their password. The invitation expires
                after seven days.
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={isInviting}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isInviting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2 id="user-modal-title" className="text-xl font-bold text-slate-900">
                  User Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">Review this user account.</p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-xs text-slate-400">Full Name</p>
                <p className="mt-1 font-semibold text-slate-900">{selectedUser.name}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="mt-1 break-all text-sm text-slate-700">
                  {selectedUser.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">User ID</p>
                <p className="mt-1 break-all text-sm text-slate-700">{selectedUser.id}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Role</p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleStyle(selectedUser.role)}`}
                >
                  {selectedUser.role}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400">Account Status</p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(selectedUser.status)}`}
                >
                  {selectedUser.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400">Created At</p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(selectedUser.createdAt)}
                </p>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
