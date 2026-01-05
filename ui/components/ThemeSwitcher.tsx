"use client"

/**
 * ThemeSwitcher Component
 *
 * A toggle button to switch between light and dark themes.
 * Persists preference to localStorage and respects system preference as default.
 *
 * Note: Uses inline ternary expressions for reactivity - BarefootJS compiler
 * tracks signal() calls directly in JSX templates.
 */

import { createSignal, createEffect, createMemo } from '@barefootjs/dom'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeSwitcherProps {
  defaultTheme?: Theme
}

export function ThemeSwitcher({ defaultTheme = 'system' }: ThemeSwitcherProps) {
  const [theme, setTheme] = createSignal<Theme>(defaultTheme)

  // Initialize theme from localStorage after hydration
  createEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setTheme(stored)
    }
  })

  // Apply theme to document when theme changes
  createEffect(() => {
    const currentTheme = theme()
    const root = document.documentElement

    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', currentTheme === 'dark')
    }

    localStorage.setItem('theme', currentTheme)
  })

  const cycleTheme = () => {
    const current = theme()
    let next: Theme
    if (current === 'light') {
      next = 'dark'
    } else if (current === 'dark') {
      next = 'system'
    } else {
      next = 'light'
    }
    setTheme(next)
  }

  // Use createMemo for derived state
  const label = createMemo(() => {
    const t = theme()
    return t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'
  })

  // Use separate conditions instead of nested ternary for proper compilation
  const isLight = createMemo(() => theme() === 'light')
  const isDark = createMemo(() => theme() === 'dark')
  const isSystem = createMemo(() => theme() === 'system')

  return (
    <button
      type="button"
      onClick={cycleTheme}
      class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
      aria-label={isLight() ? 'Current theme: Light. Click to change.' : isDark() ? 'Current theme: Dark. Click to change.' : 'Current theme: System. Click to change.'}
    >
      {isLight() ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : null}
      {isDark() ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : null}
      {isSystem() ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      ) : null}
      <span>{label()}</span>
    </button>
  )
}
