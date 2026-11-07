import { assetsByType } from '../../data/dashboard.mock'

const chartColors: Record<string, string> = {
  Router: '#2563EB',
  Server: '#8B5CF6',
  Switch: '#06B6D4',
}

export default function AssetsByType() {
  const totalAssets = assetsByType.reduce((total, item) => total + item.count, 0)

  // Calculate the starting and ending angle of each donut segment.
  let currentPercentage = 0

  const gradientSegments = assetsByType.map((item) => {
    const start = currentPercentage
    const percentage = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0

    currentPercentage += percentage

    return `${chartColors[item.type]} ${start}% ${currentPercentage}%`
  })

  const donutBackground =
    totalAssets > 0 ? `conic-gradient(${gradientSegments.join(', ')})` : '#E2E8F0'

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Chart heading */}
      <div>
        <h2 className="text-base font-semibold text-slate-900">Assets by Type</h2>
        <p className="mt-1 text-sm text-slate-500">
          Distribution across infrastructure types
        </p>
      </div>

      {/* Donut chart and category breakdown */}
      <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Donut */}
        <div className="flex justify-center">
          <div
            role="img"
            aria-label={`Asset type distribution: ${assetsByType
              .map((item) => `${item.type}: ${item.count}`)
              .join(', ')}`}
            className="relative size-44 shrink-0 rounded-full sm:size-40 lg:size-48"
            style={{ background: donutBackground }}
          >
            {/* Donut centre */}
            <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {totalAssets.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">Assets</span>
            </div>
          </div>
        </div>

        {/* Category legend */}
        <div className="min-w-0 space-y-3">
          {assetsByType.map((item) => {
            const percentage = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0

            return (
              <div
                key={item.type}
                className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: chartColors[item.type] }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium text-slate-700">
                    {item.type}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="text-slate-500">{percentage.toFixed(1)}%</span>
                  <span className="min-w-5 text-right font-semibold text-slate-900">
                    {item.count}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Total */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm text-slate-500">
          Total registered assets:{' '}
          <span className="font-semibold text-slate-900">
            {totalAssets.toLocaleString()}
          </span>
        </p>
      </div>
    </section>
  )
}
