"use client"

/**
 * ThemeSwitcher Component
 *
 * A toggle button to switch between light and dark themes.
 * Uses system preference as initial default, persists user choice to localStorage.
 *
 * Note: Uses inline ternary expressions for reactivity - BarefootJS compiler
 * tracks signal() calls directly in JSX templates.
 */

import { createSignal, createEffect, createMemo } from '@barefootjs/dom'

export type Theme = 'light' | 'dark'

export interface ThemeSwitcherProps {
  defaultTheme?: Theme | 'system'
}

export function ThemeSwitcher({ defaultTheme = 'system' }: ThemeSwitcherProps) {
  // Start with 'light' for SSR, will be updated on client
  const [theme, setTheme] = createSignal<Theme>('light')
  const [initialized, setInitialized] = createSignal(false)

  // Initialize theme from localStorage or system preference (client-side only)
  createEffect(() => {
    if (initialized()) return
    setInitialized(true)

    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    } else {
      // Use system preference as default
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  })

  // Apply theme to document when theme changes (initial load only, no transition)
  createEffect(() => {
    if (!initialized()) return
    const currentTheme = theme()
    const root = document.documentElement
    root.classList.toggle('dark', currentTheme === 'dark')
    localStorage.setItem('theme', currentTheme)
  })

  // Toggle with smooth transition animation
  const toggleTheme = () => {
    const root = document.documentElement

    // Enable transition temporarily
    root.classList.add('theme-transition')

    // Toggle theme
    setTheme(theme() === 'light' ? 'dark' : 'light')

    // Remove transition class after animation completes (buffer time)
    setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 300)
  }

  const isDark = createMemo(() => theme() === 'dark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
      aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark() ? (
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
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  )
}
