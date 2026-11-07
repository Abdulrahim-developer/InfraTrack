import { createFileRoute, Outlet } from '@tanstack/react-router'
import AppLayout from '#/layouts/app/AppLayout'

export const Route = createFileRoute('/_app')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  // Temporary role for UI development.
  // Later, this will come from the authenticated session.
  return (
    <AppLayout role="Administrator">
      <Outlet />
    </AppLayout>
  )
}
