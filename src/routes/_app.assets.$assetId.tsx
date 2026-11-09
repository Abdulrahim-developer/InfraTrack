import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Clock,
  FileText,
  Info,
  MapPin,
  Network,
  Pencil,
  Plus,
  Server,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { z } from 'zod'

import {
  currentMockUserId,
  currentMockTechnicianId,
  type AssetStatus,
} from '#/features/dashboard/data/dashboard.mock'
import { useAppData } from '#/features/dashboard/context/AppDataContext'

export const Route = createFileRoute('/_app/assets/$assetId')({
  component: AssetDetailsPage,
  params: {
    parse: (params) => ({
      assetId: z.string().min(1).parse(params.assetId),
    }),
  },
})

type DetailTab = 'Overview' | 'Assignments' | 'Maintenance' | 'Audit Logs'

const tabs: { label: DetailTab; icon: typeof Boxes }[] = [
  { label: 'Overview', icon: Info },
  { label: 'Assignments', icon: Users },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Audit Logs', icon: ShieldCheck },
]

const statusStyles: Record<AssetStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Storage': 'bg-violet-50 text-violet-700 ring-violet-200',
  Retired: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function formatDate(value: string) {
  return new Date(value).toISOString().replace('T', ' ').slice(0, 16)
}

function getAssignedUserName(userId: string | null) {
  if (!userId) return 'Unassigned'
  if (userId === currentMockUserId) return 'Asset Manager'
  if (userId === currentMockTechnicianId) return 'Technician'
  return 'Other User'
}

function AssetDetailsPage() {
  const { assetId } = Route.useParams()
  const [activeTab, setActiveTab] = useState<DetailTab>('Overview')

  // Read all asset-related data from the shared application state.
  const { assets, assignments, maintenanceRecords } = useAppData()

  const normalizedId = assetId.toLowerCase()

  const asset = assets.find(
    (item) =>
      item.id.toLowerCase() === normalizedId ||
      item.id.slice(0, 8).toLowerCase() === normalizedId,
  )

  if (!asset) {
    return (
      <main className="space-y-5">
        <Link
          to="/assets"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to Asset Inventory
        </Link>

        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Boxes size={36} className="mx-auto text-slate-300" />
          <h1 className="mt-3 text-xl font-semibold text-slate-900">Asset not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            No asset matches the supplied ID. Please check the asset ID and try again.
          </p>
        </section>
      </main>
    )
  }

  const assetAssignments = assignments
    .filter((item) => item.assetId === asset.id)
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())

  const assetMaintenance = maintenanceRecords
    .filter((item) => item.assetId === asset.id)
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())

  const latestAssignment = assetAssignments.find((item) => item.returnedAt === null)

  const activities = [
    ...assetAssignments.map((item) => ({
      id: `assignment-${item.assignedAt}`,
      title: item.returnedAt ? 'Assignment Returned' : 'Asset Assigned',
      description: item.returnedAt
        ? `Assignment returned on ${formatDate(item.returnedAt)}`
        : `Currently assigned to ${getAssignedUserName(item.assignedToUserId)}`,
      timestamp: item.returnedAt ?? item.assignedAt,
      icon: Users,
      color: 'bg-violet-100 text-violet-600',
    })),
    ...assetMaintenance.map((item) => ({
      id: item.id,
      title: `Maintenance – ${item.maintenanceType}`,
      description: item.description,
      timestamp: item.performedAt,
      icon: Wrench,
      color: 'bg-amber-100 text-amber-600',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const AssetIcon =
    asset.type === 'Router' ? Network : asset.type === 'Server' ? Server : Boxes

  return (
    <main className="min-w-0 space-y-6">
      {/* Breadcrumb and page heading */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-blue-600">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/assets" className="hover:text-blue-600">
            Asset Inventory
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">Asset Details</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Asset Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View complete information, assignment, maintenance and audit history for this
            asset.
          </p>
        </div>
      </section>

      {/* Asset header */}
      <section className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <AssetIcon size={29} />
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-slate-900">{asset.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Asset ID: {asset.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="hidden h-12 w-px bg-slate-200 xl:block" />

          <div>
            <p className="text-xs text-slate-500">Status</p>
            <span
              className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[asset.status]}`}
            >
              {asset.status}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-500">Type</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{asset.type}</p>
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500">Location</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
              <MapPin size={15} className="shrink-0 text-slate-400" />
              {asset.location}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            title="Asset editing will be implemented later"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
          >
            <Pencil size={16} />
            Edit Asset
          </button>

          <button
            type="button"
            disabled
            title="Assignment workflow will be implemented later"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
          >
            <UserRound size={16} />
            Assign
          </button>

          <button
            type="button"
            disabled
            title="Maintenance creation will be implemented later"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
          >
            <Plus size={16} />
            Add Maintenance
          </button>

          <button
            type="button"
            disabled
            title="Asset retirement workflow will be implemented later"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
          >
            <Trash2 size={16} />
            Retire
          </button>
        </div>
      </section>

      {/* Tabs */}
      <nav
        aria-label="Asset detail sections"
        className="flex min-w-0 gap-2 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.label

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(tab.label)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Info size={21} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Asset Information</h3>
                <p className="text-xs text-slate-500">Registered asset details</p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-100">
              {[
                ['Asset Name', asset.name],
                ['Asset ID', asset.id],
                ['Asset Type', asset.type],
                ['Serial Number', asset.serialNumber],
                ['Location', asset.location],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-2 sm:gap-4 odd:bg-slate-50"
                >
                  <dt className="text-sm font-medium text-slate-700">{label}</dt>
                  <dd className="break-all text-sm text-slate-600">{value}</dd>
                </div>
              ))}

              <div className="grid grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-2 sm:gap-4 odd:bg-slate-50">
                <dt className="text-sm font-medium text-slate-700">Status</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </dd>
              </div>

              <div className="grid grid-cols-1 gap-1 px-3 py-3 sm:grid-cols-2 sm:gap-4 odd:bg-slate-50">
                <dt className="text-sm font-medium text-slate-700">Current Assignment</dt>
                <dd className="text-sm text-slate-600">
                  {getAssignedUserName(latestAssignment?.assignedToUserId ?? null)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <CalendarDays size={16} className="mt-0.5 shrink-0" />
              Creation and update timestamps are not currently included in the mock data.
            </div>
          </section>

          <div className="space-y-5">
            {/* Asset visual */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <AssetIcon size={21} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Asset Visual</h3>
                  <p className="text-xs text-slate-500">Asset category preview</p>
                </div>
              </div>

              <div className="mt-4 flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-4">
                {asset.type === 'Router' ? (
                  <img
                    src="/images/router-illustration.png"
                    alt="Router illustration"
                    className="max-h-48 w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <AssetIcon size={64} className="mx-auto text-blue-500" />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      {asset.type}
                    </p>
                    <p className="mt-1 text-xs">Category illustration placeholder</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent activity */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock size={21} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Recent Activity</h3>
                  <p className="text-xs text-slate-500">
                    Available assignment and maintenance events
                  </p>
                </div>
              </div>

              {activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No assignment or maintenance activity is available.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {activities.map((activity) => {
                    const Icon = activity.icon

                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${activity.color}`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">
                              {activity.title}
                            </p>
                            <time className="text-xs text-slate-400">
                              {formatDate(activity.timestamp)}
                            </time>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Assignment history */}
      {activeTab === 'Assignments' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users size={21} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Assignment History</h3>
              <p className="text-xs text-slate-500">
                Current and previous asset assignments
              </p>
            </div>
          </div>

          {assetAssignments.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No assignment history available.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[550px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Assigned At</th>
                    <th className="px-4 py-3 font-medium">Returned At</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetAssignments.map((assignment) => (
                    <tr key={assignment.assignedAt}>
                      <td className="px-4 py-4 text-slate-700">
                        {getAssignedUserName(assignment.assignedToUserId)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(assignment.assignedAt)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {assignment.returnedAt ? formatDate(assignment.returnedAt) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            assignment.returnedAt
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {assignment.returnedAt ? 'Returned' : 'Current'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Maintenance history */}
      {activeTab === 'Maintenance' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Wrench size={21} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Maintenance History</h3>
              <p className="text-xs text-slate-500">
                Completed maintenance records for this asset
              </p>
            </div>
          </div>

          {assetMaintenance.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No completed maintenance records available.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {assetMaintenance.map((record) => (
                <article
                  key={record.id}
                  className="rounded-lg border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-slate-800">
                      {record.maintenanceType}
                    </h4>
                    <time className="text-xs text-slate-400">
                      {formatDate(record.performedAt)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{record.description}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Performed by: {getAssignedUserName(record.performedBy)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Audit log placeholder */}
      {activeTab === 'Audit Logs' && (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText size={36} className="mx-auto text-slate-300" />
          <h3 className="mt-3 font-semibold text-slate-800">Asset Audit History</h3>
          <p className="mt-2 text-sm text-slate-500">
            Audit log records will appear here when the audit data is connected.
          </p>
        </section>
      )}

      <div className="flex justify-start">
        <Link
          to="/assets"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} />
          Back to Asset Inventory
        </Link>
      </div>
    </main>
  )
}
