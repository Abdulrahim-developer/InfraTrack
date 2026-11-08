import { Archive, Boxes, ClipboardList, UserCheck, Wrench } from 'lucide-react'
import DashboardStatCard from './DashboardStatCard'
import {
  assetsByStatus,
  dashboardStats,
  technicianDashboardStats,
} from '../../data/dashboard.mock'

interface DashboardStatsProps {
  variant?: 'administrator' | 'asset-manager' | 'technician' | 'viewer-auditor'
}

const inStorageCount =
  assetsByStatus.find((item) => item.status === 'In Storage')?.count ?? 0

export default function DashboardStats({
  variant = 'administrator',
}: DashboardStatsProps) {
  const metrics =
    variant === 'technician'
      ? [
          {
            title: 'My Assigned Assets',
            value: technicianDashboardStats.assignedAssets,
            description: 'Assets currently assigned to you',
            icon: Boxes,
          },
          {
            title: 'Maintenance Records',
            value: technicianDashboardStats.maintenanceRecords,
            description: 'Maintenance records performed by you',
            icon: ClipboardList,
          },
          {
            title: 'Active Assets',
            value: technicianDashboardStats.activeAssets,
            description: 'Your assigned assets currently active',
            icon: UserCheck,
          },
          {
            title: 'Under Maintenance',
            value: technicianDashboardStats.maintenanceAssets,
            description: 'Your assigned assets under maintenance',
            icon: Wrench,
          },
        ]
      : variant === 'asset-manager' || variant === 'viewer-auditor'
        ? [
            {
              title: 'Total Assets',
              value: dashboardStats.totalAssets,
              description: 'Across all registered assets',
              icon: Boxes,
            },
            {
              title: 'Active Assets',
              value: dashboardStats.activeAssets,
              description: 'Assets currently active',
              icon: UserCheck,
            },
            {
              title: 'Under Maintenance',
              value: dashboardStats.maintenanceAssets,
              description: 'Assets currently in maintenance',
              icon: Wrench,
            },
            {
              title: 'In Storage',
              value: inStorageCount,
              description: 'Assets held in inventory',
              icon: Archive,
            },
          ]
        : [
            {
              title: 'Total Assets',
              value: dashboardStats.totalAssets,
              description: 'Across all registered assets',
              icon: Boxes,
            },
            {
              title: 'Assigned Assets',
              value: dashboardStats.assignedAssets,
              description: 'Currently assigned assets',
              icon: UserCheck,
            },
            {
              title: 'Under Maintenance',
              value: dashboardStats.maintenanceAssets,
              description: 'Assets currently in maintenance',
              icon: Wrench,
            },
            {
              title: 'In Storage',
              value: inStorageCount,
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
