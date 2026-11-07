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
  location: string
}

interface MockAssignment {
  assetId: string
  assignedToUserId: string | null
  assignedAt: string
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

// Temporary identity for the Asset Manager dashboard preview.
// Later, this will come from the authenticated server session.
export const currentMockUserId = 'user-asset-manager-01'

// Fictional asset records for dashboard development.
const assets: MockAsset[] = [
  {
    id: 'a12f7c91-2d34-4e56-8a90-123456789001',
    name: 'Core Router',
    type: 'Router',
    status: 'Active',
    location: 'Server Room - Floor 2',
  },
  {
    id: 'b23f8d02-3e45-4f67-9b01-234567890012',
    name: 'Database Server',
    type: 'Server',
    status: 'Maintenance',
    location: 'Data Centre - Rack A1',
  },
  {
    id: 'c34f9e13-4f56-4078-ac12-345678901023',
    name: 'Network Switch 01',
    type: 'Switch',
    status: 'Active',
    location: 'Network Room - Floor 1',
  },
  {
    id: 'd45f0a24-5067-4189-bd23-456789012034',
    name: 'Backup Server',
    type: 'Server',
    status: 'In Storage',
    location: 'Storage Room - Ground Floor',
  },
  {
    id: 'e56f1b35-6178-4290-ce34-567890123045',
    name: 'Branch Router',
    type: 'Router',
    status: 'Active',
    location: 'Branch Office - Room 101',
  },
  {
    id: 'f67f2c46-7289-43a1-df45-678901234056',
    name: 'Access Switch 02',
    type: 'Switch',
    status: 'Maintenance',
    location: 'Network Room - Floor 2',
  },
  {
    id: 'a78f3d57-8390-44b2-e056-789012345067',
    name: 'Application Server',
    type: 'Server',
    status: 'Active',
    location: 'Data Centre - Rack B2',
  },
  {
    id: 'b89f4e68-9401-45c3-f167-890123456078',
    name: 'Legacy Router',
    type: 'Router',
    status: 'Retired',
    location: 'Storage Room - Ground Floor',
  },
]

// An assignment is current when returnedAt is null.
const assignments: MockAssignment[] = [
  {
    assetId: assets[0].id,
    assignedToUserId: currentMockUserId,
    assignedAt: '2026-10-28T09:00:00',
    returnedAt: null,
  },
  {
    assetId: assets[2].id,
    assignedToUserId: 'user-technician-01',
    assignedAt: '2026-10-25T10:30:00',
    returnedAt: null,
  },
  {
    assetId: assets[4].id,
    assignedToUserId: currentMockUserId,
    assignedAt: '2026-10-22T11:15:00',
    returnedAt: null,
  },
  {
    assetId: assets[6].id,
    assignedToUserId: currentMockUserId,
    assignedAt: '2026-10-20T14:00:00',
    returnedAt: null,
  },
  {
    assetId: assets[3].id,
    assignedToUserId: currentMockUserId,
    assignedAt: '2026-10-10T10:00:00',
    returnedAt: '2026-10-20T10:00:00',
  },
]

// Dashboard records for the current mock Asset Manager.
export const myAssignedAssets = assignments
  .filter(
    (assignment) =>
      assignment.assignedToUserId === currentMockUserId && assignment.returnedAt === null,
  )
  .flatMap((assignment) => {
    const asset = assets.find((item) => item.id === assignment.assetId)

    if (!asset) return []

    return [
      {
        ...asset,
        assignedAt: assignment.assignedAt,
      },
    ]
  })

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
