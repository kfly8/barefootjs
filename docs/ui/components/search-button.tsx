'use client'

/**
 * Search Button Component
 *
 * A button that opens the command palette.
 * Displays "Search..." text with Cmd+K / Ctrl+K shortcut hint.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { SearchIcon } from '@ui/components/ui/icon'

export function SearchButton() {
  // Shortcut key display (detected on client)
  const [shortcutKey, setShortcutKey] = createSignal('⌘')

  // Detect OS and set up click handler on client
  createEffect(() => {
    // Update shortcut display based on OS
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    setShortcutKey(isMac ? '⌘' : 'Ctrl')

    // Set up click handler
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

  return (
    <button
      data-search-button
      type="button"
      class="hidden sm:flex items-center gap-2 h-9 w-64 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <SearchIcon size="sm" />
      <span class="flex-1 text-left">Search...</span>
      <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span data-shortcut-key>{shortcutKey()}</span>K
      </kbd>
    </button>
  )
}
