import { createFileRoute } from '@tanstack/react-router'
import AuditLogs from '#/features/audit-logs/components/AuditLogs'

export const Route = createFileRoute('/_app/audit-logs')({
  component: AuditLogsPage,
})

function AuditLogsPage() {
  return <AuditLogs role="Administrator" />
}
