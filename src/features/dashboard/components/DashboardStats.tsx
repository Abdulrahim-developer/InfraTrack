import { Archive, Boxes, UserCheck, Wrench } from 'lucide-react'

import DashboardStatCard from './DashboardStatCard'
import { assetsByStatus, dashboardStats } from '../data/dashboard.mock'

const inStorageCount =
  assetsByStatus.find((item) => item.status === 'In Storage')?.count ?? 0

export default function DashboardStats() {
  return (
    <section
      aria-label="Asset statistics"
      className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <DashboardStatCard
        title="Total Assets"
        value={dashboardStats.totalAssets}
        description="Across all registered assets"
        icon={Boxes}
      />

      <DashboardStatCard
        title="Assigned Assets"
        value={dashboardStats.assignedAssets}
        description="Currently assigned assets"
        icon={UserCheck}
      />

      <DashboardStatCard
        title="Under Maintenance"
        value={dashboardStats.maintenanceAssets}
        description="Assets currently in maintenance"
        icon={Wrench}
      />

      <DashboardStatCard
        title="In Storage"
        value={inStorageCount}
        description="Assets held in inventory"
        icon={Archive}
      />
    </section>
  )
}
