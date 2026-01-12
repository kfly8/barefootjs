'use client'

/**
 * Search Button Component
 *
 * A button that opens the command palette.
 * Displays "Search..." text with Cmd+K / Ctrl+K shortcut hint.
 */

import { createEffect } from '@barefootjs/dom'

// Search icon
function SearchIcon() {
  return (
    <svg
      class="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export function SearchButton() {
  // Open command palette when button is clicked
  createEffect(() => {
    const button = document.querySelector('[data-search-button]')
    if (!button) return

    const handleClick = () => {
      // Dispatch Cmd+K event to open command palette
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    }

    button.addEventListener('click', handleClick)
    return () => button.removeEventListener('click', handleClick)
  })

  // Detect OS for shortcut display
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  return (
    <button
      data-search-button
      type="button"
      class="hidden sm:flex items-center gap-2 h-9 w-64 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <SearchIcon />
      <span class="flex-1 text-left">Search...</span>
      <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        {isMac ? '⌘' : 'Ctrl'}K
      </kbd>
    </button>
  )
}
