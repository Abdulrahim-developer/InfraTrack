import DashboardStats from './DashboardStats'
import AssetsByType from './AssetsByType'
import AssetStatusChart from './AssetStatusChart'
import RecentActivity from './RecentActivity'

export default function AdminDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      {/* Dashboard heading */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AssetsByType />
        <AssetStatusChart />
      </div>

      {/* Recent activity */}
      <RecentActivity />
    </div>
  )
}
