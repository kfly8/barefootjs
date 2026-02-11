"use client"

/**
 * ThemeSwitcher Component (shared)
 *
 * A toggle button to switch between light and dark themes.
 * Uses system preference as initial default, persists user choice to localStorage.
 * Inline SVG icons — no external icon dependency.
 */

import { createSignal, createEffect, createMemo } from '@barefootjs/dom'

export type Theme = 'light' | 'dark'

export interface ThemeSwitcherProps {
  defaultTheme?: Theme | 'system'
  className?: string
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function ThemeSwitcher({ defaultTheme = 'system', className }: ThemeSwitcherProps) {
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
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  })

  // Apply theme to document when theme changes
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
    root.classList.add('theme-transition')
    setTheme(theme() === 'light' ? 'dark' : 'light')
    setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 300)
  }

  const isDark = createMemo(() => theme() === 'dark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className || "inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"}
      aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark() ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
