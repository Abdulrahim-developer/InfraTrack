import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThemeToggle from '../../src/components/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()

    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders Auto mode by default', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: /theme mode: auto/i })).toBeInTheDocument()
  })

  it('loads the saved theme preference', () => {
    localStorage.setItem('theme', 'dark')

    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: /theme mode: dark/i })).toBeInTheDocument()
  })

  it('cycles through Auto, Light and Dark modes', async () => {
    const user = userEvent.setup()

    render(<ThemeToggle />)

    const button = screen.getByRole('button')

    await user.click(button)

    expect(button).toHaveTextContent('Light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(document.documentElement).toHaveClass('light')

    await user.click(button)

    expect(button).toHaveTextContent('Dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')

    await user.click(button)

    expect(button).toHaveTextContent('Auto')
    expect(localStorage.getItem('theme')).toBe('auto')
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })
})
