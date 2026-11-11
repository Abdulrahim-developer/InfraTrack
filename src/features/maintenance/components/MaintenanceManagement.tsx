import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Search,
  Settings,
  Wrench,
  X,
} from 'lucide-react'

import { listAssets } from '#/features/assets/server/list-assets'
import { listAssignmentUsers } from '#/features/assignments/server/list-assignment-users'
import { createMaintenanceRecord } from '#/features/maintenance/server/create-maintenance-record'
import { listMaintenanceRecords } from '#/features/maintenance/server/list-maintenance-records'
import type { AppRole } from '#/features/navigation/navigation.config'

type MaintenanceType = 'Preventive' | 'Corrective' | 'Inspection' | 'Repair'

interface MaintenanceRecord {
  maintenanceId: string
  assetId: string
  assetName: string
  assetType: string
  serialNumber: string | null
  performedBy: string
  performedByName: string
  performedByEmail: string
  maintenanceType: string
  description: string
  performedAt: string
}

interface MaintenanceAsset {
  assetId: string
  assetName: string
  assetType: string
  serialNumber: string | null
  location: string | null
  status: string
}

interface MaintenanceUser {
  id: string
  name: string
  email: string
  roles: string[]
}

interface MaintenanceManagementProps {
  role: AppRole
  initialAssetId?: string
  initialAction?: 'view' | 'create'
}

const maintenanceTypes: MaintenanceType[] = [
  'Preventive',
  'Corrective',
  'Inspection',
  'Repair',
]

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function getTodayDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getRecordDisplayId(maintenanceId: string) {
  return maintenanceId.slice(0, 8).toUpperCase()
}

function getTypeStyle(type: string) {
  if (type === 'Preventive' || type === 'Inspection') {
    return 'bg-emerald-50 text-emerald-700'
  }

  return 'bg-orange-50 text-orange-700'
}

export default function MaintenanceManagement({
  role,
  initialAssetId,
  initialAction,
}: MaintenanceManagementProps) {
  const canCreate =
    role === 'Administrator' || role === 'Asset Manager' || role === 'Technician'

  const isTechnician = role === 'Technician'
  const canSelectPerformer = role === 'Administrator' || role === 'Asset Manager'

  const [assets, setAssets] = useState<MaintenanceAsset[]>([])
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [technicians, setTechnicians] = useState<MaintenanceUser[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState('All Types')
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState('All Types')
  const [dateFilter, setDateFilter] = useState('30')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [isModalOpen, setIsModalOpen] = useState(
    Boolean(initialAssetId && initialAction === 'create' && canCreate),
  )
  const [selectedAssetId, setSelectedAssetId] = useState(initialAssetId ?? '')
  const [selectedType, setSelectedType] = useState<MaintenanceType>('Preventive')
  const [description, setDescription] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [performedDate, setPerformedDate] = useState(getTodayDate())
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadRecords() {
    const result = await listMaintenanceRecords({
      data: {},
    })

    setRecords(result.data)
  }

  useEffect(() => {
    let isMounted = true

    async function loadInitialData() {
      setIsLoading(true)
      setLoadError('')

      try {
        const [assetResult, recordResult, userResult] = await Promise.all([
          listAssets({
            data: {
              search: '',
              type: '',
              status: '',
              location: '',
              page: 1,
              pageSize: 100,
            },
          }),
          listMaintenanceRecords({
            data: {},
          }),
          canSelectPerformer ? listAssignmentUsers() : Promise.resolve(null),
        ])

        if (!isMounted) return

        setAssets(
          assetResult.data.map((asset) => ({
            assetId: asset.assetId,
            assetName: asset.assetName,
            assetType: asset.assetType,
            serialNumber: asset.serialNumber,
            location: asset.location,
            status: asset.status,
          })),
        )

        setRecords(recordResult.data)

        if (userResult) {
          setTechnicians(
            userResult.data.filter((user) => user.roles.includes('Technician')),
          )
        }
      } catch (error) {
        if (!isMounted) return

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load maintenance information.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      isMounted = false
    }
  }, [role, canSelectPerformer])

  useEffect(() => {
    const refreshRecords = async () => {
      if (document.visibilityState === 'visible') {
        try {
          await loadRecords()
        } catch (error) {
          console.error('Unable to refresh maintenance records:', error)
        }
      }
    }

    const intervalId = window.setInterval(() => {
      void refreshRecords()
    }, 30_000)

    document.addEventListener('visibilitychange', refreshRecords)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', refreshRecords)
    }
  }, [])

  const assetTypeOptions = useMemo(
    () => [...new Set(assets.map((asset) => asset.assetType))].sort(),
    [assets],
  )

  const rows = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        assetShortId: record.assetId.slice(0, 8).toUpperCase(),
        recordDisplayId: getRecordDisplayId(record.maintenanceId),
        performerName: record.performedByName,
        performerEmail: record.performedByEmail,
      })),
    [records],
  )

  const summary = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return {
      total: rows.length,
      preventive: rows.filter(
        (record) =>
          record.maintenanceType === 'Preventive' ||
          record.maintenanceType === 'Inspection',
      ).length,
      corrective: rows.filter(
        (record) =>
          record.maintenanceType === 'Corrective' || record.maintenanceType === 'Repair',
      ).length,
      thisMonth: rows.filter((record) => {
        const date = new Date(record.performedAt)

        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }).length,
    }
  }, [rows])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    const today = new Date()
    const cutoff = new Date(today)

    if (dateFilter !== 'all') {
      cutoff.setDate(today.getDate() - Number(dateFilter))
    }

    return rows
      .filter((record) => {
        const matchesAsset =
          initialAction !== 'view' || !initialAssetId || record.assetId === initialAssetId

        const matchesSearch =
          !query ||
          record.maintenanceId.toLowerCase().includes(query) ||
          record.recordDisplayId.toLowerCase().includes(query) ||
          record.assetName.toLowerCase().includes(query) ||
          record.assetShortId.toLowerCase().includes(query) ||
          record.assetId.toLowerCase().includes(query) ||
          (record.serialNumber ?? '').toLowerCase().includes(query) ||
          record.performerName.toLowerCase().includes(query) ||
          record.description.toLowerCase().includes(query)

        const matchesAssetType =
          assetTypeFilter === 'All Types' || record.assetType === assetTypeFilter

        const matchesMaintenanceType =
          maintenanceTypeFilter === 'All Types' ||
          record.maintenanceType === maintenanceTypeFilter

        const recordDate = new Date(record.performedAt)
        const matchesDate = dateFilter === 'all' || recordDate >= cutoff

        return (
          matchesAsset &&
          matchesSearch &&
          matchesAssetType &&
          matchesMaintenanceType &&
          matchesDate
        )
      })
      .sort(
        (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
      )
  }, [
    rows,
    search,
    assetTypeFilter,
    maintenanceTypeFilter,
    dateFilter,
    initialAction,
    initialAssetId,
  ])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedRecords = filteredRecords.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const availableAssets = assets.filter(
    (asset) => asset.status.toLowerCase() !== 'retired',
  )

  const selectedAsset = assets.find((asset) => asset.assetId === selectedAssetId)

  function clearFilters() {
    setSearch('')
    setAssetTypeFilter('All Types')
    setMaintenanceTypeFilter('All Types')
    setDateFilter('30')
    setCurrentPage(1)
  }

  function resetForm() {
    setSelectedAssetId(initialAssetId ?? '')
    setSelectedType('Preventive')
    setDescription('')
    setPerformedBy('')
    setPerformedDate(getTodayDate())
    setFormError('')
  }

  function openModal() {
    resetForm()
    setSuccessMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSubmitting) return

    setIsModalOpen(false)
    setFormError('')
  }

  async function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!selectedAssetId) {
      setFormError('Please select an asset.')
      return
    }

    if (!description.trim()) {
      setFormError('Please enter a maintenance description.')
      return
    }

    if (description.trim().length > 1000) {
      setFormError('Description cannot exceed 1,000 characters.')
      return
    }

    if (!performedDate) {
      setFormError('Please select the performed date.')
      return
    }

    if (canSelectPerformer && !performedBy) {
      setFormError('Please select who performed the maintenance.')
      return
    }

    if (performedDate > getTodayDate()) {
      setFormError('The performed date cannot be in the future.')
      return
    }

    if (!selectedAsset || selectedAsset.status.toLowerCase() === 'retired') {
      setFormError('Please select a valid non-retired asset.')
      return
    }

    if (
      canSelectPerformer &&
      !technicians.some((technician) => technician.id === performedBy)
    ) {
      setFormError('Please select an active Technician.')
      return
    }

    setIsSubmitting(true)

    try {
      const performedAt = new Date(`${performedDate}T12:00:00`).toISOString()

      const result = await createMaintenanceRecord({
        data: {
          assetId: selectedAssetId,
          ...(canSelectPerformer ? { performedBy } : {}),
          maintenanceType: selectedType,
          description: description.trim(),
          performedAt,
        },
      })

      await loadRecords()

      const displayId = getRecordDisplayId(result.data.maintenanceId)

      setSuccessMessage(`Maintenance record ${displayId} created successfully.`)

      setIsModalOpen(false)
      resetForm()
      clearFilters()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Unable to create the maintenance record.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const summaryCards = [
    {
      label: 'Total Records',
      value: summary.total,
      description: 'All completed maintenance records',
      icon: ClipboardList,
      style: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Preventive Maintenance',
      value: summary.preventive,
      description: 'Routine inspection and servicing',
      icon: Settings,
      style: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Corrective Maintenance',
      value: summary.corrective,
      description: 'Repair and issue resolution',
      icon: Wrench,
      style: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'This Month',
      value: summary.thisMonth,
      description: 'Records in the current month',
      icon: CalendarDays,
      style: 'bg-violet-50 text-violet-600',
    },
  ]

  return (
    <main className="min-w-0 space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Maintenance Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record and view completed maintenance history for infrastructure assets.
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={openModal}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="text-lg leading-none">+</span>
            Add Maintenance Record
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

      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {loadError}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-2 font-semibold underline"
          >
            Reload
          </button>
        </div>
      )}

      <section
        aria-label="Maintenance statistics"
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
                  {isLoading ? '—' : card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{card.description}</p>
              </div>
            </article>
          )
        })}
      </section>

      <section
        aria-label="Search and filter maintenance records"
        className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label className="relative min-w-0 xl:col-span-1">
          <span className="sr-only">Search maintenance records</span>
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
            placeholder="Search asset, record ID or technician..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by asset type</span>
          <select
            value={assetTypeFilter}
            onChange={(event) => {
              setAssetTypeFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Types</option>
            {assetTypeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by maintenance type</span>
          <select
            value={maintenanceTypeFilter}
            onChange={(event) => {
              setMaintenanceTypeFilter(event.target.value)
              setCurrentPage(1)
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option>All Types</option>
            {maintenanceTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Filter by date range</span>
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
            <h2 className="font-semibold text-slate-900">Maintenance Records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Completed maintenance activity and service history
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {isLoading ? 'Loading...' : `${filteredRecords.length} records`}
          </span>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Loading maintenance records...
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Wrench size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No maintenance records found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {paginatedRecords.map((record) => (
                <article key={record.maintenanceId} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600">
                        {record.recordDisplayId}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900">
                        {record.assetName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.assetType} · {record.assetShortId}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeStyle(record.maintenanceType)}`}
                    >
                      {record.maintenanceType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{record.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Performed By</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {record.performerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Performed Date</p>
                      <p className="mt-1 text-slate-700">
                        {formatDate(record.performedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Record ID</th>
                    <th className="px-4 py-3 font-medium">Asset</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Performed By</th>
                    <th className="px-4 py-3 font-medium">Performed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((record, index) => (
                    <tr
                      key={record.maintenanceId}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {record.recordDisplayId}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{record.assetName}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {record.assetShortId} ·{' '}
                          {record.serialNumber ?? 'No serial number'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${getTypeStyle(record.maintenanceType)}`}
                        >
                          {record.maintenanceType}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-4 text-slate-600">
                        {record.description}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-700">
                          {record.performerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {record.performerEmail}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(record.performedAt)}
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
            {filteredRecords.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1} –{' '}
            {Math.min(safeCurrentPage * pageSize, filteredRecords.length)} of{' '}
            {filteredRecords.length} records
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

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-modal-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div>
                <h2
                  id="maintenance-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add Maintenance Record
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Record maintenance work that has already been completed.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close maintenance form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRecord}>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="space-y-2">
                  <label
                    htmlFor="maintenance-asset"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Select Asset <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="maintenance-asset"
                    value={selectedAssetId}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose an asset</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.assetId} value={asset.assetId}>
                        {asset.assetName} · {asset.assetId.slice(0, 8).toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {selectedAsset && (
                    <p className="text-xs text-slate-500">
                      {selectedAsset.assetType} ·{' '}
                      {selectedAsset.location || 'Location not specified'}
                    </p>
                  )}
                  {availableAssets.length === 0 && !isLoading && (
                    <p className="text-xs text-amber-600">
                      No eligible assets are currently available.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="maintenance-type"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Maintenance Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="maintenance-type"
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(event.target.value as MaintenanceType)
                    }
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {maintenanceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="maintenance-description"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="maintenance-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    maxLength={1000}
                    rows={4}
                    disabled={isSubmitting}
                    placeholder="Describe the completed maintenance work..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-xs text-slate-400">
                    {description.length}/1,000 characters.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="maintenance-performer"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Performed By <span className="text-red-500">*</span>
                  </label>

                  {isTechnician ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      You (logged-in Technician)
                    </div>
                  ) : (
                    <select
                      id="maintenance-performer"
                      value={performedBy}
                      onChange={(event) => setPerformedBy(event.target.value)}
                      required
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Choose a Technician</option>
                      {technicians.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} — {user.email}
                        </option>
                      ))}
                    </select>
                  )}

                  {canSelectPerformer && technicians.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No active Technician accounts are available.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="maintenance-date"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Performed Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="maintenance-date"
                    type="date"
                    value={performedDate}
                    max={getTodayDate()}
                    onChange={(event) => setPerformedDate(event.target.value)}
                    required
                    disabled={isSubmitting}
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
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isLoading ||
                    availableAssets.length === 0 ||
                    (canSelectPerformer && technicians.length === 0)
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Maintenance Record'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
