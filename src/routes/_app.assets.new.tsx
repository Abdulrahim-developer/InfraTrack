import { createFileRoute } from '@tanstack/react-router'
import RegisterAsset from '#/features/assets/components/RegisterAsset'

export const Route = createFileRoute('/_app/assets/new')({
  component: RegisterAssetPage,
})

function RegisterAssetPage() {
  // Temporary role for UI development.
  // Later, this will come from the authenticated server session.
  return <RegisterAsset role="Administrator" />
}
