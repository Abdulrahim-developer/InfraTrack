import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AssetsByType from '#/features/dashboard/components/shared/AssetsByType'

describe('AssetsByType', () => {
  it('renders all supported asset types', () => {
    render(<AssetsByType />)

    expect(screen.getByText('Router')).toBeInTheDocument()
    expect(screen.getByText('Server')).toBeInTheDocument()
    expect(screen.getByText('Switch')).toBeInTheDocument()
  })
})
