'use client'

/**
 * Mobile Header Component
 *
 * Header for mobile devices with hamburger menu.
 * Shows logo + hamburger icon that opens a slide-in menu.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { ThemeSwitcher } from './theme-switcher'
import { MenuIcon, XIcon, SearchIcon, GitHubIcon, ChevronRightIcon } from '../ui/icon'

// Logo icon from images/logo.svg (custom, not in Icon component)
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
              <MenuIcon size="lg" />
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
              <XIcon size="lg" />
            </button>
          </div>

          {/* Search Button */}
          <div class="px-4 py-3 border-b border-border">
            <button
              data-mobile-search
              type="button"
              class="flex items-center gap-2 w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <SearchIcon size="md" />
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
                  <ChevronRightIcon size="sm" class="transition-transform duration-200 group-open:rotate-90" />
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
                  <ChevronRightIcon size="sm" class="transition-transform duration-200 group-open:rotate-90" />
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
                  <ChevronRightIcon size="sm" class="transition-transform duration-200 group-open:rotate-90" />
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
              <GitHubIcon size="md" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
