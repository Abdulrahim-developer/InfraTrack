
import { CalendarDays, MapPin } from 'lucide-react'
import { myAssignedAssets } from '../../data/dashboard.mock'

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'In Storage': 'bg-slate-100 text-slate-700 ring-slate-500/20',
  Retired: 'bg-red-50 text-red-700 ring-red-600/20',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getShortAssetId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

export default function MyAssignedAssets() {
  return (
    <section
      aria-labelledby="assigned-assets-heading"
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="assigned-assets-heading"
            className="text-base font-semibold text-slate-900"
          >
            My Assigned Assets
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Infrastructure assets currently assigned to you
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {myAssignedAssets.length} assigned
        </span>
      </div>

      {myAssignedAssets.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            No assets currently assigned
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Assets assigned to your account will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile layout */}
          <div className="mt-5 space-y-3 md:hidden">
            {myAssignedAssets.map((asset) => (
              <article
                key={asset.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                      {getShortAssetId(asset.id)}
                    </p>
                    <h3 className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {asset.name}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      statusStyles[asset.status] ?? statusStyles['In Storage']
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Asset Type</p>
                    <p className="mt-1 font-medium text-slate-700">{asset.type}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Assigned On</p>
                    <p className="mt-1 flex items-center gap-1 font-medium text-slate-700">
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatDate(asset.assignedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="break-words">{asset.location}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Tablet and desktop table */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Asset ID
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Assigned On
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {myAssignedAssets.map((asset) => (
                  <tr key={asset.id} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-blue-700">
                      {getShortAssetId(asset.id)}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {asset.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {asset.type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          statusStyles[asset.status] ?? statusStyles['In Storage']
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{asset.location}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {formatDate(asset.assignedAt)}
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
          Showing current assignments only. Returned assignments are excluded.
        </p>
      </div>
    </section>
  )
}
