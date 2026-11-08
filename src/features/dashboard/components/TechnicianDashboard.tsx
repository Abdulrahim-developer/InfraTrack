import DashboardStats from './shared/DashboardStats'

import MyAssignedAssets from '../technician/components/MyAssignedAssets'
import RecentMaintenanceRecords from '../technician/components/RecentMaintenanceRecords'

export default function TechnicianDashboard() {
  return (
    <main className="min-w-0 space-y-6">
      {/* Dashboard heading */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Technician Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your assigned infrastructure assets and maintenance activities.
        </p>
      </section>

      {/* Technician-specific metrics */}
      <DashboardStats variant="technician" />

      {/* Current asset assignments */}
      <section aria-label="Technician asset assignments">
        <MyAssignedAssets />
      </section>

      {/* Completed maintenance history */}
      <section aria-label="Technician maintenance history">
        <RecentMaintenanceRecords />
      </section>
    </main>
  )
}
