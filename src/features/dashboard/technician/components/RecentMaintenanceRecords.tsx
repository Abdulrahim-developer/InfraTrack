import { CalendarDays, ClipboardList } from 'lucide-react'
import { myMaintenanceRecords } from '../../data/dashboard.mock'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RecentMaintenanceRecords() {
  return (
    <section
      aria-labelledby="recent-maintenance-heading"
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="recent-maintenance-heading"
            className="text-base font-semibold text-slate-900"
          >
            Recent Maintenance Records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Maintenance activities performed by you
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {myMaintenanceRecords.length} records
        </span>
      </div>

      {myMaintenanceRecords.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <ClipboardList
            size={28}
            className="mx-auto text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-slate-700">
            No maintenance records found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Your completed maintenance activities will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile layout */}
          <div className="mt-5 space-y-3 md:hidden">
            {myMaintenanceRecords.map((record) => (
              <article key={record.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-slate-900">
                      {record.assetName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{record.assetType}</p>
                  </div>

                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {record.maintenanceType}
                  </span>
                </div>

                <p className="mt-3 break-words text-sm leading-relaxed text-slate-600">
                  {record.description}
                </p>

                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <CalendarDays size={14} aria-hidden="true" />
                  <span>Performed on {formatDate(record.performedAt)}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Tablet and desktop table */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Asset
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Maintenance Type
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Date Performed
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {myMaintenanceRecords.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{record.assetName}</p>
                      <p className="mt-1 text-xs text-slate-500">{record.assetType}</p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {record.maintenanceType}
                      </span>
                    </td>

                    <td className="max-w-xs px-4 py-4 text-slate-600">
                      <p className="line-clamp-2">{record.description}</p>
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

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Showing completed maintenance records performed by your account.
        </p>
      </div>
    </section>
  )
}
