import { Archive, Boxes, ClipboardList, UserCheck, Wrench } from 'lucide-react'
import DashboardStatCard from './DashboardStatCard'
import { currentMockTechnicianId } from '../../data/dashboard.mock'
import { useAppData } from '../../context/AppDataContext'

interface DashboardStatsProps {
  variant?: 'administrator' | 'asset-manager' | 'technician' | 'viewer-auditor'
}

export default function DashboardStats({
  variant = 'administrator',
}: DashboardStatsProps) {
  const { assets, assignments, maintenanceRecords } = useAppData()

  const totalAssets = assets.length

  const activeAssets = assets.filter((asset) => asset.status === 'Active').length

  const maintenanceAssets = assets.filter(
    (asset) => asset.status === 'Maintenance',
  ).length

  const inStorageAssets = assets.filter((asset) => asset.status === 'In Storage').length

  const activeAssignments = assignments.filter(
    (assignment) => assignment.returnedAt === null,
  )

  const assignedAssetIds = new Set(
    activeAssignments.map((assignment) => assignment.assetId),
  )

  const assignedAssets = assignedAssetIds.size

  const technicianAssignments = activeAssignments.filter(
    (assignment) => assignment.assignedToUserId === currentMockTechnicianId,
  )

  const technicianAssetIds = new Set(
    technicianAssignments.map((assignment) => assignment.assetId),
  )

  const technicianAssets = assets.filter((asset) => technicianAssetIds.has(asset.id))

  const technicianMaintenanceRecords = maintenanceRecords.filter(
    (record) => record.performedBy === currentMockTechnicianId,
  )

  const metrics =
    variant === 'technician'
      ? [
          {
            title: 'My Assigned Assets',
            value: technicianAssetIds.size,
            description: 'Assets currently assigned to you',
            icon: Boxes,
          },
          {
            title: 'Maintenance Records',
            value: technicianMaintenanceRecords.length,
            description: 'Maintenance records performed by you',
            icon: ClipboardList,
          },
          {
            title: 'Active Assets',
            value: technicianAssets.filter((asset) => asset.status === 'Active').length,
            description: 'Your assigned assets currently active',
            icon: UserCheck,
          },
          {
            title: 'Under Maintenance',
            value: technicianAssets.filter((asset) => asset.status === 'Maintenance')
              .length,
            description: 'Your assigned assets under maintenance',
            icon: Wrench,
          },
        ]
      : variant === 'asset-manager' || variant === 'viewer-auditor'
        ? [
            {
              title: 'Total Assets',
              value: totalAssets,
              description: 'Across all registered assets',
              icon: Boxes,
            },
            {
              title: 'Active Assets',
              value: activeAssets,
              description: 'Assets currently active',
              icon: UserCheck,
            },
            {
              title: 'Under Maintenance',
              value: maintenanceAssets,
              description: 'Assets currently in maintenance',
              icon: Wrench,
            },
            {
              title: 'In Storage',
              value: inStorageAssets,
              description: 'Assets held in inventory',
              icon: Archive,
            },
          ]
        : [
            {
              title: 'Total Assets',
              value: totalAssets,
              description: 'Across all registered assets',
              icon: Boxes,
            },
            {
              title: 'Assigned Assets',
              value: assignedAssets,
              description: 'Currently assigned assets',
              icon: UserCheck,
            },
            {
              title: 'Under Maintenance',
              value: maintenanceAssets,
              description: 'Assets currently in maintenance',
              icon: Wrench,
            },
            {
              title: 'In Storage',
              value: inStorageAssets,
              description: 'Assets held in inventory',
              icon: Archive,
            },
          ]

  return (
    <section
      aria-label="Asset statistics"
      className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <DashboardStatCard key={metric.title} {...metric} />
      ))}
    </section>
  )
}
