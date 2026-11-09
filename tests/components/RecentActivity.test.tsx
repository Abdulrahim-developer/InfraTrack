import { render, screen } from '../utils/render'
import { describe, expect, it } from 'vitest'
import RecentActivity from '#/features/dashboard/components/RecentActivity'

describe('RecentActivity', () => {
  it('renders the recent activity section and its sample records', () => {
    render(<RecentActivity />)

    expect(screen.getByText('Recent Asset Activity')).toBeInTheDocument()
  })
})
