
import { CalendarClock, ClipboardList } from 'lucide-react'

export default function UpcomingMaintenance() {
  return (
    <section
      aria-labelledby="upcoming-maintenance-heading"
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <CalendarClock
            size={21}
            className="text-blue-600"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <h2
            id="upcoming-maintenance-heading"
            className="text-base font-semibold text-slate-900"
          >
            Upcoming Maintenance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Scheduled maintenance overview
          </p>
        </div>
      </div>

      <div className="mt-6 flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
          <ClipboardList
            size={23}
            className="text-slate-500"
            aria-hidden="true"
          />
        </div>

        <h3 className="mt-3 text-sm font-semibold text-slate-800">
          No scheduled maintenance
        </h3>

        <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
          Maintenance scheduling is not included in the current release. Completed
          maintenance records will be available in Maintenance Management.
        </p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Scheduled maintenance · Future enhancement
        </p>
      </div>
    </section>
  )
}
