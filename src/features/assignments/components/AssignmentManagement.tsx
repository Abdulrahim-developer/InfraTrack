import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Search,
  RotateCcw,
  UserRound,
  X,
} from 'lucide-react'

import { listAssets } from '#/features/assets/server/list-assets'
import { listAssignmentUsers } from '#/features/assignments/server/list-assignment-users'
import { listAssignments } from '#/features/assignments/server/list-assignments'
import { createAssignment } from '#/features/assignments/server/create-assignment'
import { returnAssignment } from '#/features/assignments/server/return-assignment'

type AssignmentStatus = 'Assigned' | 'Returned'
type AssetType = string
type RecipientType = 'user' | 'department'
type AppRole = 'Administrator' | 'Asset Manager' | 'Technician' | 'Viewer/Auditor'

interface AssignmentRecord {
  id: string
  assetId: string
  assignedToUserId: string | null
  assignedToDepartment: string | null
  assignedAt: string
  returnedAt: string | null
  assetName: string
  assetType: string
  serialNumber: string | null
  assignedUserName: string | null
  assignedUserEmail: string | null
}

interface AssignmentAsset {
  id: string
  name: string
  type: string
  serialNumber: string
  location: string
  status: string
}

interface AssignmentUser {
  id: string
  name: string
  email: string
  accountStatus: string
  roles: string[]
}

interface AssignmentManagementProps {
  initialAssetId?: string
  initialAction?: 'view' | 'create'
  userRole: AppRole
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function AssignmentManagement({
  initialAssetId,
  initialAction,
  userRole,
}: AssignmentManagementProps) {
  const canManageAssignments =
    userRole === 'Administrator' || userRole === 'Asset Manager'

  const [assets, setAssets] = useState<AssignmentAsset[]>([])
  const [assignmentRecords, setAssignmentRecords] = useState<AssignmentRecord[]>([])
  const [assignmentUsers, setAssignmentUsers] = useState<AssignmentUser[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [dataLoadError, setDataLoadError] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersLoadError, setUsersLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [returnError, setReturnError] = useState('')

  async function refreshAssignmentData() {
    const [assignmentResult, assetResult] = await Promise.all([
      listAssignments(),
      listAssets({
        data: {
          search: '',
          type: '',
          status: 'Active',
          location: '',
          page: 1,
          pageSize: 100,
        },
      }),
    ])

    setAssignmentRecords(
      assignmentResult.data.map((record) => ({
        id: record.assignmentId,
        assetId: record.assetId,
        assignedToUserId: record.assignedToUserId,
        assignedToDepartment: record.assignedToDepartment,
        assignedAt: record.assignedAt,
        returnedAt: record.returnedAt,
        assetName: record.assetName,
        assetType: record.assetType,
        serialNumber: record.serialNumber,
        assignedUserName: record.assignedUserName,
        assignedUserEmail: record.assignedUserEmail,
      })),
    )

    setAssets(
      assetResult.data.map((asset) => ({
        id: asset.assetId,
        name: asset.assetName,
        type: asset.assetType,
        serialNumber: asset.serialNumber ?? '',
        location: asset.location ?? '',
        status: asset.status,
      })),
    )
  }

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setIsLoadingData(true)
      setDataLoadError('')

      try {
        await refreshAssignmentData()
      } catch (error) {
        if (isMounted) {
          setDataLoadError(
            error instanceof Error ? error.message : 'Unable to load assignment data.',
          )
        }
      } finally {
        if (isMounted) setIsLoadingData(false)
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [userFilter, setUserFilter] = useState('All Users')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [isModalOpen, setIsModalOpen] = useState(
    Boolean(canManageAssignments && initialAssetId && initialAction === 'create'),
  )
  const [recipientType, setRecipientType] = useState<RecipientType>('user')
  const [selectedAssetId, setSelectedAssetId] = useState(initialAssetId ?? '')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('')
  const [userSearch, setUserSearch] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [assignmentDate, setAssignmentDate] = useState(getTodayDate())
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [assignmentToReturn, setAssignmentToReturn] = useState<string | null>(null)

  useEffect(() => {
    if (!isModalOpen || !canManageAssignments) return

    let isMounted = true

    async function loadAssignmentUsers() {
      setIsLoadingUsers(true)
      setUsersLoadError('')

      try {
        const result = await listAssignmentUsers()
        if (isMounted) setAssignmentUsers(result.data)
      } catch (error) {
        if (isMounted) {
          setUsersLoadError(
            error instanceof Error ? error.message : 'Unable to load active users.',
          )
        }
      } finally {
        if (isMounted) setIsLoadingUsers(false)
      }
    }

    void loadAssignmentUsers()

    return () => {
      isMounted = false
    }
  }, [isModalOpen, canManageAssignments])

  const assignmentRows = useMemo(
    () =>
      assignmentRecords.map((assignment) => ({
        ...assignment,
        assetShortId: assignment.assetId.slice(0, 8).toUpperCase(),
        assignedUser:
          assignment.assignedUserName ??
          assignment.assignedToDepartment ??
          'Unknown recipient',
        assignedEmail: assignment.assignedUserEmail ?? '',
        status: (assignment.returnedAt ? 'Returned' : 'Assigned') as AssignmentStatus,
      })),
    [assignmentRecords],
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
      const matchesAsset =
        initialAction !== 'view' || !initialAssetId || item.assetId === initialAssetId

      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.assetName.toLowerCase().includes(query) ||
        item.assetShortId.toLowerCase().includes(query) ||
        item.assetId.toLowerCase().includes(query) ||
        (item.serialNumber ?? '').toLowerCase().includes(query) ||
        item.assignedUser.toLowerCase().includes(query) ||
        (item.assignedEmail ?? '').toLowerCase().includes(query)

      const matchesType = typeFilter === 'All Types' || item.assetType === typeFilter
      const matchesStatus = statusFilter === 'All Status' || item.status === statusFilter
      const matchesUser = userFilter === 'All Users' || item.assignedUser === userFilter

      return matchesAsset && matchesSearch && matchesType && matchesStatus && matchesUser
    })
  }, [
    assignmentRows,
    initialAction,
    initialAssetId,
    search,
    typeFilter,
    statusFilter,
    userFilter,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedAssignments = filteredAssignments.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const users = [...new Set(assignmentRows.map((item) => item.assignedUser))]
  const availableAssets = assets.filter((asset) => asset.status === 'Active')
  const assetTypes: AssetType[] = [...new Set(assets.map((asset) => asset.type))].sort()
  const availableRoles = [...new Set(assignmentUsers.flatMap((user) => user.roles))]

  const filteredUsers = assignmentUsers.filter((user) => {
    const matchesRole = Boolean(selectedRole) && user.roles.includes(selectedRole)
    const query = userSearch.trim().toLowerCase()

    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)

    return matchesRole && matchesSearch
  })

  function clearFilters() {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
    setUserFilter('All Users')
    setCurrentPage(1)
  }

  function resetForm() {
    setRecipientType('user')
    setSelectedAssetId(initialAssetId ?? '')
    setSelectedUserId('')
    setSelectedRole('')
    setUserSearch('')
    setDepartmentName('')
    setAssignmentDate(getTodayDate())
    setFormError('')
  }

  function openAssignmentModal() {
    if (!canManageAssignments) return

    resetForm()
    setSuccessMessage('')
    setIsModalOpen(true)
  }

  function closeAssignmentModal() {
    setIsModalOpen(false)
    setFormError('')
  }

  async function handleReturnAssignment() {
    if (!canManageAssignments || !assignmentToReturn || isReturning) return

    setIsReturning(true)
    setReturnError('')
    setSuccessMessage('')

    try {
      const result = await returnAssignment({
        data: {
          assignmentId: assignmentToReturn,
        },
      })

      await refreshAssignmentData()

      setAssignmentToReturn(null)
      setSuccessMessage(result.message)
    } catch (error) {
      setReturnError(
        error instanceof Error ? error.message : 'Unable to return this asset.',
      )
    } finally {
      setIsReturning(false)
    }
  }

  async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageAssignments) return

    setFormError('')
    setSuccessMessage('')

    if (!selectedAssetId) {
      setFormError('Please select an asset.')
      return
    }

    if (!assignmentDate) {
      setFormError('Please select an assignment date.')
      return
    }

    if (recipientType === 'user' && !selectedUserId) {
      setFormError('Please select a user.')
      return
    }

    if (recipientType === 'department' && !departmentName.trim()) {
      setFormError('Please enter a department name.')
      return
    }

    const selectedAsset = assets.find((asset) => asset.id === selectedAssetId)

    if (!selectedAsset || selectedAsset.status !== 'Active') {
      setFormError('Only active assets can be assigned.')
      return
    }

    const currentAssignment = assignmentRecords.find(
      (record) => record.assetId === selectedAssetId && !record.returnedAt,
    )

    if (currentAssignment) {
      setFormError(
        'This asset is currently assigned. Return it before creating a new assignment.',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createAssignment({
        data: {
          assetId: selectedAssetId,
          recipientType,
          ...(recipientType === 'user'
            ? { userId: selectedUserId }
            : { departmentName: departmentName.trim() }),
          assignmentDate,
        },
      })

      await refreshAssignmentData()

      setSuccessMessage(
        `${result.message} Assignment ID: ${result.data.assignmentId.slice(0, 8).toUpperCase()}`,
      )

      closeAssignmentModal()
      resetForm()
      clearFilters()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Unable to create assignment.',
      )
    } finally {
      setIsSubmitting(false)
    }
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

        {canManageAssignments && (
          <button
            type="button"
            onClick={openAssignmentModal}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span>
            New Assignment
          </button>
        )}
      </section>

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 size={18} />
          {successMessage}
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="ml-auto rounded p-1 hover:bg-emerald-100"
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {dataLoadError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {dataLoadError}
        </p>
      )}

      {isLoadingData && (
        <p className="text-sm text-slate-500">Loading assignment records...</p>
      )}

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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedAssignments.map((item) => (
                <article key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600">
                        {item.id.slice(0, 8).toUpperCase()}
                      </p>
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
                      <p className="mt-1 font-medium text-slate-700">
                        {item.assignedUser}
                      </p>
                      {item.assignedEmail && (
                        <p className="mt-0.5 break-all text-xs text-slate-400">
                          {item.assignedEmail}
                        </p>
                      )}
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

                  {canManageAssignments && !item.returnedAt && (
                    <button
                      type="button"
                      disabled={isReturning}
                      onClick={() => {
                        setReturnError('')
                        setAssignmentToReturn(item.id)
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RotateCcw size={15} />
                      Return Asset
                    </button>
                  )}
                </article>
              ))}
            </div>

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
                    <th className="px-4 py-3 font-medium">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAssignments.map((item, index) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4 font-medium text-blue-600">
                        {item.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{item.assetName}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.assetShortId}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{item.assetType}</td>
                      <td className="px-4 py-4 text-slate-600">
                        <div className="inline-flex items-center gap-2">
                          <UserRound size={16} className="shrink-0 text-slate-400" />
                          <div>
                            <p>{item.assignedUser}</p>
                            {item.assignedEmail && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {item.assignedEmail}
                              </p>
                            )}
                          </div>
                        </div>
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
                        {canManageAssignments && !item.returnedAt && (
                          <button
                            type="button"
                            disabled={isReturning}
                            onClick={() => {
                              setReturnError('')
                              setAssignmentToReturn(item.id)
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RotateCcw size={13} />
                            Return
                          </button>
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

      {canManageAssignments && isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAssignmentModal()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-modal-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2
                  id="assignment-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  New Asset Assignment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assign an active asset to a user or department.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssignmentModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close assignment form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="space-y-2">
                  <label
                    htmlFor="assignment-asset"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Select Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="assignment-asset"
                    value={selectedAssetId}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose an active asset</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} · {asset.id.slice(0, 8).toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {selectedAssetId && (
                    <p className="text-xs text-slate-500">
                      {assets.find((asset) => asset.id === selectedAssetId)?.type} ·{' '}
                      {assets.find((asset) => asset.id === selectedAssetId)?.location}
                    </p>
                  )}
                  {availableAssets.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No active assets are currently available for assignment.
                    </p>
                  )}
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-700">
                    Assign To <span className="text-red-500">*</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition ${
                        recipientType === 'user'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipientType"
                        value="user"
                        checked={recipientType === 'user'}
                        onChange={() => {
                          setRecipientType('user')
                          setFormError('')
                        }}
                        className="accent-blue-600"
                      />
                      Individual User
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition ${
                        recipientType === 'department'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="recipientType"
                        value="department"
                        checked={recipientType === 'department'}
                        onChange={() => {
                          setRecipientType('department')
                          setFormError('')
                        }}
                        className="accent-blue-600"
                      />
                      Department
                    </label>
                  </div>
                </fieldset>

                {recipientType === 'user' ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label
                        htmlFor="assignment-role"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Select Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="assignment-role"
                        value={selectedRole}
                        onChange={(event) => {
                          setSelectedRole(event.target.value as AppRole | '')
                          setSelectedUserId('')
                          setUserSearch('')
                          setFormError('')
                        }}
                        required
                        disabled={isLoadingUsers || availableRoles.length === 0}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                      >
                        <option value="">Choose a role</option>
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {isLoadingUsers && (
                        <p className="text-xs text-slate-500">Loading active users...</p>
                      )}
                      {usersLoadError && (
                        <p role="alert" className="text-xs text-red-600">
                          {usersLoadError}
                        </p>
                      )}
                      {!isLoadingUsers &&
                        !usersLoadError &&
                        availableRoles.length === 0 && (
                          <p className="text-xs text-amber-600">
                            No active users with assigned application roles were found.
                          </p>
                        )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="assignment-user-search"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Search User
                      </label>
                      <div className="relative">
                        <Search
                          size={17}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          id="assignment-user-search"
                          type="search"
                          value={userSearch}
                          onChange={(event) => setUserSearch(event.target.value)}
                          disabled={!selectedRole}
                          placeholder="Search by name or email..."
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="assignment-user"
                        className="block text-sm font-semibold text-slate-700"
                      >
                        Select User <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="assignment-user"
                        value={selectedUserId}
                        onChange={(event) => setSelectedUserId(event.target.value)}
                        disabled={
                          !selectedRole ||
                          isLoadingUsers ||
                          Boolean(usersLoadError) ||
                          filteredUsers.length === 0
                        }
                        required
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                      >
                        <option value="">
                          {!selectedRole ? 'Choose a role first' : 'Choose a user'}
                        </option>
                        {filteredUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} — {user.email}
                          </option>
                        ))}
                      </select>
                      {selectedRole &&
                        !isLoadingUsers &&
                        !usersLoadError &&
                        filteredUsers.length === 0 && (
                          <p className="text-xs text-amber-600">
                            No users found for this role and search.
                          </p>
                        )}
                      <p className="text-xs text-slate-400">
                        Users are filtered by application role. Search using their name or
                        email.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="assignment-department"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Department Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="assignment-department"
                      type="text"
                      value={departmentName}
                      onChange={(event) => setDepartmentName(event.target.value)}
                      maxLength={120}
                      required
                      placeholder="e.g. Network Operations"
                      className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="text-xs text-slate-400">Maximum 120 characters.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="assignment-date"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Assignment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="assignment-date"
                    type="date"
                    value={assignmentDate}
                    onChange={(event) => setAssignmentDate(event.target.value)}
                    required
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

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
                  onClick={closeAssignmentModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableAssets.length === 0 || isSubmitting || isLoadingData}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {canManageAssignments && assignmentToReturn && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isReturning) {
              setAssignmentToReturn(null)
              setReturnError('')
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="return-dialog-title"
            aria-describedby="return-dialog-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <RotateCcw size={23} />
              </div>

              <div className="min-w-0">
                <h2 id="return-dialog-title" className="text-lg font-bold text-slate-900">
                  Return Asset?
                </h2>

                <p
                  id="return-dialog-description"
                  className="mt-2 text-sm leading-6 text-slate-500"
                >
                  Are you sure you want to return this asset? This will close its active
                  assignment and record the return date.
                </p>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Assignment ID: {assignmentToReturn.slice(0, 8).toUpperCase()}
                </p>

                {returnError && (
                  <p
                    role="alert"
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {returnError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isReturning}
                onClick={() => {
                  setAssignmentToReturn(null)
                  setReturnError('')
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isReturning}
                onClick={handleReturnAssignment}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                {isReturning ? 'Returning...' : 'Confirm Return'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
