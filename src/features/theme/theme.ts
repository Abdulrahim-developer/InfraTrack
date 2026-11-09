export type ThemeMode = 'light' | 'dark' | 'auto'

export const THEME_STORAGE_KEY = 'theme'
export const THEME_CHANGE_EVENT = 'theme-change'

export function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto'

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored
    }
  } catch {
    // Use the default theme if browser storage is unavailable.
  }

  return 'auto'
}

export function subscribeTheme(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(THEME_CHANGE_EVENT, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(THEME_CHANGE_EVENT, callback)
  }
}

export function getServerThemeSnapshot(): ThemeMode {
  return 'auto'
}

export function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)

  if (mode === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', mode)
  }

  document.documentElement.style.colorScheme = resolved
}

export function setThemeMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // The current tab can still apply the selected theme.
  }

  applyThemeMode(mode)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}
