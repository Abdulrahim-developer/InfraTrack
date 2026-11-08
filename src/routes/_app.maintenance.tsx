
import { createFileRoute } from '@tanstack/react-router'
import MaintenanceManagement from '#/features/maintenance/components/MaintenanceManagement'

export const Route = createFileRoute('/_app/maintenance')({
  component: MaintenancePage,
})

function MaintenancePage() {
  return <MaintenanceManagement role="Administrator" />
}
