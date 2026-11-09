import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, LockKeyhole, LogOut, X } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { navigationByRole, type AppRole } from '#/features/navigation/navigation.config'
import {
  RolePreviewProvider,
  useRolePreview,
} from '#/features/navigation/RolePreviewContext'
import { AppDataProvider } from '#/features/dashboard/context/AppDataContext'

interface AppLayoutProps {
  children: ReactNode
  role: AppRole
}

const availableRoles: AppRole[] = [
  'Administrator',
  'Asset Manager',
  'Technician',
  'Viewer/Auditor',
]

function isRouteAllowed(role: AppRole, pathname: string) {
  const permittedItems = navigationByRole[role].flatMap((section) =>
    section.items.filter((item) => item.available),
  )

  return permittedItems.some((item) => {
    if (item.href === '/') {
      return pathname === '/'
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  })
}

function RoleRouteGuard({ children }: { children: ReactNode }) {
  const { role } = useRolePreview()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const navigate = useNavigate()

  const hasAccess = isRouteAllowed(role, pathname)

  useEffect(() => {
    if (!hasAccess) {
      void navigate({ to: '/' })
    }
  }, [hasAccess, navigate])

  if (!hasAccess) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <LockKeyhole size={30} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
          Access Restricted
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
          Your current preview role does not have permission to access this page.
          Redirecting you to the dashboard.
        </p>
      </section>
    )
  }

  return children
}

export default function AppLayout({ children, role }: AppLayoutProps) {
  const [activeRole, setActiveRole] = useState<AppRole>(role)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const [isSignedOutPreview, setIsSignedOutPreview] = useState(false)

  function toggleSidebar() {
    setIsSidebarOpen((previous) => !previous)
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  function confirmSignOut() {
    setIsSignOutDialogOpen(false)
    setIsSignedOutPreview(true)
  }

  if (isSignedOutPreview) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <LogOut size={26} />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            Signed Out Preview
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            You confirmed the sign-out action. Authentication is not connected yet, so no
            real session has been terminated.
          </p>

          <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            This is a temporary UI preview. Login and session management will be
            implemented with authentication.
          </p>
        </section>
      </main>
    )
  }

  return (
    <RolePreviewProvider value={{ role: activeRole, setRole: setActiveRole }}>
      <AppDataProvider>
        <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
          <AppSidebar
            role={activeRole}
            isOpen={isSidebarOpen}
            onClose={closeSidebar}
            onSignOutClick={() => setIsSignOutDialogOpen(true)}
          />

          <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            <AppHeader role={activeRole} onMenuClick={toggleSidebar} />

            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
              {/* Temporary development-only role selector */}
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Development Preview
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Switch roles to preview different user experiences.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Preview as</span>

                  <select
                    value={activeRole}
                    onChange={(event) => setActiveRole(event.target.value as AppRole)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    {availableRoles.map((availableRole) => (
                      <option key={availableRole} value={availableRole}>
                        {availableRole}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <RoleRouteGuard>{children}</RoleRouteGuard>
            </main>
          </div>

          {isSignOutDialogOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setIsSignOutDialogOpen(false)
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="signout-title"
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <AlertCircle size={25} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSignOutDialogOpen(false)}
                    aria-label="Close confirmation"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <h2
                  id="signout-title"
                  className="mt-4 text-lg font-semibold text-slate-900 dark:text-white"
                >
                  Sign out of InfraTrack?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Are you sure you want to sign out? You will need to sign in again to
                  access your account.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSignOutDialogOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={confirmSignOut}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-blue-700"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </AppDataProvider>
    </RolePreviewProvider>
  )
}
