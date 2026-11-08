import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Wrench,
  UserCircle,
  type LucideIcon,
} from 'lucide-react'

export type AppRole = 'Administrator' | 'Asset Manager' | 'Technician' | 'Viewer/Auditor'

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
  available: boolean
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const dashboard: NavigationItem = {
  label: 'Dashboard',
  href: '/',
  icon: LayoutDashboard,
  available: true,
}

const assetInventory: NavigationItem = {
  label: 'Asset Inventory',
  href: '/assets',
  icon: Boxes,
  available: false,
}

const assignments: NavigationItem = {
  label: 'Assignments',
  href: '/assignments',
  icon: ClipboardList,
  available: true,
}

const maintenance: NavigationItem = {
  label: 'Maintenance',
  href: '/maintenance',
  icon: Wrench,
  available: true,
}

const reports: NavigationItem = {
  label: 'Reports',
  href: '/reports',
  icon: BarChart3,
  available: false,
}

const userManagement: NavigationItem = {
  label: 'User Management',
  href: '/users',
  icon: Users,
  available: false,
}

const auditLogs: NavigationItem = {
  label: 'Audit Logs',
  href: '/audit-logs',
  icon: FileText,
  available: false,
}

const settings: NavigationItem = {
  label: 'Settings',
  href: '/settings',
  icon: Settings,
  available: false,
}

const profileSettings: NavigationItem = {
  label: 'Profile & Settings',
  href: '/profile',
  icon: UserCircle,
  available: false,
}

export const navigationByRole: Record<AppRole, NavigationSection[]> = {
  Administrator: [
    {
      title: 'Workspace',
      items: [dashboard, assetInventory, assignments, maintenance, reports],
    },
    {
      title: 'Administration',
      items: [userManagement, auditLogs, settings],
    },
  ],

  'Asset Manager': [
    {
      title: 'Workspace',
      items: [dashboard, assetInventory, assignments, maintenance, reports],
    },
  ],

  Technician: [
    {
      title: 'Workspace',
      items: [
        dashboard,
        {
          label: 'My Assigned Assets',
          href: '/my-assets',
          icon: Boxes,
          available: false,
        },
        {
          label: 'Maintenance Records',
          href: '/maintenance',
          icon: Wrench,
          available: false,
        },
      ],
    },
  ],

  'Viewer/Auditor': [
    {
      title: 'Workspace',
      items: [dashboard, assetInventory, reports],
    },
    {
      title: 'Account',
      items: [profileSettings],
    },
  ],
}
