import { createFileRoute } from '@tanstack/react-router'
import UserManagement from '#/features/users/components/UserManagement'

export const Route = createFileRoute('/_app/users')({
  component: UserManagementPage,
})

function UserManagementPage() {
  return <UserManagement />
}
