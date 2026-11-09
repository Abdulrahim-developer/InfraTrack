import { createFileRoute } from '@tanstack/react-router'
import RegisterAsset from '#/features/assets/components/RegisterAsset'
import { useRolePreview } from '#/features/navigation/RolePreviewContext'

export const Route = createFileRoute('/_app/assets/new')({
  component: RegisterAssetPage,
})

function RegisterAssetPage() {
  const { role } = useRolePreview()

  return <RegisterAsset role={role} />
}
