import { FileBarChart, Search } from 'lucide-react'

import DashboardStats from './shared/DashboardStats'
import AssetsByType from './shared/AssetsByType'
import AssetStatusChart from './shared/AssetStatusChart'

function QuickAccess() {
  const actions = [
    {
      title: 'Browse Assets',
      description: 'View registered infrastructure assets and their details.',
      icon: Search,
    },
    {
      title: 'View Reports',
      description: 'Explore asset inventory, status and maintenance reports.',
      icon: FileBarChart,
    },
  ]

  return (
    <section aria-label="Quick access">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Quick Access</h2>
        <p className="mt-1 text-sm text-slate-500">
          Explore asset information and reports.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <article
              key={action.title}
              className="flex min-w-0 items-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={22} aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">{action.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {action.description}
                </p>
                <span className="mt-3 inline-block text-xs font-medium text-slate-400">
                  Read-only access
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default function ViewerAuditorDashboard() {
  return (
    <main className="min-w-0 space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Viewer / Auditor Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review infrastructure assets, lifecycle status and inventory reports.
        </p>
      </section>

      <DashboardStats variant="viewer-auditor" />

      <section
        aria-label="Asset analytics"
        className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <AssetsByType />
        <AssetStatusChart />
      </section>

      <QuickAccess />
    </main>
  )
}
