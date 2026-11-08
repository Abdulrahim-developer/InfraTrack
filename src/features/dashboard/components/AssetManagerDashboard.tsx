import DashboardStats from './shared/DashboardStats'
import AssetsByType from './shared/AssetsByType'
import AssetStatusChart from './shared/AssetStatusChart'

import MyAssignedAssets from '../asset-manager/components/MyAssignedAssets'
import UpcomingMaintenance from '../asset-manager/components/UpcomingMaintenance'
import QuickActions from '../asset-manager/components/QuickActions'

export default function AssetManagerDashboard() {
  return (
    <main className="min-w-0 space-y-6">
      {/* Dashboard heading */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Asset Manager Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and manage infrastructure assets, assignments and lifecycle status.
        </p>
      </section>

      {/* Key metrics */}
      <DashboardStats variant="asset-manager" />

      {/* Asset charts */}
      <section
        aria-label="Asset analytics"
        className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2"
      >
        <AssetsByType />
        <AssetStatusChart />
      </section>

      {/* Asset assignments and maintenance */}
      <section
        aria-label="Asset management overview"
        className="grid min-w-0 grid-cols-1 gap-5 2xl:grid-cols-2"
      >
        <MyAssignedAssets />
        <UpcomingMaintenance />
      </section>

      {/* Common actions */}
      <QuickActions />
    </main>
  )
}
