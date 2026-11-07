import { Clock, FileText } from 'lucide-react'
import { recentActivity } from '../data/dashboard.mock'

export default function RecentActivity() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          <p className="mt-1 text-sm text-slate-500">Latest asset-related activities</p>
        </div>

        <Clock size={20} className="text-slate-400" aria-hidden="true" />
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <article key={activity.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <div className="mt-1 rounded-lg bg-blue-50 p-2">
                <FileText size={18} className="text-blue-600" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{activity.action}</p>

                <p className="mt-1 text-sm text-slate-600">{activity.assetName}</p>

                <p className="mt-1 text-xs text-slate-500">{activity.details}</p>

                <time
                  className="mt-2 block text-xs text-slate-400"
                  dateTime={activity.timestamp}
                >
                  {new Date(activity.timestamp).toLocaleString()}
                </time>
              </div>
            </article>
          ))
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            No recent activity available.
          </p>
        )}
      </div>
    </section>
  )
}
