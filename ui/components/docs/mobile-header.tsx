'use client'

/**
 * Mobile Header Component
 *
 * Header for mobile devices with hamburger menu.
 * Shows logo + hamburger icon that opens a slide-in menu.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { ThemeSwitcher } from './theme-switcher'

// Logo icon from images/logo.svg
function LogoIcon() {
  return (
    <svg
      class="h-6 w-6"
      viewBox="0 0 100 100"
      fill="currentColor"
    >
      <ellipse cx="18" cy="46" rx="9" ry="12" transform="rotate(-15 20 46)" />
      <ellipse cx="38" cy="44" rx="7" ry="10" transform="rotate(-8 38 44)" />
      <ellipse cx="54" cy="48" rx="6" ry="9" transform="rotate(0 54 50)" />
      <ellipse cx="68" cy="56" rx="4.5" ry="7" transform="rotate(8 68 56)" />
      <ellipse cx="80" cy="67" rx="3.5" ry="5.5" transform="rotate(15 80 60)" />
    </svg>
  )
}

// Hamburger icon
function HamburgerIcon() {
  return (
    <svg
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
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

// Search icon
function SearchIcon() {
  return (
    <svg
      class="h-5 w-5"
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

// GitHub icon
function GitHubIcon() {
  return (
    <svg
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
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

export interface MobileHeaderProps {
  currentPath?: string
}

export function MobileHeader({ currentPath = '/' }: MobileHeaderProps) {
  const [open, setOpen] = createSignal(false)

  // Handle menu interactions
  createEffect(() => {
    const toggleBtn = document.querySelector('[data-mobile-header-toggle]')
    const closeBtn = document.querySelector('[data-mobile-header-close]')
    const overlay = document.querySelector('[data-mobile-header-overlay]')
    const drawer = document.querySelector('[data-mobile-header-drawer]') as HTMLElement
    const searchBtn = document.querySelector('[data-mobile-search]')

    if (!toggleBtn || !overlay || !drawer) return

    // Highlight active menu item
    const activeClass = 'bg-accent text-foreground font-medium'
    const allLinks = drawer.querySelectorAll('nav a[href]') as NodeListOf<HTMLAnchorElement>
    allLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.className = `block py-2 px-3 text-sm rounded-md no-underline ${activeClass}`
      }
    })

    // Open appropriate category based on current path
    const categoryMap: Record<string, string> = {
      '/': 'get-started',
      '/components': 'components',
      '/forms': 'forms',
    }
    for (const [prefix, category] of Object.entries(categoryMap)) {
      if (currentPath === prefix || currentPath.startsWith(prefix + '/')) {
        const details = drawer.querySelector(`[data-category="${category}"]`) as HTMLDetailsElement
        if (details) details.open = true
      }
    }

    const openMenu = () => {
      setOpen(true)
      document.body.style.overflow = 'hidden'
    }

    const closeMenu = () => {
      setOpen(false)
      document.body.style.overflow = ''
    }

    const handleToggleClick = () => openMenu()
    const handleCloseClick = () => closeMenu()
    const handleOverlayClick = (e: Event) => {
      if (e.target === overlay) closeMenu()
    }
    const handleNavClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A') closeMenu()
    }
    const handleSearchClick = () => {
      closeMenu()
      // Dispatch Cmd+K event to open command palette
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

    toggleBtn.addEventListener('click', handleToggleClick)
    closeBtn?.addEventListener('click', handleCloseClick)
    overlay.addEventListener('click', handleOverlayClick)
    drawer.addEventListener('click', handleNavClick)
    searchBtn?.addEventListener('click', handleSearchClick)

    return () => {
      toggleBtn.removeEventListener('click', handleToggleClick)
      closeBtn?.removeEventListener('click', handleCloseClick)
      overlay.removeEventListener('click', handleOverlayClick)
      drawer.removeEventListener('click', handleNavClick)
      searchBtn?.removeEventListener('click', handleSearchClick)
    }
  })

  return (
    <>
      {/* Mobile Header Bar - visible on mobile only */}
      <header class="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div class="px-4 h-14 flex items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div class="flex items-center gap-3">
            <button
              data-mobile-header-toggle
              type="button"
              class="p-2 -ml-2 text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
            <a
              href="/"
              class="flex items-center gap-2 text-foreground no-underline"
            >
              <LogoIcon />
              <span class="font-semibold">Barefoot.js</span>
            </a>
          </div>

          {/* Right: Theme Switcher */}
          <ThemeSwitcher defaultTheme="system" />
        </div>
      </header>

      {/* Overlay */}
      <div
        data-mobile-header-overlay
        data-state={open() ? 'open' : 'closed'}
        class="sm:hidden fixed inset-0 z-[100] bg-black/50 transition-opacity duration-200 data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none"
      >
        {/* Slide-in Drawer */}
        <div
          data-mobile-header-drawer
          data-state={open() ? 'open' : 'closed'}
          class="fixed top-0 left-0 bottom-0 z-[101] w-72 bg-background shadow-lg transform transition-transform duration-300 ease-out data-[state=closed]:-translate-x-full"
        >
          {/* Drawer Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-border">
            <a href="/" class="flex items-center gap-2 text-foreground no-underline">
              <LogoIcon />
              <span class="font-semibold">Barefoot.js</span>
            </a>
            <button
              data-mobile-header-close
              type="button"
              class="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Search Button */}
          <div class="px-4 py-3 border-b border-border">
            <button
              data-mobile-search
              type="button"
              class="flex items-center gap-2 w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <SearchIcon />
              <span>Search...</span>
            </button>
          </div>

          {/* Navigation */}
          <nav class="p-4 overflow-y-auto h-[calc(100%-140px)]">
            <div class="space-y-1">
              {/* Get Started */}
              <details data-category="get-started" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>Get Started</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  <a href="/" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">
                    Introduction
                  </a>
                </div>
              </details>

              {/* Navigation Links */}
              <div class="mb-2">
                <a href="/docs/core" class="block py-2 px-3 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">
                  core
                </a>
              </div>

              {/* Components */}
              <details data-category="components" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>ui / Components</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  <a href="/components/accordion" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Accordion</a>
                  <a href="/components/badge" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Badge</a>
                  <a href="/components/button" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Button</a>
                  <a href="/components/card" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Card</a>
                  <a href="/components/checkbox" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Checkbox</a>
                  <a href="/components/counter" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Counter</a>
                  <a href="/components/dialog" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Dialog</a>
                  <a href="/components/dropdown" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Dropdown</a>
                  <a href="/components/input" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Input</a>
                  <a href="/components/select" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Select</a>
                  <a href="/components/switch" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Switch</a>
                  <a href="/components/tabs" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Tabs</a>
                  <a href="/components/toast" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Toast</a>
                  <a href="/components/tooltip" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Tooltip</a>
                </div>
              </details>

              {/* Forms */}
              <details data-category="forms" class="mb-2 group">
                <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>ui / Forms</span>
                  <ChevronIcon />
                </summary>
                <div class="pl-2 py-1 space-y-0.5">
                  <a href="/forms/controlled-input" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Controlled Input</a>
                  <a href="/forms/field-arrays" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Field Arrays</a>
                  <a href="/forms/submit" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Submit</a>
                  <a href="/forms/validation" class="block py-2 px-3 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 no-underline">Validation</a>
                </div>
              </details>
            </div>
          </nav>

          {/* Footer: GitHub Link */}
          <div class="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-border">
            <a
              href="https://github.com/kfly8/barefootjs"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
            >
              <GitHubIcon />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
