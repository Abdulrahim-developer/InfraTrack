import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

import {
  assetInventory,
  assignments,
  maintenanceRecords,
  recentActivity,
  currentMockUserId,
  currentMockTechnicianId,
  type DashboardActivity,
} from '#/features/dashboard/data/dashboard.mock'

export type AppAsset = (typeof assetInventory)[number] & {
  createdAt?: string
}

export type AppAssignment = (typeof assignments)[number] & {
  assignedToDepartment?: string | null
}

export type AppMaintenanceRecord = (typeof maintenanceRecords)[number]

interface AppDataContextValue {
  assets: AppAsset[]
  setAssets: Dispatch<SetStateAction<AppAsset[]>>
  assignments: AppAssignment[]
  setAssignments: Dispatch<SetStateAction<AppAssignment[]>>
  maintenanceRecords: AppMaintenanceRecord[]
  setMaintenanceRecords: Dispatch<SetStateAction<AppMaintenanceRecord[]>>
  activities: DashboardActivity[]
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<AppAsset[]>(() =>
    assetInventory.map((asset) => ({ ...asset })),
  )

  const [assignmentRecords, setAssignmentRecords] = useState<AppAssignment[]>(() =>
    assignments.map((assignment) => ({
      ...assignment,
      assignedToDepartment: null,
    })),
  )

  const [maintenanceRecordList, setMaintenanceRecordList] = useState<
    AppMaintenanceRecord[]
  >(() => maintenanceRecords.map((record) => ({ ...record })))

  const activities = useMemo<DashboardActivity[]>(() => {
    const registeredActivities: DashboardActivity[] = assets
      .filter((asset) => Boolean(asset.createdAt))
      .map((asset) => ({
        id: `registered-${asset.id}`,
        action: 'Registered',
        assetName: asset.name,
        assetReferenceId: asset.id.slice(0, 8).toUpperCase(),
        details: 'New infrastructure asset registered',
        timestamp: asset.createdAt!,
        performedBy: 'Administrator',
        performedByUserId: 'user-administrator-01',
      }))

    const assignmentActivities: DashboardActivity[] = assignmentRecords.flatMap(
      (assignment) => {
        const asset = assets.find((item) => item.id === assignment.assetId)

        if (!asset) return []

        const assignedTo =
          assignment.assignedToUserId === currentMockUserId
            ? 'Asset Manager'
            : assignment.assignedToUserId === currentMockTechnicianId
              ? 'Technician'
              : (assignment.assignedToDepartment ?? 'a department')

        const assignedActivity: DashboardActivity = {
          id: `assigned-${assignment.id}`,
          action: 'Assigned',
          assetName: asset.name,
          assetReferenceId: asset.id.slice(0, 8).toUpperCase(),
          details: `Asset assigned to ${assignedTo}`,
          timestamp: assignment.assignedAt,
          performedBy: 'Asset Manager',
          performedByUserId: currentMockUserId,
        }

        if (!assignment.returnedAt) return [assignedActivity]

        const returnedActivity: DashboardActivity = {
          id: `returned-${assignment.id}`,
          action: 'Returned',
          assetName: asset.name,
          assetReferenceId: asset.id.slice(0, 8).toUpperCase(),
          details: 'Asset assignment returned',
          timestamp: assignment.returnedAt,
          performedBy: 'Asset Manager',
          performedByUserId: currentMockUserId,
        }

        return [assignedActivity, returnedActivity]
      },
    )

    const maintenanceActivities: DashboardActivity[] = maintenanceRecordList.flatMap(
      (record) => {
        const asset = assets.find((item) => item.id === record.assetId)

        if (!asset) return []

        return [
          {
            id: `maintenance-${record.id}`,
            action: 'Maintenance',
            assetName: asset.name,
            assetReferenceId: asset.id.slice(0, 8).toUpperCase(),
            details: 'Maintenance record created',
            timestamp: record.performedAt,
            performedBy: 'Technician',
            performedByUserId: record.performedBy,
          },
        ]
      },
    )

    const dynamicActivities = [
      ...registeredActivities,
      ...assignmentActivities,
      ...maintenanceActivities,
    ]

    const dynamicIds = new Set(dynamicActivities.map((activity) => activity.id))

    const existingActivities = recentActivity.filter(
      (activity) => !dynamicIds.has(activity.id),
    )

    return [...dynamicActivities, ...existingActivities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }, [assets, assignmentRecords, maintenanceRecordList])

  return (
    <AppDataContext.Provider
      value={{
        assets,
        setAssets,
        assignments: assignmentRecords,
        setAssignments: setAssignmentRecords,
        maintenanceRecords: maintenanceRecordList,
        setMaintenanceRecords: setMaintenanceRecordList,
        activities,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider')
  }

  return context
}
