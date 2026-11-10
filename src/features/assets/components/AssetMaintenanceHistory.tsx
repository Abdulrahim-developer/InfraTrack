import { useEffect, useState } from 'react'
import { Clock, Wrench } from 'lucide-react'

import { listMaintenanceRecords } from '#/features/maintenance/server/list-maintenance-records'

type MaintenanceRecord = Awaited<
  ReturnType<typeof listMaintenanceRecords>
>['data'][number]

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function AssetMaintenanceHistory({ assetId }: { assetId: string }) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const result = await listMaintenanceRecords({
          data: { assetId },
        })

        if (cancelled) return

        setRecords(result.data)
      } catch (error) {
        if (cancelled) return

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load maintenance history.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [assetId])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Wrench size={21} className="text-blue-600" />

        <div>
          <h3 className="font-semibold text-slate-900">Maintenance History</h3>

          <p className="text-xs text-slate-500">Maintenance records for this asset</p>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Loading maintenance history...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="py-10 text-center text-sm text-red-600">
          {errorMessage}
        </p>
      ) : records.length === 0 ? (
        <div className="py-10 text-center">
          <Wrench size={32} className="mx-auto text-slate-300" />

          <p className="mt-3 text-sm font-medium text-slate-700">
            No maintenance records
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Maintenance history will appear here when records are added.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Maintenance Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Performed By</th>
                <th className="px-4 py-3 font-medium">Performed At</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.maintenanceId}>
                  <td className="px-4 py-4 font-medium text-slate-800">
                    {record.maintenanceType}
                  </td>

                  <td className="max-w-xs whitespace-normal px-4 py-4 text-slate-600">
                    {record.description}
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-800">{record.performedByName}</p>

                    <p className="mt-1 text-xs text-slate-500">
                      {record.performedByEmail}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {formatDate(record.performedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Clock size={14} />
        Records are retrieved from PostgreSQL.
      </div>
    </section>
  )
}
