import { useEffect, useState } from 'react'
import { Clock, Users } from 'lucide-react'

import { listAssignments } from '#/features/assignments/server/list-assignments'

type AssignmentRecord = Awaited<ReturnType<typeof listAssignments>>['data'][number]

function formatDate(value: string | null) {
  if (!value) return '—'

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

export default function AssetAssignmentHistory({ assetId }: { assetId: string }) {
  const [records, setRecords] = useState<AssignmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const result = await listAssignments()

        if (cancelled) return

        setRecords(result.data.filter((record) => record.assetId === assetId))
      } catch (error) {
        if (cancelled) return

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load assignment history.',
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
        <Users size={21} className="text-blue-600" />

        <div>
          <h3 className="font-semibold text-slate-900">Assignment History</h3>

          <p className="text-xs text-slate-500">Current and previous asset assignments</p>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Loading assignment history...
        </p>
      ) : errorMessage ? (
        <p role="alert" className="py-10 text-center text-sm text-red-600">
          {errorMessage}
        </p>
      ) : records.length === 0 ? (
        <div className="py-10 text-center">
          <Users size={32} className="mx-auto text-slate-300" />

          <p className="mt-3 text-sm font-medium text-slate-700">No assignment history</p>

          <p className="mt-1 text-xs text-slate-500">
            This asset has not been assigned yet.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium">Assigned Date</th>
                <th className="px-4 py-3 font-medium">Returned Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const isReturned = Boolean(record.returnedAt)

                return (
                  <tr key={record.assignmentId}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{record.assignedTo}</p>

                      {record.assignedUserEmail && (
                        <p className="mt-1 text-xs text-slate-500">
                          {record.assignedUserEmail}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(record.assignedAt)}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(record.returnedAt)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isReturned
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isReturned ? 'Returned' : 'Assigned'}
                      </span>
                    </td>
                  </tr>
                )
              })}
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
