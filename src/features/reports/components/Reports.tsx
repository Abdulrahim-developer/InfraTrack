import { useMemo, useState } from 'react'
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Wrench,
} from 'lucide-react'
import {
  currentMockTechnicianId,
  currentMockUserId,
} from '#/features/dashboard/data/dashboard.mock'
import { useAppData } from '#/features/dashboard/context/AppDataContext'
import type {
  AppAsset,
  AppAssignment,
  AppMaintenanceRecord,
} from '#/features/dashboard/context/AppDataContext'

type ReportType = 'inventory' | 'status' | 'assignments' | 'maintenance'

interface ReportColumn {
  key: string
  label: string
}

interface ReportDefinition {
  id: ReportType
  title: string
  description: string
  icon: typeof Boxes
}

const reportDefinitions: ReportDefinition[] = [
  {
    id: 'inventory',
    title: 'Asset Inventory',
    description: 'View all registered infrastructure assets.',
    icon: Boxes,
  },
  {
    id: 'status',
    title: 'Asset Status',
    description: 'Review assets grouped by lifecycle status.',
    icon: BarChart3,
  },
  {
    id: 'assignments',
    title: 'Asset Assignment',
    description: 'Review current and historical assignments.',
    icon: Users,
  },
  {
    id: 'maintenance',
    title: 'Maintenance History',
    description: 'Review completed maintenance activities.',
    icon: Wrench,
  },
]

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getAssigneeName(userId: string | null, department?: string | null) {
  if (!userId) return department || 'Department assignment'
  if (userId === currentMockUserId) return 'Asset Manager'
  if (userId === currentMockTechnicianId) return 'Technician'

  return 'Other user'
}

function getReportData(
  reportType: ReportType,
  assets: AppAsset[],
  assignments: AppAssignment[],
  maintenanceRecords: AppMaintenanceRecord[],
): {
  columns: ReportColumn[]
  rows: Record<string, string | number>[]
} {
  switch (reportType) {
    case 'inventory':
      return {
        columns: [
          { key: 'name', label: 'Asset Name' },
          { key: 'type', label: 'Asset Type' },
          { key: 'serialNumber', label: 'Serial Number' },
          { key: 'location', label: 'Location' },
          { key: 'status', label: 'Status' },
          { key: 'assignedTo', label: 'Assigned To' },
        ],
        rows: assets.map((asset) => {
          const currentAssignment = assignments.find(
            (assignment) =>
              assignment.assetId === asset.id && assignment.returnedAt === null,
          )

          return {
            name: asset.name,
            type: asset.type,
            serialNumber: asset.serialNumber,
            location: asset.location,
            status: asset.status,
            assignedTo: currentAssignment
              ? getAssigneeName(
                  currentAssignment.assignedToUserId,
                  currentAssignment.assignedToDepartment,
                )
              : 'Unassigned',
          }
        }),
      }

    case 'status': {
      const statuses = ['Active', 'Maintenance', 'In Storage', 'Retired']

      return {
        columns: [
          { key: 'status', label: 'Asset Status' },
          { key: 'count', label: 'Number of Assets' },
        ],
        rows: statuses.map((status) => ({
          status,
          count: assets.filter((asset) => asset.status === status).length,
        })),
      }
    }

    case 'assignments':
      return {
        columns: [
          { key: 'assignmentId', label: 'Assignment ID' },
          { key: 'assetName', label: 'Asset Name' },
          { key: 'assignedTo', label: 'Assigned To' },
          { key: 'assignedAt', label: 'Assigned Date' },
          { key: 'returnedAt', label: 'Returned Date' },
          { key: 'assignmentStatus', label: 'Assignment Status' },
        ],
        rows: assignments.map((assignment) => {
          const asset = assets.find((item) => item.id === assignment.assetId)

          return {
            assignmentId: assignment.id,
            assetName: asset?.name ?? 'Unknown asset',
            assignedTo: getAssigneeName(
              assignment.assignedToUserId,
              assignment.assignedToDepartment,
            ),
            assignedAt: formatDate(assignment.assignedAt),
            returnedAt: formatDate(assignment.returnedAt),
            assignmentStatus: assignment.returnedAt ? 'Returned' : 'Current',
          }
        }),
      }

    case 'maintenance':
      return {
        columns: [
          { key: 'maintenanceId', label: 'Maintenance ID' },
          { key: 'assetName', label: 'Asset Name' },
          { key: 'maintenanceType', label: 'Maintenance Type' },
          { key: 'description', label: 'Description' },
          { key: 'performedBy', label: 'Performed By' },
          { key: 'performedAt', label: 'Performed Date' },
        ],
        rows: maintenanceRecords.map((record) => {
          const asset = assets.find((item) => item.id === record.assetId)

          return {
            maintenanceId: record.id,
            assetName: asset?.name ?? 'Unknown asset',
            maintenanceType: record.maintenanceType,
            description: record.description,
            performedBy: getAssigneeName(record.performedBy),
            performedAt: formatDate(record.performedAt),
          }
        }),
      }
  }
}

function escapeCsvValue(value: string | number) {
  const text = String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory')

  const { assets, assignments, maintenanceRecords } = useAppData()

  const reportData = useMemo(
    () => getReportData(selectedReport, assets, assignments, maintenanceRecords),
    [selectedReport, assets, assignments, maintenanceRecords],
  )

  const selectedDefinition = reportDefinitions.find(
    (report) => report.id === selectedReport,
  )!

  function handleExportCsv() {
    const header = reportData.columns
      .map((column) => escapeCsvValue(column.label))
      .join(',')

    const body = reportData.rows.map((row) =>
      reportData.columns.map((column) => escapeCsvValue(row[column.key] ?? '')).join(','),
    )

    const csvContent = [header, ...body].join('\r\n')
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `infratrack-${selectedReport}-report.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function handleExportPdf() {
    window.print()
  }

  return (
    <div data-report-print-root className="space-y-6">
      {/* Print-only report heading */}
      <div className="hidden print:block print:pb-5">
        <h1 className="text-2xl font-bold text-black">InfraTrack</h1>
        <p className="mt-1 text-sm text-gray-600">Infrastructure Asset Tracker</p>

        <div className="mt-5 border-b border-gray-300 pb-3">
          <h2 className="text-xl font-bold text-black">{selectedDefinition.title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Generated on {new Date().toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Total records: {reportData.rows.length}
          </p>
        </div>
      </div>

      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Generate and export reports from your infrastructure asset records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <FileSpreadsheet size={18} />
          <span>CSV and PDF export available</span>
        </div>
      </div>

      {/* Report selection */}
      <section className="space-y-3 print:hidden">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Select a Report
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose a report type to preview its records.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reportDefinitions.map((report) => {
            const Icon = report.icon
            const isSelected = selectedReport === report.id

            return (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedReport(report.id)}
                aria-pressed={isSelected}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-950/60'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex size-11 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  {isSelected && (
                    <CheckCircle2
                      size={19}
                      className="text-blue-600 dark:text-blue-400"
                      aria-label="Selected report"
                    />
                  )}
                </div>

                <h3
                  className={`mt-4 text-sm font-semibold ${
                    isSelected
                      ? 'text-blue-950 dark:text-white'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {report.title}
                </h3>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    isSelected
                      ? 'text-blue-800 dark:text-blue-200'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {report.description}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Report preview and printable table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 print:overflow-visible print:rounded-none print:border-0 print:bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 print:hidden">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {selectedDefinition.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Preview of {reportData.rows.length} records
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={reportData.rows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={reportData.rows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={17} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm print:min-w-0 print:text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 print:bg-gray-100">
              <tr>
                {reportData.columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="whitespace-nowrap px-5 py-3 font-semibold text-slate-600 dark:text-slate-200 print:border print:border-gray-300 print:px-2 print:py-2 print:text-black"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 print:divide-gray-300">
              {reportData.rows.map((row, index) => (
                <tr
                  key={`${selectedReport}-${index}`}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 print:break-inside-avoid print:hover:bg-white"
                >
                  {reportData.columns.map((column) => (
                    <td
                      key={column.key}
                      className="max-w-xs px-5 py-3.5 text-slate-700 dark:text-slate-300 print:border print:border-gray-300 print:px-2 print:py-2 print:text-black"
                    >
                      {row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}

              {reportData.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={reportData.columns.length}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No records are available for this report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <span>{reportData.rows.length} records displayed</span>
          <span>Data shown is currently for UI development only.</span>
        </div>
      </section>

      {/* Print layout rules */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 14mm;
          }

          body * {
            visibility: hidden !important;
          }

          [data-report-print-root],
          [data-report-print-root] * {
            visibility: visible !important;
          }

          [data-report-print-root] {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #000 !important;
            background: #fff !important;
          }

          [data-report-print-root] table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          [data-report-print-root] thead {
            display: table-header-group;
          }

          [data-report-print-root] tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          [data-report-print-root] th,
          [data-report-print-root] td {
            overflow-wrap: anywhere;
          }

          html,
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  )
}
