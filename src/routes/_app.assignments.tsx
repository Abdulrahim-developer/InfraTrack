import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import AssignmentManagement from '#/features/assignments/components/AssignmentManagement'

export const Route = createFileRoute('/_app/assignments')({
  validateSearch: z.object({
    assetId: z.string().optional(),
    action: z.enum(['view', 'create']).optional(),
  }),
  component: AssignmentPage,
})

function AssignmentPage() {
  const { assetId, action } = Route.useSearch()
  const { authenticatedUser } = Route.useRouteContext()

  return (
    <AssignmentManagement
      initialAssetId={assetId}
      initialAction={action}
      userRole={authenticatedUser.role}
    />
  )
}
