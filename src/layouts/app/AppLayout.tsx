import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, LockKeyhole, LogOut, X } from 'lucide-react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { navigationByRole, type AppRole } from '#/features/navigation/navigation.config'
import { AppDataProvider } from '#/features/dashboard/context/AppDataContext'
import { logout } from '#/features/auth/server/session'

interface AppLayoutProps {
  children: ReactNode
  role: AppRole
  user: {
    fullName: string
    email: string
  }
}

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

function RoleRouteGuard({ children, role }: { children: ReactNode; role: AppRole }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const navigate = useNavigate()
  const isPublicRoute = pathname === '/login' || pathname === '/setup'

  const hasAccess = isPublicRoute || isRouteAllowed(role, pathname)

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
          Your account role does not have permission to access this page. Redirecting you
          to the dashboard.
        </p>
      </section>
    )
  }

  return children
}

export default function AppLayout({ children, role, user }: AppLayoutProps) {
  const navigate = useNavigate()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  function toggleSidebar() {
    setIsSidebarOpen((previous) => !previous)
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  async function confirmSignOut() {
    setIsSigningOut(true)
    setSignOutError('')

    try {
      await logout()
      await navigate({ to: '/login', replace: true })
    } catch {
      setSignOutError('Unable to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <AppDataProvider>
      <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AppSidebar
          role={role}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          onSignOutClick={() => setIsSignOutDialogOpen(true)}
        />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader role={role} user={user} onMenuClick={toggleSidebar} />

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
            <RoleRouteGuard role={role}>{children}</RoleRouteGuard>
          </main>
        </div>

        {isSignOutDialogOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSigningOut) {
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
                  disabled={isSigningOut}
                  onClick={() => setIsSignOutDialogOpen(false)}
                  aria-label="Close confirmation"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
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

              {signOutError && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                >
                  {signOutError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => setIsSignOutDialogOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => void confirmSignOut()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppDataProvider>
  )
}
