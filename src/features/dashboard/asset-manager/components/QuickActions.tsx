
import { ArrowRight, ClipboardPlus, Search, UserPlus } from 'lucide-react'

const actions = [
  {
    title: 'Register New Asset',
    description: 'Add a new infrastructure asset to the inventory.',
    icon: ClipboardPlus,
  },
  {
    title: 'Create Assignment',
    description: 'Assign an asset to a user or department.',
    icon: UserPlus,
  },
  {
    title: 'Search Assets',
    description: 'Find assets using their name or identifier.',
    icon: Search,
  },
]

export default function QuickActions() {
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2
          id="quick-actions-heading"
          className="text-base font-semibold text-slate-900"
        >
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Common asset management tasks
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <div
              key={action.title}
              className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Icon
                  size={20}
                  className="text-blue-600"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {action.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                  Coming soon
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}