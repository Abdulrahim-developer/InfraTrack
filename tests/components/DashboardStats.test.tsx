import { render, screen, within } from '../utils/render'
import { describe, expect, it } from 'vitest'
import DashboardStats from '#/features/dashboard/components/shared/DashboardStats'

describe('DashboardStats', () => {
  it('renders all four dashboard metrics with the expected values', () => {
    render(<DashboardStats />)

    const statistics = screen.getByRole('region', {
      name: 'Asset statistics',
    })

    expect(within(statistics).getByText('Total Assets')).toBeInTheDocument()
    expect(within(statistics).getByText('8')).toBeInTheDocument()

    expect(within(statistics).getByText('Assigned Assets')).toBeInTheDocument()
    expect(within(statistics).getByText('5')).toBeInTheDocument()

    expect(within(statistics).getByText('Under Maintenance')).toBeInTheDocument()
    expect(within(statistics).getByText('2')).toBeInTheDocument()

    expect(within(statistics).getByText('In Storage')).toBeInTheDocument()
    expect(within(statistics).getByText('1')).toBeInTheDocument()
  })
})
