import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AssetStatusChart from '#/features/dashboard/components/AssetStatusChart'

describe('AssetStatusChart', () => {
  it('renders all four asset statuses', () => {
    render(<AssetStatusChart />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('In Storage')).toBeInTheDocument()
    expect(screen.getByText('Retired')).toBeInTheDocument()
  })
})
