import { useEffect, useSyncExternalStore } from 'react'
import {
  applyThemeMode,
  getServerThemeSnapshot,
  getThemeMode,
  setThemeMode,
  subscribeTheme,
} from '#/features/theme/theme'

export default function ThemeToggle() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, getServerThemeSnapshot)

  useEffect(() => {
    if (mode !== 'auto') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)

    return () => media.removeEventListener('change', onChange)
  }, [mode])

  function toggleMode() {
    const nextMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'

    setThemeMode(nextMode)
  }

  const label =
    mode === 'auto'
      ? 'Theme mode: auto (system). Click to switch to light mode.'
      : `Theme mode: ${mode}. Click to switch mode.`

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
