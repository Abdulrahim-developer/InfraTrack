import { useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Search,
  Settings,
  Wrench,
  X,
} from 'lucide-react'

import {
  assetInventory,
  currentMockTechnicianId,
  maintenanceRecords,
} from '#/features/dashboard/data/dashboard.mock'
import type { AppRole } from '#/features/navigation/navigation.config'

type MaintenanceType = 'Preventive' | 'Corrective' | 'Inspection' | 'Repair'

interface MaintenanceRecord {
  id: string
  assetId: string
  performedBy: string
  maintenanceType: string
  description: string
  performedAt: string
}

interface MaintenanceUser {
  id: string
  name: string
  email: string
}

interface MaintenanceManagementProps {
  role: AppRole
}

const mockUsers: MaintenanceUser[] = [
  {
    id: currentMockTechnicianId,
    name: 'Karthick',
    email: 'karthick@example.test',
  },
  {
    id: 'user-technician-02',
    name: 'Arun',
    email: 'arun@example.test',
  },
]

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

function getNextRecordId(records: MaintenanceRecord[]) {
  const highestNumber = records.reduce((highest, record) => {
    const match = record.id.match(/^MT-(\d+)$/)
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)

  return `MT-${String(highestNumber + 1).padStart(4, '0')}`
}

function getPerformerName(userId: string) {
  return mockUsers.find((user) => user.id === userId)?.name ?? 'Unknown User'
}

function getPerformerEmail(userId: string) {
  return mockUsers.find((user) => user.id === userId)?.email ?? ''
}

function getTypeStyle(type: string) {
  if (type === 'Preventive' || type === 'Inspection') {
    return 'bg-emerald-50 text-emerald-700'
  }

  return 'bg-orange-50 text-orange-700'
}

export default function MaintenanceManagement({ role }: MaintenanceManagementProps) {
  const canCreate = role !== 'Viewer/Auditor'
  const isTechnician = role === 'Technician'

  const [records, setRecords] = useState<MaintenanceRecord[]>(() =>
    maintenanceRecords.map((record) => ({ ...record })),
  )

  const [search, setSearch] = useState('')
  const [assetTypeFilter, setAssetTypeFilter] = useState('All Types')
  const [maintenanceTypeFilter, setMaintenanceTypeFilter] = useState('All Types')
  const [dateFilter, setDateFilter] = useState('30')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [selectedType, setSelectedType] = useState<MaintenanceType>('Preventive')
  const [description, setDescription] = useState('')
  const [performedBy, setPerformedBy] = useState(
    isTechnician ? currentMockTechnicianId : '',
  )
  const [performedDate, setPerformedDate] = useState(getTodayDate())
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const rows = useMemo(
    () =>
      records.flatMap((record) => {
        const asset = assetInventory.find((item) => item.id === record.assetId)

        if (!asset) return []

        return [
          {
            ...record,
            assetName: asset.name,
            assetType: asset.type,
            assetShortId: asset.id.slice(0, 8).toUpperCase(),
            serialNumber: asset.serialNumber,
            performerName: getPerformerName(record.performedBy),
            performerEmail: getPerformerEmail(record.performedBy),
          },
        ]
      }),
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
        const matchesSearch =
          !query ||
          record.id.toLowerCase().includes(query) ||
          record.assetName.toLowerCase().includes(query) ||
          record.assetShortId.toLowerCase().includes(query) ||
          record.assetId.toLowerCase().includes(query) ||
          record.serialNumber.toLowerCase().includes(query) ||
          record.performerName.toLowerCase().includes(query) ||
          record.description.toLowerCase().includes(query)

        const matchesAssetType =
          assetTypeFilter === 'All Types' || record.assetType === assetTypeFilter

        const matchesMaintenanceType =
          maintenanceTypeFilter === 'All Types' ||
          record.maintenanceType === maintenanceTypeFilter

        const recordDate = new Date(record.performedAt)
        const matchesDate = dateFilter === 'all' || recordDate >= cutoff

        return matchesSearch && matchesAssetType && matchesMaintenanceType && matchesDate
      })
      .sort(
        (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
      )
  }, [rows, search, assetTypeFilter, maintenanceTypeFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedRecords = filteredRecords.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const availableAssets = assetInventory.filter((asset) => asset.status !== 'Retired')

  function clearFilters() {
    setSearch('')
    setAssetTypeFilter('All Types')
    setMaintenanceTypeFilter('All Types')
    setDateFilter('30')
    setCurrentPage(1)
  }

  function resetForm() {
    setSelectedAssetId('')
    setSelectedType('Preventive')
    setDescription('')
    setPerformedBy(isTechnician ? currentMockTechnicianId : '')
    setPerformedDate(getTodayDate())
    setFormError('')
  }

  function openModal() {
    resetForm()
    setSuccessMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setFormError('')
  }

  function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
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

    if (!performedDate) {
      setFormError('Please select the performed date.')
      return
    }

    if (!performedBy) {
      setFormError('Please select who performed the maintenance.')
      return
    }

    const selectedAsset = assetInventory.find((asset) => asset.id === selectedAssetId)

    if (!selectedAsset || selectedAsset.status === 'Retired') {
      setFormError('Please select a valid non-retired asset.')
      return
    }

    if (performedDate > getTodayDate()) {
      setFormError('The performed date cannot be in the future.')
      return
    }

    const newRecord: MaintenanceRecord = {
      id: getNextRecordId(records),
      assetId: selectedAssetId,
      performedBy: isTechnician ? currentMockTechnicianId : performedBy,
      maintenanceType: selectedType,
      description: description.trim(),
      performedAt: new Date(`${performedDate}T12:00:00`).toISOString(),
    }

    setRecords((previous) => [...previous, newRecord])
    setSuccessMessage(`${newRecord.id} created successfully.`)
    closeModal()
    resetForm()
    clearFilters()
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
                  {card.value}
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
            <option>Router</option>
            <option>Server</option>
            <option>Switch</option>
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
            {filteredRecords.length} records
          </span>
        </div>

        {paginatedRecords.length === 0 ? (
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
                <article key={record.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-600">{record.id}</p>
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
                    <tr key={record.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-slate-400">
                        {(safeCurrentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {record.id}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{record.assetName}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {record.assetShortId} · {record.serialNumber}
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
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose an asset</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} · {asset.id.slice(0, 8).toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {selectedAssetId && (
                    <p className="text-xs text-slate-500">
                      {assetInventory.find((asset) => asset.id === selectedAssetId)?.type}{' '}
                      ·{' '}
                      {
                        assetInventory.find((asset) => asset.id === selectedAssetId)
                          ?.location
                      }
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
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Corrective">Corrective</option>
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
                    maxLength={2000}
                    rows={4}
                    placeholder="Describe the completed maintenance work..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-xs text-slate-400">Maximum 2,000 characters.</p>
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
                      Karthick (You)
                    </div>
                  ) : (
                    <select
                      id="maintenance-performer"
                      value={performedBy}
                      onChange={(event) => setPerformedBy(event.target.value)}
                      required
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Choose a technician</option>
                      {mockUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} — {user.email}
                        </option>
                      ))}
                    </select>
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
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Maintenance Record
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
