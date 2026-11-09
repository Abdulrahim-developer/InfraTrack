import { useEffect, useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Menu, UserRound } from 'lucide-react'
import ThemeToggle from '#/components/ThemeToggle'
import type { AppRole } from '#/features/navigation/navigation.config'

interface AppHeaderProps {
  role: AppRole
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/assets': 'Asset Inventory',
  '/assignments': 'Assignments',
  '/maintenance': 'Maintenance',
  '/reports': 'Reports',
  '/users': 'User Management',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
  '/profile': 'My Profile',
}

export default function AppHeader({ role, onMenuClick }: AppHeaderProps) {
  const [profileOpenPath, setProfileOpenPath] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const pageTitle = pageTitles[pathname] ?? 'InfraTrack'
  const isProfileOpen = profileOpenPath === pathname

  useEffect(() => {
    if (!isProfileOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpenPath(null)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpenPath(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileOpen])

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 shadow-sm sm:px-6">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 transition hover:bg-[var(--muted)] lg:hidden"
        >
          <Menu size={21} />
        </button>

        <h1 className="truncate text-lg font-semibold text-[var(--foreground)]">
          {pageTitle}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() =>
              setProfileOpenPath((previous) => (previous === pathname ? null : pathname))
            }
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            aria-label="Open profile menu"
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-[var(--muted)]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              AR
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Abdul Rahim
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">{role}</p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden transition-transform sm:block ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isProfileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-[60] mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
            >
              <div className="border-b border-[var(--border)] p-4">
                <p className="font-semibold text-[var(--foreground)]">Abdul Rahim</p>

                <p className="mt-1 break-all text-sm text-[var(--muted-foreground)]">
                  rahim@example.test
                </p>

                <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {role}
                </p>
              </div>

              <div className="p-2">
                <Link
                  to={'/profile' as never}
                  role="menuitem"
                  onClick={() => setProfileOpenPath(null)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                >
                  <UserRound size={17} />
                  My Profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
