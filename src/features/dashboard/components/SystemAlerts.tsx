import { Bell, Info } from 'lucide-react'

export default function SystemAlerts() {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">System Alerts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Important infrastructure notifications
          </p>
        </div>

        <Bell size={20} className="shrink-0 text-slate-400" aria-hidden="true" />
      </div>

      <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-blue-50">
          <Info size={22} className="text-blue-600" aria-hidden="true" />
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-800">
          No system alerts available
        </p>

        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
          System alert rules have not been configured in this development preview.
        </p>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Alert functionality · Pending implementation
      </p>
    </section>
  )
}
