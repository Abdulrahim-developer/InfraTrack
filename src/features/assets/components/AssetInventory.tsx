import { useMemo, useState, type FormEvent } from 'react'
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
import {
  currentMockTechnicianId,
  currentMockUserId,
  type AssetStatus,
  type AssetType,
} from '#/features/dashboard/data/dashboard.mock'
import {
  useAppData,
  type AppAssignment,
} from '#/features/dashboard/context/AppDataContext'

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

function getAssignedTo(assetId: string, assignments: AppAssignment[]) {
  const currentAssignment = assignments.find(
    (assignment) => assignment.assetId === assetId && assignment.returnedAt === null,
  )

  if (!currentAssignment) return 'Unassigned'

  if (currentAssignment.assignedToDepartment) {
    return currentAssignment.assignedToDepartment
  }

  if (currentAssignment.assignedToUserId === currentMockUserId) {
    return 'Rahim'
  }

  if (currentAssignment.assignedToUserId === currentMockTechnicianId) {
    return 'Karthick'
  }

  return 'Assigned User'
}

export default function AssetInventory({ role }: AssetInventoryProps) {
  const { assets, setAssets, assignments } = useAppData()

  const canManageAssets = role === 'Administrator' || role === 'Asset Manager'

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [locationFilter, setLocationFilter] = useState('All Locations')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<AssetType>('Router')
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editStatus, setEditStatus] = useState<AssetStatus>('Active')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [retiringAssetId, setRetiringAssetId] = useState<string | null>(null)

  const locations = useMemo(
    () => [...new Set(assets.map((asset) => asset.location))].sort(),
    [assets],
  )

  const summary = useMemo(
    () => ({
      total: assets.length,
      active: assets.filter((asset) => asset.status === 'Active').length,
      maintenance: assets.filter((asset) => asset.status === 'Maintenance').length,
      storage: assets.filter((asset) => asset.status === 'In Storage').length,
      retired: assets.filter((asset) => asset.status === 'Retired').length,
    }),
    [assets],
  )

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return assets.filter((asset) => {
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
  }, [assets, search, typeFilter, statusFilter, locationFilter])

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
    setLocationFilter('All Locations')
    setCurrentPage(1)
  }

  function openEditModal(assetId: string) {
    const asset = assets.find((item) => item.id === assetId)
    if (!asset) return

    setEditingAssetId(asset.id)
    setEditName(asset.name)
    setEditType(asset.type)
    setEditSerialNumber(asset.serialNumber)
    setEditLocation(asset.location)
    setEditStatus(asset.status)
    setFormError('')
    setSuccessMessage('')
  }

  function closeEditModal() {
    setEditingAssetId(null)
    setFormError('')
  }

  function handleEditAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageAssets || !editingAssetId) return

    if (!editName.trim() || !editSerialNumber.trim() || !editLocation.trim()) {
      setFormError('Please complete all required fields.')
      return
    }

    setAssets((previousAssets) =>
      previousAssets.map((asset) =>
        asset.id === editingAssetId
          ? {
              ...asset,
              name: editName.trim(),
              type: editType,
              serialNumber: editSerialNumber.trim(),
              location: editLocation.trim(),
              status: editStatus,
            }
          : asset,
      ),
    )

    closeEditModal()
    setSuccessMessage('Asset updated successfully.')
  }

  function confirmRetirement() {
    if (!canManageAssets || !retiringAssetId) return

    setAssets((previousAssets) =>
      previousAssets.map((asset) =>
        asset.id === retiringAssetId
          ? { ...asset, status: 'Retired' as AssetStatus }
          : asset,
      ),
    )

    setRetiringAssetId(null)
    setSuccessMessage('Asset retired successfully.')
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
            {filteredAssets.length} assets
          </span>
        </div>

        {paginatedAssets.length === 0 ? (
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
                    <div>
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="mt-1 break-words text-slate-600">{asset.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Assigned To</p>
                      <p className="mt-1 text-slate-600">
                        {getAssignedTo(asset.id, assignments)}
                      </p>
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
                    {canManageAssets && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(asset.id)}
                          className="font-medium text-slate-600 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        {asset.status !== 'Retired' && (
                          <button
                            type="button"
                            onClick={() => setRetiringAssetId(asset.id)}
                            className="font-medium text-red-600 hover:text-red-700"
                          >
                            Retire
                          </button>
                        )}
                      </>
                    )}
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
                        {getAssignedTo(asset.id, assignments)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to="/assets/$assetId"
                            params={{ assetId: asset.id }}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                          {canManageAssets && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(asset.id)}
                                className="font-medium text-slate-600 hover:text-blue-600"
                              >
                                Edit
                              </button>
                              {asset.status !== 'Retired' && (
                                <button
                                  type="button"
                                  onClick={() => setRetiringAssetId(asset.id)}
                                  className="font-medium text-red-600 hover:text-red-700"
                                >
                                  Retire
                                </button>
                              )}
                            </>
                          )}
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {editingAssetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditModal()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-asset-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 id="edit-asset-title" className="text-xl font-bold text-slate-900">
                  Edit Asset
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the asset information.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close edit form"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditAsset} className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="edit-asset-name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Asset Name
                </label>
                <input
                  id="edit-asset-name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={150}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-asset-type"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Asset Type
                </label>
                <select
                  id="edit-asset-type"
                  value={editType}
                  onChange={(event) => setEditType(event.target.value as AssetType)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                >
                  {assetTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-asset-serial"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Serial Number
                </label>
                <input
                  id="edit-asset-serial"
                  value={editSerialNumber}
                  onChange={(event) => setEditSerialNumber(event.target.value)}
                  maxLength={100}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-asset-location"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Location
                </label>
                <input
                  id="edit-asset-location"
                  value={editLocation}
                  onChange={(event) => setEditLocation(event.target.value)}
                  maxLength={200}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-asset-status"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <select
                  id="edit-asset-status"
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value as AssetStatus)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                >
                  {assetStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {retiringAssetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="retire-asset-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Archive size={22} />
            </div>
            <h2 id="retire-asset-title" className="mt-4 text-lg font-bold text-slate-900">
              Retire this asset?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The asset will be marked as Retired. It will remain in the inventory and its
              existing assignment and maintenance history will be preserved.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRetiringAssetId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRetirement}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Confirm Retirement
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
