import { createFileRoute, useRouteContext } from '@tanstack/react-router'
import ProfileSettings from '#/features/profile/components/ProfileSettings'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { authenticatedUser } = useRouteContext({ from: '/_app' })

  return <ProfileSettings user={authenticatedUser} />
}
