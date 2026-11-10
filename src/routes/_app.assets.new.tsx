import { createFileRoute, useRouteContext } from '@tanstack/react-router'
import RegisterAsset from '#/features/assets/components/RegisterAsset'

export const Route = createFileRoute('/_app/assets/new')({
  component: RegisterAssetPage,
})

function RegisterAssetPage() {
  const { authenticatedUser } = useRouteContext({ from: '/_app' })

  return <RegisterAsset role={authenticatedUser.role} />
}
