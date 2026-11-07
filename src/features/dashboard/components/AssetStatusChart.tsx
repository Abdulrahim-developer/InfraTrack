import { assetsByStatus } from '../data/dashboard.mock'

const statusColors: Record<string, string> = {
  Active: '#2563eb',
  Maintenance: '#f59e0b',
  'In Storage': '#64748b',
  Retired: '#ef4444',
}

export default function AssetStatusChart() {
  const totalAssets = assetsByStatus.reduce((total, item) => total + item.count, 0)

  let currentAngle = 0

  const gradientStops = assetsByStatus.map((item) => {
    const percentage = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0

    const startAngle = currentAngle
    currentAngle += percentage * 3.6

    return `${statusColors[item.status]} ${startAngle}deg ${currentAngle}deg`
  })

  const chartBackground =
    totalAssets > 0 ? `conic-gradient(${gradientStops.join(', ')})` : '#e2e8f0'

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Asset Status Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Current lifecycle distribution</p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        <div
          role="img"
          aria-label={`Asset status distribution across ${totalAssets} assets`}
          className="relative size-44 shrink-0 rounded-full"
          style={{ background: chartBackground }}
        >
          <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-bold text-slate-900">{totalAssets}</span>
            <span className="text-xs text-slate-500">Total Assets</span>
          </div>
        </div>

        <ul className="w-full space-y-4 sm:w-auto">
          {assetsByStatus.map((item) => (
            <li key={item.status} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: statusColors[item.status] }}
                  aria-hidden="true"
                />
                <span className="text-sm text-slate-600">{item.status}</span>
              </div>

              <span className="text-sm font-semibold text-slate-900">{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
