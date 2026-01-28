"use client"

/**
 * Theme Switcher Component
 */

import { createSignal, onMount } from '@barefootjs/dom'

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

export function ThemeSwitcher() {
  const [isDark, setIsDark] = createSignal(false)

  onMount(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored === 'dark' || (stored !== 'light' && prefersDark)
    setIsDark(dark)
    if (dark) {
      document.documentElement.classList.add('dark')
    }
  })

  const toggle = () => {
    const newValue = !isDark()
    setIsDark(newValue)

    document.documentElement.classList.add('theme-transition')
    if (newValue) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 150)
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {isDark() ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
