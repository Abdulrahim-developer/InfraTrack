import { useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'

const statusColors: Record<string, string> = {
  Active: '#2563EB',
  Maintenance: '#F59E0B',
  'In Storage': '#64748B',
  Retired: '#EF4444',
}

const statusOrder = ['Active', 'Maintenance', 'In Storage', 'Retired']

export default function AssetStatusChart() {
  const { assets } = useAppData()

  const assetsByStatus = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        count: assets.filter((asset) => asset.status === status).length,
      })),
    [assets],
  )

  const maxCount = Math.max(...assetsByStatus.map((item) => item.count), 1)

  // Keep five evenly spaced Y-axis intervals.
  const axisMax = Math.max(5, Math.ceil(maxCount / 5) * 5)
  const ticks = Array.from({ length: 6 }, (_, index) => (axisMax * (5 - index)) / 5)

  const chartTop = 24
  const chartBottom = 190
  const chartHeight = chartBottom - chartTop
  const barWidth = 54
  const centers = [115, 225, 335, 445]

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Asset Status Overview
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Current lifecycle distribution
        </p>
      </div>

      <div className="mt-6 w-full">
        <svg
          viewBox="0 0 560 245"
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`Vertical bar chart showing asset lifecycle status: ${assetsByStatus
            .map((item) => `${item.status}: ${item.count}`)
            .join(', ')}`}
        >
          {/* Y-axis labels and horizontal grid lines */}
          {ticks.map((tick, index) => {
            const y = chartTop + (index / 5) * chartHeight

            return (
              <g key={tick}>
                <line
                  x1="55"
                  y1={y}
                  x2="535"
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="1"
                />
                <text
                  x="43"
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="currentColor"
                  className="text-slate-500 dark:text-slate-300"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Bars, values and category labels */}
          {assetsByStatus.map((item, index) => {
            const center = centers[index]
            const barHeight = (item.count / axisMax) * chartHeight
            const barY = chartBottom - barHeight

            return (
              <g key={item.status}>
                <rect
                  x={center - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={statusColors[item.status] ?? '#94A3B8'}
                />

                <text
                  x={center}
                  y={Math.max(chartTop - 5, barY - 9)}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill="currentColor"
                  className="text-slate-900 dark:text-white"
                >
                  {item.count}
                </text>

                <text
                  x={center}
                  y="215"
                  textAnchor="middle"
                  fontSize="11"
                  fill="currentColor"
                  className="text-slate-600 dark:text-slate-300"
                >
                  {item.status}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Total registered assets:{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {assets.length.toLocaleString()}
          </span>
        </p>
      </div>
    </section>
  )
}
