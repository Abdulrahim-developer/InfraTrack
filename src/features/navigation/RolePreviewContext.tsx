import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { AppRole } from './navigation.config'

interface RolePreviewContextValue {
  role: AppRole
  setRole: Dispatch<SetStateAction<AppRole>>
}

const RolePreviewContext = createContext<RolePreviewContextValue | null>(null)

export function RolePreviewProvider({
  value,
  children,
}: {
  value: RolePreviewContextValue
  children: ReactNode
}) {
  return (
    <RolePreviewContext.Provider value={value}>{children}</RolePreviewContext.Provider>
  )
}

export function useRolePreview() {
  const context = useContext(RolePreviewContext)

  if (!context) {
    throw new Error('useRolePreview must be used inside RolePreviewProvider')
  }

  return context
}
