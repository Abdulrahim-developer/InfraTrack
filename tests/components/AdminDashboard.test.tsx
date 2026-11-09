import { render, screen, within } from '../utils/render'
import { describe, expect, it } from 'vitest'
import AdminDashboard from '#/features/dashboard/components/AdminDashboard'

describe('AdminDashboard', () => {
  it('renders the dashboard overview and all major sections', () => {
    render(<AdminDashboard />)

    // Dashboard overview
    expect(
      screen.getByText('Overview of your infrastructure assets and activities.'),
    ).toBeInTheDocument()

    // Statistics
    const statistics = screen.getByRole('region', {
      name: 'Asset statistics',
    })

    expect(within(statistics).getByText('Total Assets')).toBeInTheDocument()
    expect(within(statistics).getByText('Assigned Assets')).toBeInTheDocument()
    expect(within(statistics).getByText('Under Maintenance')).toBeInTheDocument()
    expect(within(statistics).getByText('In Storage')).toBeInTheDocument()

    // Charts
    expect(screen.getByRole('heading', { name: 'Assets by Type' })).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: 'Asset Status Overview' }),
    ).toBeInTheDocument()

    // Recent activity and alerts
    expect(
      screen.getByRole('heading', { name: 'Recent Asset Activity' }),
    ).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'System Alerts' })).toBeInTheDocument()

    // Development data indicator
    expect(screen.getByText('Development preview · Sample data')).toBeInTheDocument()
  })
})
