import type { LucideIcon } from 'lucide-react'

interface DashboardStatCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
}

export default function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <article className="flex min-h-32 items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5">
      {/* Metric icon */}
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
        <Icon size={25} strokeWidth={2} className="text-blue-600" aria-hidden="true" />
      </div>

      {/* Metric information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-500">{title}</p>

        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {value.toLocaleString()}
        </p>

        <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </article>
  )
}
