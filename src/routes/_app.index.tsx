import { createFileRoute } from '@tanstack/react-router'
import AdminDashboard from '#/features/dashboard/components/AdminDashboard'

export const Route = createFileRoute('/_app/')({
  component: AdminDashboard,
})
