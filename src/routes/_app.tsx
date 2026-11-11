import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import AppLayout from '#/layouts/app/AppLayout'
import { getCurrentUser } from '#/features/auth/server/session'
import type { AppRole } from '#/features/navigation/navigation.config'

function mapDatabaseRole(role: string): AppRole {
  const roleMap: Record<string, AppRole> = {
    ADMINISTRATOR: 'Administrator',
    ASSET_MANAGER: 'Asset Manager',
    TECHNICIAN: 'Technician',
    VIEWER_AUDITOR: 'Viewer/Auditor',
  }

  const mappedRole = roleMap[role]

  if (!mappedRole) {
    throw new Error('Your account has an invalid role configuration.')
  }

  return mappedRole
}

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const user = await getCurrentUser()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    return {
      authenticatedUser: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: mapDatabaseRole(user.role),
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
      },
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { authenticatedUser } = Route.useRouteContext()

  return (
    <AppLayout
      role={authenticatedUser.role}
      user={{
        fullName: authenticatedUser.fullName,
        email: authenticatedUser.email,
      }}
    >
      <Outlet />
    </AppLayout>
  )
}
