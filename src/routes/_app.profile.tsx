import { createFileRoute } from '@tanstack/react-router'
import ProfileSettings from '#/features/profile/components/ProfileSettings'
import { useRolePreview } from '#/features/navigation/RolePreviewContext'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { role } = useRolePreview()

  return <ProfileSettings role={role} />
}
