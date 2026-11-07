import RecentActivity from './RecentActivity'
import SystemAlerts from './SystemAlerts'
import AssetsByType from './shared/AssetsByType'
import AssetStatusChart from './shared/AssetStatusChart'
import DashboardStats from './shared/DashboardStats'

export default function AdminDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* Dashboard overview */}
      <div>
        <p className="text-sm text-slate-600">
          Overview of your infrastructure assets and activities.
        </p>

        <p className="mt-2 text-xs font-medium text-amber-700">
          Development preview · Sample data
        </p>
      </div>

      {/* Statistics */}
      <DashboardStats />

      {/* Asset charts */}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <AssetsByType />
        <AssetStatusChart />
      </div>

      {/* Recent activity and system alerts */}
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
        <RecentActivity />
        <SystemAlerts />
      </div>
    </div>
  )
}
