import { render, screen } from '../utils/render'
import { describe, expect, it } from 'vitest'
import AssetStatusChart from '#/features/dashboard/components/shared/AssetStatusChart'

describe('AssetStatusChart', () => {
  it('renders all four asset statuses', () => {
    render(<AssetStatusChart />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('In Storage')).toBeInTheDocument()
    expect(screen.getByText('Retired')).toBeInTheDocument()
  })
})
