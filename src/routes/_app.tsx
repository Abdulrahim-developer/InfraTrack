import { createFileRoute, Outlet } from '@tanstack/react-router'
import AppLayout from '#/layouts/app/AppLayout'

export const Route = createFileRoute('/_app')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  // Temporary Administrator role for UI development.
  return (
    <AppLayout role="Administrator">
      <Outlet />
    </AppLayout>
  )
}
