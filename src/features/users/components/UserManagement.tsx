import { useMemo, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react'

import type { AppRole } from '#/features/navigation/navigation.config'

type ManagedRole = Exclude<AppRole, 'Viewer/Auditor'> | 'Viewer/Auditor'
type UserStatus = 'Active' | 'Invited' | 'Deactivated'

interface ManagedUser {
  id: string
  name: string
  email: string
  role: ManagedRole
  status: UserStatus
  createdAt: string
}

type ModalMode = 'invite' | 'edit' | 'role' | 'details' | null

const initialUsers: ManagedUser[] = [
  {
    id: 'USR-0001',
    name: 'Abdul Rahim',
    email: 'rahim@example.test',
    role: 'Administrator',
    status: 'Active',
    createdAt: '2026-11-01',
  },
  {
    id: 'USR-0002',
    name: 'Naveen K',
    email: 'naveen@example.test',
    role: 'Asset Manager',
    status: 'Active',
    createdAt: '2026-10-28',
  },
  {
    id: 'USR-0003',
    name: 'Satish M',
    email: 'satish@example.test',
    role: 'Technician',
    status: 'Active',
    createdAt: '2026-10-25',
  },
  {
    id: 'USR-0004',
    name: 'Divya N',
    email: 'divya@example.test',
    role: 'Viewer/Auditor',
    status: 'Active',
    createdAt: '2026-10-20',
  },
  {
    id: 'USR-0005',
    name: 'Arun P',
    email: 'arun@example.test',
    role: 'Asset Manager',
    status: 'Deactivated',
    createdAt: '2026-09-28',
  },
  {
    id: 'USR-0006',
    name: 'Karthick S',
    email: 'karthick@example.test',
    role: 'Technician',
    status: 'Active',
    createdAt: '2026-09-25',
  },
  {
    id: 'USR-0007',
    name: 'Meera R',
    email: 'meera@example.test',
    role: 'Viewer/Auditor',
    status: 'Active',
    createdAt: '2026-09-20',
  },
  {
    id: 'USR-0008',
    name: 'Rahul V',
    email: 'rahul@example.test',
    role: 'Administrator',
    status: 'Active',
    createdAt: '2026-09-18',
  },
]

const roles: ManagedRole[] = [
  'Administrator',
  'Asset Manager',
  'Technician',
  'Viewer/Auditor',
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

function getNextUserId(users: ManagedUser[]) {
  const highest = users.reduce((max, user) => {
    const match = user.id.match(/^USR-(\d+)$/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)

  return `USR-${String(highest + 1).padStart(4, '0')}`
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [pageSize, setPageSize] = useState(8)
  const [currentPage, setCurrentPage] = useState(1)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<ManagedRole>('Technician')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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

  function closeModal() {
    setModalMode(null)
    setSelectedUserId(null)
    setFormError('')
    setName('')
    setEmail('')
    setSelectedRole('Technician')
  }

  function openInviteModal() {
    setSuccessMessage('')
    setName('')
    setEmail('')
    setSelectedRole('Technician')
    setFormError('')
    setModalMode('invite')
  }

  function openUserAction(user: ManagedUser, mode: Exclude<ModalMode, 'invite' | null>) {
    setSelectedUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    setSelectedRole(user.role)
    setFormError('')
    setOpenMenuId(null)
    setModalMode(mode)
  }

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    const normalizedEmail = email.trim().toLowerCase()

    if (!name.trim()) {
      setFormError("Please enter the user's full name.")
      return
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      setFormError('A user or invitation with this email already exists.')
      return
    }

    const newUser: ManagedUser = {
      id: getNextUserId(users),
      name: name.trim(),
      email: normalizedEmail,
      role: selectedRole,
      status: 'Invited',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setUsers((previous) => [...previous, newUser])
    setSuccessMessage(`Invitation for ${normalizedEmail} has been created.`)
    closeModal()
    clearFilters()
  }

  function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedUser) return

    const normalizedEmail = email.trim().toLowerCase()

    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Enter a valid name and email address.')
      return
    }

    const duplicate = users.some(
      (user) =>
        user.id !== selectedUser.id && user.email.toLowerCase() === normalizedEmail,
    )

    if (duplicate) {
      setFormError('Another user already has this email address.')
      return
    }

    setUsers((previous) =>
      previous.map((user) =>
        user.id === selectedUser.id
          ? { ...user, name: name.trim(), email: normalizedEmail }
          : user,
      ),
    )

    setSuccessMessage('User details updated.')
    closeModal()
  }

  function handleRoleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedUser) return

    setUsers((previous) =>
      previous.map((user) =>
        user.id === selectedUser.id ? { ...user, role: selectedRole } : user,
      ),
    )

    setSuccessMessage(`Role updated for ${selectedUser.name}.`)
    closeModal()
  }

  function toggleUserStatus(user: ManagedUser) {
    const nextStatus: UserStatus =
      user.status === 'Deactivated' ? 'Active' : 'Deactivated'

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id ? { ...item, status: nextStatus } : item,
      ),
    )

    setOpenMenuId(null)
    setSuccessMessage(`${user.name} has been ${nextStatus.toLowerCase()}.`)
  }

  function handleResetPassword(user: ManagedUser) {
    setOpenMenuId(null)
    setSuccessMessage(
      `Password reset action prepared for ${user.email}. Actual email delivery will be added with backend integration.`,
    )
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
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                  {card.value}
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
            {filteredUsers.length} users
          </span>
        </div>

        {paginatedUsers.length === 0 ? (
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
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2">
                      <button
                        type="button"
                        onClick={() => openUserAction(user, 'details')}
                        className="rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-white"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openUserAction(user, 'edit')}
                        className="rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-white"
                      >
                        Edit User
                      </button>
                      <button
                        type="button"
                        onClick={() => openUserAction(user, 'role')}
                        className="rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-white"
                      >
                        Change Role
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(user)}
                        className="rounded-md px-2 py-2 text-left text-xs text-slate-700 hover:bg-white"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user)}
                        className="col-span-2 rounded-md px-2 py-2 text-left text-xs font-medium text-red-600 hover:bg-white"
                      >
                        {user.status === 'Deactivated'
                          ? 'Activate User'
                          : 'Deactivate User'}
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
                              onClick={() => openUserAction(user, 'details')}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={15} /> View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => openUserAction(user, 'edit')}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil size={15} /> Edit User
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(user)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <RefreshCw size={15} /> Reset Password
                            </button>
                            <button
                              type="button"
                              onClick={() => openUserAction(user, 'role')}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <ShieldCheck size={15} /> Change Role
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              type="button"
                              onClick={() => toggleUserStatus(user)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                              {user.status === 'Deactivated'
                                ? 'Activate User'
                                : 'Deactivate User'}
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

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
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
                  {modalMode === 'invite' && 'Invite New User'}
                  {modalMode === 'edit' && 'Edit User Details'}
                  {modalMode === 'role' && 'Change User Role'}
                  {modalMode === 'details' && 'User Details'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalMode === 'invite'
                    ? 'Send an invitation with an assigned role.'
                    : 'Review or update this user account.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {modalMode === 'details' && selectedUser ? (
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
                  <p className="mt-1 text-sm text-slate-700">{selectedUser.id}</p>
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
                    onClick={closeModal}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  modalMode === 'invite'
                    ? handleInvite
                    : modalMode === 'edit'
                      ? handleEdit
                      : handleRoleChange
                }
              >
                <div className="space-y-5 p-5 sm:p-6">
                  {(modalMode === 'invite' || modalMode === 'edit') && (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="user-name"
                          className="block text-sm font-semibold text-slate-700"
                        >
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="user-name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          maxLength={120}
                          required
                          placeholder="Enter full name"
                          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="user-email"
                          className="block text-sm font-semibold text-slate-700"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="user-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          maxLength={255}
                          required
                          placeholder="name@example.com"
                          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </>
                  )}

                  {(modalMode === 'invite' || modalMode === 'role') && (
                    <div className="space-y-2">
                      <label
                        htmlFor="user-role"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Assign Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="user-role"
                        value={selectedRole}
                        onChange={(event) =>
                          setSelectedRole(event.target.value as ManagedRole)
                        }
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {roles.map((role) => (
                          <option key={role}>{role}</option>
                        ))}
                      </select>
                      {modalMode === 'invite' && (
                        <p className="text-xs text-slate-400">
                          The invited user receives this role after accepting the
                          invitation.
                        </p>
                      )}
                    </div>
                  )}

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                    >
                      {formError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {modalMode === 'invite'
                      ? 'Create Invitation'
                      : modalMode === 'edit'
                        ? 'Save Changes'
                        : 'Update Role'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
