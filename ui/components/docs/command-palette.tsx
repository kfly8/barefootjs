'use client'

/**
 * Command Palette Component (VS Code style)
 *
 * A modal command palette that appears at the top of the screen.
 * Features:
 * - Cmd+K / Ctrl+K to open
 * - ESC to close
 * - Arrow keys for navigation
 * - Enter to select
 * - Fuzzy search filtering
 */

import { createSignal, createEffect } from '@barefootjs/dom'

// Search icon
function SearchIcon() {
  return (
    <svg
      class="h-4 w-4 text-muted-foreground"
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

// Navigation items grouped by category (static, for server-side rendering)
const getStartedItems = [
  { id: 'intro', title: 'Introduction', href: '/', category: 'Get Started' },
]

const componentItems = [
  { id: 'accordion', title: 'Accordion', href: '/components/accordion', category: 'Components' },
  { id: 'badge', title: 'Badge', href: '/components/badge', category: 'Components' },
  { id: 'button', title: 'Button', href: '/components/button', category: 'Components' },
  { id: 'card', title: 'Card', href: '/components/card', category: 'Components' },
  { id: 'checkbox', title: 'Checkbox', href: '/components/checkbox', category: 'Components' },
  { id: 'counter', title: 'Counter', href: '/components/counter', category: 'Components' },
  { id: 'dialog', title: 'Dialog', href: '/components/dialog', category: 'Components' },
  { id: 'dropdown', title: 'Dropdown', href: '/components/dropdown', category: 'Components' },
  { id: 'input', title: 'Input', href: '/components/input', category: 'Components' },
  { id: 'select', title: 'Select', href: '/components/select', category: 'Components' },
  { id: 'switch', title: 'Switch', href: '/components/switch', category: 'Components' },
  { id: 'tabs', title: 'Tabs', href: '/components/tabs', category: 'Components' },
  { id: 'toast', title: 'Toast', href: '/components/toast', category: 'Components' },
  { id: 'tooltip', title: 'Tooltip', href: '/components/tooltip', category: 'Components' },
]

const formItems = [
  { id: 'controlled-input', title: 'Controlled Input', href: '/forms/controlled-input', category: 'Forms' },
  { id: 'field-arrays', title: 'Field Arrays', href: '/forms/field-arrays', category: 'Forms' },
  { id: 'submit', title: 'Submit', href: '/forms/submit', category: 'Forms' },
  { id: 'validation', title: 'Validation', href: '/forms/validation', category: 'Forms' },
]

export function CommandPalette() {
  const [open, setOpen] = createSignal(false)

  // All interactions handled via createEffect
  createEffect(() => {
    const overlay = document.querySelector('[data-command-overlay]') as HTMLElement
    const palette = document.querySelector('[data-command-palette]') as HTMLElement
    const input = document.querySelector('[data-command-input]') as HTMLInputElement
    const list = document.querySelector('[data-command-list]') as HTMLElement

    if (!overlay || !palette || !input || !list) return

    let selectedIndex = 0

    // Get all visible items
    const getVisibleItems = () => {
      return Array.from(list.querySelectorAll('[data-command-item="true"]:not([hidden])')) as HTMLElement[]
    }

    // Update selected state
    const updateSelected = () => {
      const items = getVisibleItems()
      items.forEach((item, i) => {
        item.dataset.selected = i === selectedIndex ? 'true' : 'false'
      })
      // Scroll into view
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }

    // Filter items based on query
    const filterItems = (query: string) => {
      const q = query.toLowerCase()
      const allItems = list.querySelectorAll('[data-command-item="true"]') as NodeListOf<HTMLElement>
      const categories = list.querySelectorAll('[data-command-category]') as NodeListOf<HTMLElement>

      // Track which categories have visible items
      const visibleCategories = new Set<string>()

      allItems.forEach(item => {
        const title = item.dataset.title?.toLowerCase() || ''
        const category = item.dataset.category || ''
        const visible = !q || title.includes(q) || category.toLowerCase().includes(q)
        item.hidden = !visible
        if (visible) visibleCategories.add(category)
      })

      // Show/hide category headers
      categories.forEach(cat => {
        const category = cat.dataset.categoryName || ''
        cat.hidden = !visibleCategories.has(category)
      })

      // Update no results message
      const noResults = list.querySelector('[data-no-results]') as HTMLElement
      if (noResults) {
        noResults.hidden = getVisibleItems().length > 0
      }

      // Reset selection
      selectedIndex = 0
      updateSelected()
    }

    // Open palette
    const openPalette = () => {
      setOpen(true)
      overlay.dataset.open = 'true'
      palette.dataset.open = 'true'
      input.value = ''
      filterItems('')
      selectedIndex = 0
      updateSelected()
      setTimeout(() => input.focus(), 0)
    }

    // Close palette
    const closePalette = () => {
      setOpen(false)
      overlay.dataset.open = 'false'
      palette.dataset.open = 'false'
    }

    // Global keyboard shortcut (Cmd+K / Ctrl+K)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
    }

    // Palette keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open()) return

      const items = getVisibleItems()
      const maxIndex = items.length - 1

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closePalette()
          break
        case 'ArrowDown':
          e.preventDefault()
          selectedIndex = Math.min(selectedIndex + 1, maxIndex)
          updateSelected()
          break
        case 'ArrowUp':
          e.preventDefault()
          selectedIndex = Math.max(selectedIndex - 1, 0)
          updateSelected()
          break
        case 'Enter':
          e.preventDefault()
          const selected = items[selectedIndex]
          if (selected && selected.dataset.href) {
            window.location.href = selected.dataset.href
            closePalette()
          }
          break
      }
    }

    // Input handler
    const handleInput = () => {
      filterItems(input.value)
    }

    // Overlay click
    const handleOverlayClick = (e: Event) => {
      if (e.target === overlay) {
        closePalette()
      }
    }

    // Item click
    const handleItemClick = (e: Event) => {
      const target = e.target as HTMLElement
      const item = target.closest('[data-command-item="true"]') as HTMLElement
      if (item && item.dataset.href) {
        window.location.href = item.dataset.href
        closePalette()
      }
    }

    // Add listeners
    document.addEventListener('keydown', handleGlobalKeyDown)
    palette.addEventListener('keydown', handleKeyDown)
    input.addEventListener('input', handleInput)
    overlay.addEventListener('click', handleOverlayClick)
    list.addEventListener('click', handleItemClick)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      palette.removeEventListener('keydown', handleKeyDown)
      input.removeEventListener('input', handleInput)
      overlay.removeEventListener('click', handleOverlayClick)
      list.removeEventListener('click', handleItemClick)
    }
  })

  return (
    <>
      {/* Overlay */}
      <div
        data-command-overlay
        data-open="false"
        class="fixed inset-0 z-dialog bg-black/50 transition-opacity duration-150 data-[open=false]:opacity-0 data-[open=false]:pointer-events-none"
      />

      {/* Palette */}
      <div
        data-command-palette
        data-open="false"
        class="fixed left-1/2 top-[15%] z-dialog w-full max-w-lg -translate-x-1/2 transition-all duration-150 data-[open=false]:opacity-0 data-[open=false]:scale-95 data-[open=false]:pointer-events-none"
      >
        <div class="mx-4 sm:mx-0 overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
          {/* Search input */}
          <div class="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon />
            <input
              data-command-input
              type="text"
              placeholder="Search pages..."
              class="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autocomplete="off"
            />
            <kbd class="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <div
            data-command-list
            class="max-h-72 overflow-y-auto p-2"
          >
            {/* Get Started */}
            <div data-command-category data-category-name="Get Started" class="mb-2">
              <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Get Started
              </div>
              {getStartedItems.map(item => (
                <div
                  key={item.id}
                  data-command-item="true"
                  data-href={item.href}
                  data-title={item.title}
                  data-category={item.category}
                  data-selected="false"
                  class="hidden:hidden flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent data-[selected=true]:bg-accent"
                >
                  {item.title}
                </div>
              ))}
            </div>

            {/* Components */}
            <div data-command-category data-category-name="Components" class="mb-2">
              <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Components
              </div>
              {componentItems.map(item => (
                <div
                  key={item.id}
                  data-command-item="true"
                  data-href={item.href}
                  data-title={item.title}
                  data-category={item.category}
                  data-selected="false"
                  class="hidden:hidden flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent data-[selected=true]:bg-accent"
                >
                  {item.title}
                </div>
              ))}
            </div>

            {/* Forms */}
            <div data-command-category data-category-name="Forms" class="mb-2">
              <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Forms
              </div>
              {formItems.map(item => (
                <div
                  key={item.id}
                  data-command-item="true"
                  data-href={item.href}
                  data-title={item.title}
                  data-category={item.category}
                  data-selected="false"
                  class="hidden:hidden flex cursor-pointer items-center rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent data-[selected=true]:bg-accent"
                >
                  {item.title}
                </div>
              ))}
            </div>

            {/* No results */}
            <div data-no-results hidden class="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
