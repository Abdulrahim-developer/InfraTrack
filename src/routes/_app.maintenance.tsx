import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import MaintenanceManagement from '#/features/maintenance/components/MaintenanceManagement'
import { useRolePreview } from '#/features/navigation/RolePreviewContext'

export const Route = createFileRoute('/_app/maintenance')({
  validateSearch: z.object({
    assetId: z.string().optional(),
    action: z.enum(['view', 'create']).optional(),
  }),
  component: MaintenancePage,
})

function MaintenancePage() {
  const { role } = useRolePreview()
  const { assetId, action } = Route.useSearch()

  return (
    <MaintenanceManagement role={role} initialAssetId={assetId} initialAction={action} />
  )
}
