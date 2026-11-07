/**
 * Temporary dashboard data for UI development.
 * These records are fictional and must be replaced
 * with data returned by the backend API.
 */

export type AssetStatus = 'Active' | 'Maintenance' | 'In Storage' | 'Retired'

export type AssetType = 'Router' | 'Server' | 'Switch'

interface MockAsset {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
}

interface MockAssignment {
  assetId: string
  returnedAt: string | null
}

export interface DashboardActivity {
  id: string
  action: 'Assigned' | 'Registered' | 'Maintenance' | 'Updated' | 'Returned'
  assetName: string
  assetReferenceId: string
  details: string
  timestamp: string
  performedBy: string
}

// Fictional asset records for dashboard development.
const assets: MockAsset[] = [
  { id: '1', name: 'Core Router', type: 'Router', status: 'Active' },
  { id: '2', name: 'Database Server', type: 'Server', status: 'Maintenance' },
  { id: '3', name: 'Network Switch 01', type: 'Switch', status: 'Active' },
  { id: '4', name: 'Backup Server', type: 'Server', status: 'In Storage' },
  { id: '5', name: 'Branch Router', type: 'Router', status: 'Active' },
  { id: '6', name: 'Access Switch 02', type: 'Switch', status: 'Maintenance' },
  { id: '7', name: 'Application Server', type: 'Server', status: 'Active' },
  { id: '8', name: 'Legacy Router', type: 'Router', status: 'Retired' },
]

// An assignment is current when returnedAt is null.
const assignments: MockAssignment[] = [
  { assetId: '1', returnedAt: null },
  { assetId: '3', returnedAt: null },
  { assetId: '5', returnedAt: null },
  { assetId: '7', returnedAt: null },
  { assetId: '4', returnedAt: '2026-10-20T10:00:00Z' },
]

export const dashboardStats = {
  totalAssets: assets.length,
  assignedAssets: assignments.filter((assignment) => assignment.returnedAt === null)
    .length,
  maintenanceAssets: assets.filter((asset) => asset.status === 'Maintenance').length,
  activeAssets: assets.filter((asset) => asset.status === 'Active').length,
}

export const assetsByType = [
  {
    type: 'Router',
    count: assets.filter((asset) => asset.type === 'Router').length,
  },
  {
    type: 'Server',
    count: assets.filter((asset) => asset.type === 'Server').length,
  },
  {
    type: 'Switch',
    count: assets.filter((asset) => asset.type === 'Switch').length,
  },
]

export const assetsByStatus = ['Active', 'Maintenance', 'In Storage', 'Retired'].map(
  (status) => ({
    status,
    count: assets.filter((asset) => asset.status === status).length,
  }),
)

// Fictional activity records for dashboard UI development.
export const recentActivity: DashboardActivity[] = [
  {
    id: '1',
    action: 'Assigned',
    assetName: 'Core Router',
    assetReferenceId: 'RTR-0458',
    details: 'Asset assigned to a department',
    timestamp: '2026-11-04T10:24:00',
    performedBy: 'Asset Manager',
  },
  {
    id: '2',
    action: 'Registered',
    assetName: 'Database Server',
    assetReferenceId: 'SRV-0023',
    details: 'New infrastructure asset registered',
    timestamp: '2026-11-04T09:57:00',
    performedBy: 'Administrator',
  },
  {
    id: '3',
    action: 'Maintenance',
    assetName: 'Network Switch 01',
    assetReferenceId: 'SWT-0176',
    details: 'Maintenance record created',
    timestamp: '2026-11-03T16:12:00',
    performedBy: 'Technician',
  },
  {
    id: '4',
    action: 'Updated',
    assetName: 'Application Server',
    assetReferenceId: 'SRV-0891',
    details: 'Asset information updated',
    timestamp: '2026-11-03T11:36:00',
    performedBy: 'Asset Manager',
  },
  {
    id: '5',
    action: 'Returned',
    assetName: 'Branch Router',
    assetReferenceId: 'RTR-0321',
    details: 'Asset assignment returned',
    timestamp: '2026-11-02T17:20:00',
    performedBy: 'Technician',
  },
]