'use client'

/**
 * Mobile Menu Component
 * Hamburger menu with slide-in drawer for mobile devices.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { XIcon, ChevronRightIcon, SearchIcon } from '@ui/components/ui/icon'

const MENU_ITEMS = [
  {
    category: 'get-started',
    label: 'Get Started',
    items: [{ href: '/', label: 'Introduction' }],
  },
  {
    category: 'components',
    label: 'Components',
    items: [
      { href: '/docs/components/accordion', label: 'Accordion' },
      { href: '/docs/components/badge', label: 'Badge' },
      { href: '/docs/components/button', label: 'Button' },
      { href: '/docs/components/card', label: 'Card' },
      { href: '/docs/components/checkbox', label: 'Checkbox' },
      { href: '/docs/components/counter', label: 'Counter' },
      { href: '/docs/components/dialog', label: 'Dialog' },
      { href: '/docs/components/dropdown', label: 'Dropdown' },
      { href: '/docs/components/input', label: 'Input' },
      { href: '/docs/components/select', label: 'Select' },
      { href: '/docs/components/switch', label: 'Switch' },
      { href: '/docs/components/tabs', label: 'Tabs' },
      { href: '/docs/components/toast', label: 'Toast' },
      { href: '/docs/components/tooltip', label: 'Tooltip' },
    ],
  },
  {
    category: 'forms',
    label: 'Forms',
    items: [
      { href: '/docs/forms/controlled-input', label: 'Controlled Input' },
      { href: '/docs/forms/field-arrays', label: 'Field Arrays' },
      { href: '/docs/forms/submit', label: 'Submit' },
      { href: '/docs/forms/validation', label: 'Validation' },
    ],
  },
  {
    category: 'blocks',
    label: 'Blocks',
    items: [],
  },
  {
    category: 'charts',
    label: 'Charts',
    items: [],
  },
] as const

const LINK_CLASS = 'block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline'
const ACTIVE_LINK_CLASS = 'block py-1.5 px-3 text-sm rounded-md bg-accent text-foreground font-medium no-underline'
const SUMMARY_CLASS = 'flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden'

function DotsVerticalIcon() {
  return (
    <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function getCategoryForPath(path: string): string | null {
  if (path === '/') return 'get-started'
  if (path.startsWith('/docs/components')) return 'components'
  if (path.startsWith('/docs/forms')) return 'forms'
  if (path.startsWith('/blocks')) return 'blocks'
  if (path.startsWith('/charts')) return 'charts'
  return null
}

export function MobileMenu() {
  const [open, setOpen] = createSignal(false)
  const [expanded, setExpanded] = createSignal(false)

  createEffect(() => {
    const toggleBtn = document.querySelector('[data-mobile-menu-toggle]')
    const closeBtn = document.querySelector('[data-mobile-menu-close]')
    const overlay = document.querySelector('[data-mobile-menu-overlay]')
    const drawer = document.querySelector('[data-mobile-menu-drawer]') as HTMLElement | null
    const dragHandle = document.querySelector('[data-drag-handle]') as HTMLElement | null
    const searchBtn = document.querySelector('[data-mobile-menu-search]')

    if (!toggleBtn || !overlay || !drawer) return

    const currentPath = window.location.pathname

    // Highlight active menu item
    const allLinks = drawer.querySelectorAll('nav a[href]') as NodeListOf<HTMLAnchorElement>
    for (const link of allLinks) {
      if (link.getAttribute('href') === currentPath) {
        link.className = ACTIVE_LINK_CLASS
      }
    }

    // Open the category containing the current page
    const activeCategory = getCategoryForPath(currentPath)
    if (activeCategory) {
      const details = drawer.querySelector(`[data-category="${activeCategory}"]`) as HTMLDetailsElement | null
      if (details) details.open = true
    }

    function openMenu(): void {
      setOpen(true)
      setExpanded(false)
      document.body.style.overflow = 'hidden'
    }

    function closeMenu(): void {
      setOpen(false)
      setExpanded(false)
      document.body.style.overflow = ''
    }

    // Drag handling
    let startY = 0
    let startHeight = 0
    let isDragging = false

    function handleDragStart(clientY: number): void {
      isDragging = true
      startY = clientY
      startHeight = drawer!.offsetHeight
      drawer!.style.transition = 'none'
    }

    function handleDragMove(clientY: number): void {
      if (!isDragging) return
      const deltaY = startY - clientY
      const minHeight = window.innerHeight * 0.3
      const maxHeight = window.innerHeight * 0.85
      const newHeight = Math.min(Math.max(startHeight + deltaY, minHeight), maxHeight)
      drawer!.style.height = `${newHeight}px`
    }

    function handleDragEnd(): void {
      if (!isDragging) return
      isDragging = false
      drawer!.style.transition = ''

      const currentHeight = drawer!.offsetHeight
      const expandThreshold = window.innerHeight * 0.65
      const closeThreshold = window.innerHeight * 0.35

      drawer!.style.height = ''

      if (currentHeight > expandThreshold) {
        setExpanded(true)
      } else if (currentHeight < closeThreshold) {
        closeMenu()
      } else {
        setExpanded(false)
      }
    }

    // Event handlers
    function handleTouchStart(e: TouchEvent): void {
      handleDragStart(e.touches[0].clientY)
    }
    function handleTouchMove(e: TouchEvent): void {
      handleDragMove(e.touches[0].clientY)
    }
    function handleMouseDown(e: MouseEvent): void {
      e.preventDefault()
      handleDragStart(e.clientY)
    }
    function handleMouseMove(e: MouseEvent): void {
      handleDragMove(e.clientY)
    }

    function handleOverlayClick(e: Event): void {
      if (e.target === overlay) closeMenu()
    }

    function handleNavClick(e: Event): void {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') closeMenu()
    }

    function handleSearchClick(): void {
      closeMenu()
      setTimeout(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          metaKey: true,
          ctrlKey: true,
          bubbles: true,
        })
        document.dispatchEvent(event)
      }, 100)
    }

    toggleBtn.addEventListener('click', openMenu)
    closeBtn?.addEventListener('click', closeMenu)
    overlay.addEventListener('click', handleOverlayClick)
    drawer.addEventListener('click', handleNavClick)
    searchBtn?.addEventListener('click', handleSearchClick)
    dragHandle?.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleDragEnd)
    dragHandle?.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleDragEnd)

    return () => {
      toggleBtn.removeEventListener('click', openMenu)
      closeBtn?.removeEventListener('click', closeMenu)
      overlay.removeEventListener('click', handleOverlayClick)
      drawer.removeEventListener('click', handleNavClick)
      searchBtn?.removeEventListener('click', handleSearchClick)
      dragHandle?.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleDragEnd)
      dragHandle?.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  })

  return (
    <>
      <button
        data-mobile-menu-toggle
        class="sm:hidden fixed bottom-6 right-6 z-[10000] w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open menu"
      >
        <DotsVerticalIcon />
      </button>

      <div
        data-mobile-menu-overlay
        data-state={open() ? 'open' : 'closed'}
        class="fixed inset-0 z-[10001] bg-black/50 sm:hidden transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none"
      >
        <div
          data-mobile-menu-drawer
          class="fixed bottom-0 left-0 right-0 z-[10002] bg-background rounded-t-2xl shadow-lg transform transition-all duration-300 ease-out data-[state=closed]:translate-y-full data-[expanded=false]:h-[50vh] data-[expanded=true]:h-[85vh]"
          data-state={open() ? 'open' : 'closed'}
          data-expanded={expanded() ? 'true' : 'false'}
        >
          <div data-drag-handle class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none">
            <div class="w-12 h-1.5 bg-muted-foreground/30 rounded-full"></div>
          </div>

          <div class="flex items-center justify-between px-4 pb-3 border-b border-border">
            <a href="/" class="text-lg font-semibold text-foreground no-underline">
              BarefootJS
            </a>
            <button
              data-mobile-menu-close
              class="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Close menu"
            >
              <XIcon size="lg" />
            </button>
          </div>

          <div class="px-4 py-3 border-b border-border">
            <button
              data-mobile-menu-search
              type="button"
              class="flex items-center gap-2 w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <SearchIcon size="md" />
              <span>Search...</span>
            </button>
          </div>

          <nav class="p-4 overflow-y-auto h-[calc(100%-140px)]">
            <div class="space-y-1">
              {MENU_ITEMS.map(({ category, label, items }) => (
                <details data-category={category} class="mb-2 group">
                  <summary class={SUMMARY_CLASS}>
                    <span>{label}</span>
                    <ChevronRightIcon size="sm" class="transition-transform duration-200 group-open:rotate-90" />
                  </summary>
                  <div class="pl-2 py-1 space-y-0.5">
                    {items.map((item) => (
                      <a href={item.href} class={LINK_CLASS}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
