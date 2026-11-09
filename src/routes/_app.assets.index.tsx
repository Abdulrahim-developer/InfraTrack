import { createFileRoute } from '@tanstack/react-router'
import AssetInventory from '#/features/assets/components/AssetInventory'
import { useRolePreview } from '#/features/navigation/RolePreviewContext'

export const Route = createFileRoute('/_app/assets/')({
  component: AssetInventoryPage,
})

function AssetInventoryPage() {
  const { role } = useRolePreview()

  return <AssetInventory role={role} />
}
