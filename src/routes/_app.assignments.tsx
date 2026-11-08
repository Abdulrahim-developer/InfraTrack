import { createFileRoute } from '@tanstack/react-router'
import AssignmentManagement from '#/features/assignments/components/AssignmentManagement'

export const Route = createFileRoute('/_app/assignments')({
  component: AssignmentManagement,
})
