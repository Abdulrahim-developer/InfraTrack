import { createFileRoute } from '@tanstack/react-router'
import AssetInventory from '#/features/assets/components/AssetInventory'

export const Route = createFileRoute('/_app/assets/')({
  component: AssetInventoryPage,
})

function AssetInventoryPage() {
  // Temporary role for UI development.
  // Later, this will come from the authenticated session.
  return <AssetInventory role="Administrator" />
}
