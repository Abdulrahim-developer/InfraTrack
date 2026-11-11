
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { DashboardActivity } from '#/features/dashboard/data/dashboard.mock'
import { getDashboardData } from '#/features/dashboard/server/get-dashboard-data'

export type AssetStatus = 'Active' | 'Maintenance' | 'In Storage' | 'Retired'

export type AppAsset = {
  id: string
  name: string
  type: string
  serialNumber: string
  status: AssetStatus
  location: string
  createdAt?: string
  assignedTo?: string | null
}

export type AppAssignment = {
  id: string
  assetId: string
  assignedToUserId: string | null
  assignedToUserName: string | null
  assignedAt: string
  returnedAt: string | null
  assignedToDepartment?: string | null
}

export type AppMaintenanceRecord = {
  id: string
  assetId: string
  performedBy: string
  performedByName: string | null
  maintenanceType: string
  description: string
  performedAt: string
}

interface AppDataContextValue {
  currentUserId: string | null
  assets: AppAsset[]
  assignments: AppAssignment[]
  maintenanceRecords: AppMaintenanceRecord[]
  activities: DashboardActivity[]
  isLoading: boolean
  error: string | null
  refreshDashboard: () => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [assets, setAssets] = useState<AppAsset[]>([])
  const [assignments, setAssignments] = useState<AppAssignment[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<AppMaintenanceRecord[]>([])
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshDashboard = useCallback(async () => {
    try {
      const result = await getDashboardData()

      if (!result.success) {
        throw new Error('Unable to load dashboard data')
      }

      setCurrentUserId(result.data.currentUserId)
      setAssets(result.data.assets)
      setAssignments(result.data.assignments)
      setMaintenanceRecords(result.data.maintenanceRecords)
      setActivities(result.data.activities)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard data. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshDashboard()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshDashboard()
      }
    }, 30_000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refreshDashboard()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshDashboard])

  return (
    <AppDataContext.Provider
      value={{
        currentUserId,
        assets,
        assignments,
        maintenanceRecords,
        activities,
        isLoading,
        error,
        refreshDashboard,
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
