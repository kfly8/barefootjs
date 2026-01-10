'use client'

/**
 * Mobile Menu Component
 *
 * Hamburger menu for mobile devices.
 * Features:
 * - Hamburger button visible on mobile (hidden on xl:)
 * - Slide-in drawer with menu items
 * - Close on overlay click or close button
 * - Close on navigation
 */

import { createSignal, createEffect } from '@barefootjs/dom'

// Three vertical dots icon
function DotsVerticalIcon() {
  return (
    <svg
      class="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  )
}

// Close icon
function CloseIcon() {
  return (
    <svg
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// Chevron icon for accordion
function ChevronIcon() {
  return (
    <svg
      class="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function MobileMenu() {
  const [open, setOpen] = createSignal(false)
  const [expanded, setExpanded] = createSignal(false) // false = 50%, true = 85%

  // Event delegation for menu interactions and drag handling
  createEffect(() => {
    const toggleBtn = document.querySelector('[data-mobile-menu-toggle]')
    const closeBtn = document.querySelector('[data-mobile-menu-close]')
    const overlay = document.querySelector('[data-mobile-menu-overlay]')
    const drawer = document.querySelector('[data-mobile-menu-drawer]') as HTMLElement
    const dragHandle = document.querySelector('[data-drag-handle]') as HTMLElement

    if (!toggleBtn || !overlay || !drawer) return

    // Open current category based on URL and highlight active item
    const currentPath = window.location.pathname
    const activeClass = 'bg-accent text-foreground font-medium'

    // Find and highlight active menu item
    const allLinks = drawer.querySelectorAll('nav a[href]') as NodeListOf<HTMLAnchorElement>
    allLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.className = `block py-1.5 px-3 text-sm rounded-md no-underline ${activeClass}`
      }
    })

    // Open the category containing the current page
    if (currentPath === '/') {
      const details = drawer.querySelector('[data-category="get-started"]') as HTMLDetailsElement
      if (details) details.open = true
    } else {
      const categoryMap: Record<string, string> = {
        '/components': 'components',
        '/forms': 'forms',
        '/blocks': 'blocks',
        '/charts': 'charts',
      }
      for (const [prefix, category] of Object.entries(categoryMap)) {
        if (currentPath.startsWith(prefix)) {
          const details = drawer.querySelector(`[data-category="${category}"]`) as HTMLDetailsElement
          if (details) details.open = true
        }
      }
    }

    const openMenu = () => {
      setOpen(true)
      setExpanded(false) // Start at 50%
      document.body.style.overflow = 'hidden'
    }

    const closeMenu = () => {
      setOpen(false)
      setExpanded(false)
      document.body.style.overflow = ''
    }

    // Drag handling (supports both touch and mouse events)
    let startY = 0
    let startHeight = 0
    let isDragging = false

    const handleDragStart = (clientY: number) => {
      isDragging = true
      startY = clientY
      startHeight = drawer.offsetHeight
      drawer.style.transition = 'none'
    }

    const handleDragMove = (clientY: number) => {
      if (!isDragging) return
      const deltaY = startY - clientY
      const newHeight = Math.min(Math.max(startHeight + deltaY, window.innerHeight * 0.3), window.innerHeight * 0.85)
      drawer.style.height = `${newHeight}px`
    }

    const handleDragEnd = () => {
      if (!isDragging) return
      isDragging = false
      drawer.style.transition = ''
      const currentHeight = drawer.offsetHeight
      const threshold = window.innerHeight * 0.65

      if (currentHeight > threshold) {
        setExpanded(true)
        drawer.style.height = ''
      } else if (currentHeight < window.innerHeight * 0.35) {
        closeMenu()
        drawer.style.height = ''
      } else {
        setExpanded(false)
        drawer.style.height = ''
      }
    }

    // Touch events
    const handleTouchStart = (e: TouchEvent) => handleDragStart(e.touches[0].clientY)
    const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientY)
    const handleTouchEnd = () => handleDragEnd()

    // Mouse events (for PC)
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      handleDragStart(e.clientY)
    }
    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const handleMouseUp = () => handleDragEnd()

    const handleToggleClick = () => openMenu()
    const handleCloseClick = () => closeMenu()
    const handleOverlayClick = (e: Event) => {
      if (e.target === overlay) closeMenu()
    }
    const handleNavClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') closeMenu()
    }

    toggleBtn.addEventListener('click', handleToggleClick)
    closeBtn?.addEventListener('click', handleCloseClick)
    overlay.addEventListener('click', handleOverlayClick)
    drawer.addEventListener('click', handleNavClick)
    // Touch events
    dragHandle?.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
    // Mouse events (for PC)
    dragHandle?.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      toggleBtn.removeEventListener('click', handleToggleClick)
      closeBtn?.removeEventListener('click', handleCloseClick)
      overlay.removeEventListener('click', handleOverlayClick)
      drawer.removeEventListener('click', handleNavClick)
      // Touch events
      dragHandle?.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      // Mouse events
      dragHandle?.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  })

  return (
    <>
      {/* Menu button - fixed at bottom right, visible on mobile only */}
      <button
        data-mobile-menu-toggle
        class="sm:hidden fixed bottom-6 right-6 z-[10000] w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open menu"
      >
        <DotsVerticalIcon />
      </button>

      {/* Overlay */}
      <div
        data-mobile-menu-overlay
        data-state={open() ? 'open' : 'closed'}
        class="fixed inset-0 z-[10001] bg-black/50 sm:hidden transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none"
      >
        {/* Bottom Sheet */}
        <div
          data-mobile-menu-drawer
          class="fixed bottom-0 left-0 right-0 z-[10002] bg-background rounded-t-2xl shadow-lg transform transition-all duration-300 ease-out data-[state=closed]:translate-y-full data-[expanded=false]:h-[50vh] data-[expanded=true]:h-[85vh]"
          data-state={open() ? 'open' : 'closed'}
          data-expanded={expanded() ? 'true' : 'false'}
        >
          {/* Drag Handle */}
          <div data-drag-handle class="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none">
            <div class="w-12 h-1.5 bg-muted-foreground/30 rounded-full"></div>
          </div>

          {/* Header */}
          <div class="flex items-center justify-between px-4 pb-3 border-b border-border">
            <a href="/" class="text-lg font-semibold text-foreground">
              BarefootJS
            </a>
            <button
              data-mobile-menu-close
              class="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Navigation */}
          <nav class="p-4 overflow-y-auto h-[calc(100%-80px)]">
            <div class="space-y-1">
              {/* Get Started */}
              <details data-category="get-started" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>Get Started</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  <a href="/" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">
                    Introduction
                  </a>
                </div>
              </details>

              {/* Components */}
              <details data-category="components" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>Components</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  <a href="/components/accordion" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Accordion</a>
                  <a href="/components/badge" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Badge</a>
                  <a href="/components/button" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Button</a>
                  <a href="/components/card" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Card</a>
                  <a href="/components/checkbox" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Checkbox</a>
                  <a href="/components/counter" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Counter</a>
                  <a href="/components/dialog" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Dialog</a>
                  <a href="/components/dropdown" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Dropdown</a>
                  <a href="/components/input" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Input</a>
                  <a href="/components/select" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Select</a>
                  <a href="/components/switch" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Switch</a>
                  <a href="/components/tabs" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Tabs</a>
                  <a href="/components/toast" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Toast</a>
                  <a href="/components/tooltip" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Tooltip</a>
                </div>
              </details>

              {/* Forms */}
              <details data-category="forms" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>Forms</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  <a href="/forms/controlled-input" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Controlled Input</a>
                  <a href="/forms/field-arrays" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Field Arrays</a>
                  <a href="/forms/submit" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Submit</a>
                  <a href="/forms/validation" class="block py-1.5 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Validation</a>
                </div>
              </details>

              {/* Blocks */}
              <details data-category="blocks" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>Blocks</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  {/* Empty for now */}
                </div>
              </details>

              {/* Charts */}
              <details data-category="charts" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>Charts</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  {/* Empty for now */}
                </div>
              </details>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
