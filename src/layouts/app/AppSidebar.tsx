import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronLeft, LogOut } from 'lucide-react'
import { navigationByRole, type AppRole } from '#/features/navigation/navigation.config'

interface AppSidebarProps {
  role: AppRole
  isOpen: boolean
  onClose: () => void
  onSignOutClick: () => void
}

export default function AppSidebar({
  role,
  isOpen,
  onClose,
  onSignOutClick,
}: AppSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const navigationSections = navigationByRole[role]

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col overflow-hidden bg-[#142B4F] text-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-40 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-11"
                aria-label="InfraTrack logo"
                role="img"
              >
                <path d="M5 19L24 3L43 19V44H5V19Z" fill="#2563EB" />
                <path d="M13 23L24 14L35 23V44H13V23Z" fill="#60A5FA" />
                <path d="M19 29H29V44H19V29Z" fill="#142B4F" />
                <path d="M9 23H15V44H9V23Z" fill="#DBEAFE" />
                <path d="M33 23H39V44H33V23Z" fill="#DBEAFE" />
                <path d="M22 33H26V37H22V33Z" fill="#FFFFFF" />
              </svg>
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide">InfraTrack</h1>
              <p className="text-xs text-slate-300">Infrastructure Asset Tracker</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6">
          {navigationSections.map((section, sectionIndex) => (
            <div
              key={section.title}
              className={sectionIndex > 0 ? 'mt-6 border-t border-white/15 pt-5' : ''}
            >
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(`${item.href}/`))

                  const className = `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 !text-white shadow-sm hover:!text-white'
                      : item.available
                        ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                        : 'cursor-not-allowed text-slate-500'
                  }`

                  return (
                    <li key={item.label}>
                      {item.available ? (
                        <Link
                          to={item.href as never}
                          onClick={onClose}
                          aria-current={isActive ? 'page' : undefined}
                          className={className}
                        >
                          <Icon size={20} aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      ) : (
                        <div
                          aria-disabled="true"
                          title="This feature is not available yet"
                          className={className}
                        >
                          <Icon size={20} aria-hidden="true" />
                          <span>{item.label}</span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Persistent bottom section with blended server-room image */}
        <div className="relative h-44 shrink-0 overflow-hidden bg-[#142B4F]">
          <img
            src="/images/server-room.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover object-center opacity-80"
          />

          {/* Blend the image into the sidebar vertically */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#142B4F] via-[#142B4F]/20 to-[#142B4F]" />

          {/* Soften the left and right image edges */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#142B4F]/70 via-transparent to-[#142B4F]/70" />

          <button
            type="button"
            onClick={onSignOutClick}
            className="absolute inset-x-3 bottom-12 z-10 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <LogOut size={20} aria-hidden="true" />
            <span>Sign Out</span>
          </button>

          <p className="absolute inset-x-0 bottom-3 z-10 text-center text-xs font-medium tracking-wide text-slate-300">
            InfraTrack v1.1
          </p>
        </div>
      </aside>
    </>
  )
}
