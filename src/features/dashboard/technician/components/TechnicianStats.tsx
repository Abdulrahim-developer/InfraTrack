import { useMemo } from 'react'
import { Boxes, ClipboardList, UserRound, Wrench } from 'lucide-react'

import { useAppData } from '../../context/AppDataContext'

export default function TechnicianStats() {
  const { currentUserId, assets, assignments, maintenanceRecords } = useAppData()

  const stats = useMemo(() => {
    const currentAssignments = assignments.filter(
      (assignment) =>
        assignment.assignedToUserId === currentUserId && assignment.returnedAt === null,
    )

    const assignedAssets = currentAssignments.flatMap((assignment) => {
      const asset = assets.find((item) => item.id === assignment.assetId)
      return asset ? [asset] : []
    })

    const myMaintenanceCount = maintenanceRecords.filter(
      (record) => record.performedBy === currentUserId,
    ).length

    return [
      {
        label: 'My Assigned Assets',
        value: assignedAssets.length,
        description: 'Assets currently assigned to you',
        icon: Boxes,
        iconStyle: 'bg-blue-50 text-blue-600',
      },
      {
        label: 'Maintenance Records',
        value: myMaintenanceCount,
        description: 'Maintenance records performed by you',
        icon: ClipboardList,
        iconStyle: 'bg-violet-50 text-violet-600',
      },
      {
        label: 'Active Assets',
        value: assignedAssets.filter((asset) => asset.status === 'Active').length,
        description: 'Your assigned assets currently active',
        icon: UserRound,
        iconStyle: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Under Maintenance',
        value: assignedAssets.filter((asset) => asset.status === 'Maintenance').length,
        description: 'Your assigned assets under maintenance',
        icon: Wrench,
        iconStyle: 'bg-amber-50 text-amber-600',
      },
    ]
  }, [currentUserId, assets, assignments, maintenanceRecords])

  return (
    <section
      aria-label="Technician dashboard statistics"
      className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <article
            key={stat.label}
            className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
            >
              <Icon size={22} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {stat.description}
              </p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
