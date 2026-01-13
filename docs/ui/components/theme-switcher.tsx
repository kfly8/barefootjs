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
import { SunIcon, MoonIcon } from '@ui/components/ui/icon'

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
      {isDark() ? <SunIcon size="md" /> : <MoonIcon size="md" />}
    </button>
  )
}
