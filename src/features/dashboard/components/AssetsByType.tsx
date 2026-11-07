import { assetsByType } from '../data/dashboard.mock'

const barColors: Record<string, string> = {
  Router: 'bg-blue-600',
  Server: 'bg-indigo-500',
  Switch: 'bg-cyan-500',
}

export default function AssetsByType() {
  const totalAssets = assetsByType.reduce((total, item) => total + item.count, 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Assets by Type</h2>
        <p className="mt-1 text-sm text-slate-500">
          Distribution across infrastructure types
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {assetsByType.map((item) => {
          const percentage = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0

          return (
            <div key={item.type}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{item.type}</span>

                <span className="text-sm font-semibold text-slate-900">{item.count}</span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label={`${item.type} assets`}
                aria-valuenow={item.count}
                aria-valuemin={0}
                aria-valuemax={totalAssets}
              >
                <div
                  className={`h-full rounded-full transition-all ${barColors[item.type]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          Total registered assets:{' '}
          <span className="font-semibold text-slate-900">{totalAssets}</span>
        </p>
      </div>
    </section>
  )
}
