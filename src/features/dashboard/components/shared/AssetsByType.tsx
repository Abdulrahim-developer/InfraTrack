import { useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'

const chartColors = [
  '#2563EB',
  '#8B5CF6',
  '#06B6D4',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#64748B',
  '#EF4444',
]

export default function AssetsByType() {
  const { assets } = useAppData()

  const assetsByType = useMemo(() => {
    const counts = new Map<string, number>()

    assets.forEach((asset) => {
      counts.set(asset.type, (counts.get(asset.type) ?? 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type))
  }, [assets])

  const totalAssets = assets.length

  let currentPercentage = 0

  const gradientSegments = assetsByType.map((item, index) => {
    const start = currentPercentage
    const percentage = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0

    currentPercentage += percentage

    const color = chartColors[index % chartColors.length]

    return `${color} ${start}% ${currentPercentage}%`
  })

  const donutBackground =
    totalAssets > 0 ? `conic-gradient(${gradientSegments.join(', ')})` : '#E2E8F0'

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Chart heading */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Assets by Type
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Distribution across infrastructure types
        </p>
      </div>

      {/* Donut chart and category breakdown */}
      <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Donut */}
        <div className="flex justify-center">
          <div
            role="img"
            aria-label={`Asset type distribution: ${
              assetsByType.length > 0
                ? assetsByType.map((item) => `${item.type}: ${item.count}`).join(', ')
                : 'No registered assets'
            }`}
            className="relative size-44 shrink-0 rounded-full sm:size-40 lg:size-48"
            style={{ background: donutBackground }}
          >
            {/* Donut centre */}
            <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {totalAssets.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Assets</span>
            </div>
          </div>
        </div>

        {/* Category legend */}
        <div className="min-w-0 space-y-3">
          {assetsByType.length > 0 ? (
            assetsByType.map((item, index) => {
              const percentage = totalAssets > 0 ? (item.count / totalAssets) * 100 : 0

              return (
                <div
                  key={item.type}
                  className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 dark:border-slate-700"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: chartColors[index % chartColors.length],
                      }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="min-w-5 text-right font-semibold text-slate-900 dark:text-white">
                      {item.count}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No registered assets available.
            </p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total registered assets:{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {totalAssets.toLocaleString()}
          </span>
        </p>
      </div>
    </section>
  )
}
