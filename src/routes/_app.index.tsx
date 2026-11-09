import { createFileRoute } from '@tanstack/react-router'
import { useRolePreview } from '#/features/navigation/RolePreviewContext'
import AdminDashboard from '#/features/dashboard/components/AdminDashboard'
import AssetManagerDashboard from '#/features/dashboard/components/AssetManagerDashboard'
import TechnicianDashboard from '#/features/dashboard/components/TechnicianDashboard'
import ViewerAuditorDashboard from '#/features/dashboard/components/ViewerAuditorDashboard'

export const Route = createFileRoute('/_app/')({
  component: RoleBasedDashboard,
})

function RoleBasedDashboard() {
  const { role } = useRolePreview()

  switch (role) {
    case 'Administrator':
      return <AdminDashboard />

    case 'Asset Manager':
      return <AssetManagerDashboard />

    case 'Technician':
      return <TechnicianDashboard />

    case 'Viewer/Auditor':
      return <ViewerAuditorDashboard />

    default:
      return <AdminDashboard />
  }
}
