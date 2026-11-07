import { useState, type ReactNode } from 'react'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import type { AppRole } from '#/features/navigation/navigation.config'

interface AppLayoutProps {
  children: ReactNode
  role: AppRole
}

export default function AppLayout({ children, role }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  function toggleSidebar() {
    setIsSidebarOpen((previous) => !previous)
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar role={role} isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader role={role} onMenuClick={toggleSidebar} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
