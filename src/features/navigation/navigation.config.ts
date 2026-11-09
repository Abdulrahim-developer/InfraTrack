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
  available: true,
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
  available: true,
}

const userManagement: NavigationItem = {
  label: 'User Management',
  href: '/users',
  icon: Users,
  available: true,
}

const auditLogs: NavigationItem = {
  label: 'Audit Logs',
  href: '/audit-logs',
  icon: FileText,
  available: true,
}

const settings: NavigationItem = {
  label: 'Settings',
  href: '/settings',
  icon: Settings,
  available: false,
}

const profileSettings: NavigationItem = {
  label: 'My Profile',
  href: '/profile',
  icon: UserCircle,
  available: true,
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
    {
      title: 'Account',
      items: [profileSettings],
    },
  ],

  'Asset Manager': [
    {
      title: 'Workspace',
      items: [dashboard, assetInventory, assignments, maintenance, reports],
    },
    {
      title: 'Account',
      items: [profileSettings],
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
          available: true,
        },
        {
          label: 'Maintenance Records',
          href: '/maintenance',
          icon: Wrench,
          available: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [profileSettings],
    },
  ],

  'Viewer/Auditor': [
    {
      title: 'Workspace',
      items: [dashboard, assetInventory, reports, auditLogs],
    },
    {
      title: 'Account',
      items: [profileSettings],
    },
  ],
}
