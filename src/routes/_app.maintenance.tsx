import { createFileRoute, useRouteContext } from '@tanstack/react-router'
import { z } from 'zod'

import MaintenanceManagement from '#/features/maintenance/components/MaintenanceManagement'

export const Route = createFileRoute('/_app/maintenance')({
  validateSearch: z.object({
    assetId: z.string().optional(),
    action: z.enum(['view', 'create']).optional(),
  }),
  component: MaintenancePage,
})

function MaintenancePage() {
  const { authenticatedUser } = useRouteContext({ from: '/_app' })
  const { assetId, action } = Route.useSearch()

  return (
    <MaintenanceManagement
      role={authenticatedUser.role}
      initialAssetId={assetId}
      initialAction={action}
    />
  )
}
