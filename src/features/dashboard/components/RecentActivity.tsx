import { Clock } from 'lucide-react'
import { recentActivity } from '../data/dashboard.mock'

export default function RecentActivity() {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Recent Asset Activity
          </h2>
          <p className="mt-1 text-sm text-slate-500">Latest asset-related activities</p>
        </div>

        <Clock size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
      </div>

      {recentActivity.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-3 py-3">
                  Activity
                </th>
                <th scope="col" className="px-3 py-3">
                  Asset
                </th>
                <th scope="col" className="px-3 py-3">
                  Details
                </th>
                <th scope="col" className="px-3 py-3">
                  Date &amp; Time
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <tr
                  key={activity.id}
                  className="text-sm transition-colors hover:bg-slate-50"
                >
                  <td className="px-3 py-4 font-medium text-slate-800">
                    {activity.action}
                  </td>

                  <td className="px-3 py-4 text-slate-700">{activity.assetName}</td>

                  <td className="max-w-52 px-3 py-4 text-slate-500">
                    {activity.details}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">
                    <time dateTime={activity.timestamp}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No recent activity available.
        </p>
      )}

      <p className="mt-3 text-xs text-amber-700">
        Development preview · Sample activity data
      </p>
    </section>
  )
}
