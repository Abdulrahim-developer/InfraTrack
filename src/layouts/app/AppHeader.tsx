import { useRouterState } from '@tanstack/react-router'
import { Bell, ChevronDown, Menu, Search } from 'lucide-react'
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const pageTitle = pageTitles[pathname] ?? 'InfraTrack'
  const isDashboard = pathname === '/'

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full min-w-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:px-5 lg:px-6 xl:px-8">
      {/* Left section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <h1 className="max-w-[145px] truncate text-base font-bold text-slate-900 sm:max-w-[220px] sm:text-lg xl:max-w-none xl:text-xl">
            {isDashboard ? 'Overview' : pageTitle}
          </h1>

          <p className="mt-0.5 hidden text-xs text-slate-500 xl:block">
           {isDashboard
  ? 'Your infrastructure management overview.'
  : 'Infrastructure Asset Management'}
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3 xl:gap-4">
        {/* Search: visible on wide desktop screens */}
        <div
          aria-label="Search assets, users, or reference ID. Coming soon."
          className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 xl:flex xl:w-[290px]"
        >
          <Search size={18} aria-hidden="true" />

          <span className="min-w-0 flex-1 truncate">
            Search assets, users, or reference ID...
          </span>

          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            Ctrl + K
          </kbd>
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <span
          role="img"
          aria-label="Notifications coming soon"
          className="relative hidden size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 sm:flex"
        >
          <Bell size={20} aria-hidden="true" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
        </span>

        {/* User profile */}
        <div
          className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 lg:pl-4"
          aria-label={`Current role: ${role}`}
        >
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white sm:size-9"
            aria-hidden="true"
          >
            AR
          </div>

          <div className="hidden xl:block">
            <p className="text-sm font-semibold text-slate-900">Abdul Rahim</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>

          <ChevronDown
            size={17}
            className="hidden text-slate-500 xl:block"
            aria-hidden="true"
          />
        </div>
      </div>
    </header>
  )
}
