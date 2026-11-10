import { createFileRoute, useRouteContext } from '@tanstack/react-router'
import AssetInventory from '#/features/assets/components/AssetInventory'

export const Route = createFileRoute('/_app/assets/')({
  component: AssetInventoryPage,
})

function AssetInventoryPage() {
  const { authenticatedUser } = useRouteContext({ from: '/_app' })

  return <AssetInventory role={authenticatedUser.role} />
}
