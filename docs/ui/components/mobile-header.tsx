'use client'

/**
 * Mobile Header Component
 * Layout: [LogoIcon] --- [SearchIcon] [GitHubIcon] [ThemeSwitcher]
 */

import { createEffect } from '@barefootjs/dom'
import { ThemeSwitcher } from './theme-switcher'
import { LogoIcon } from './logo'
import { GitHubIcon, SearchIcon } from '@ui/components/ui/icon'

export function MobileHeader() {
  createEffect(() => {
    const searchBtn = document.querySelector('[data-mobile-search]')
    if (!searchBtn) return

    const handleSearchClick = () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(event)
    }

    searchBtn.addEventListener('click', handleSearchClick)
    return () => searchBtn.removeEventListener('click', handleSearchClick)
  })

  return (
    <header class="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div class="px-4 h-14 flex items-center justify-between">
        <a
          href="/"
          class="flex items-center text-foreground no-underline"
          aria-label="Barefoot.js Home"
        >
          <LogoIcon />
        </a>

        <div class="flex items-center gap-2">
          <button
            data-mobile-search
            type="button"
            class="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Search"
          >
            <SearchIcon size="md" />
          </button>
          <a
            href="https://github.com/kfly8/barefootjs"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="View on GitHub"
          >
            <GitHubIcon size="md" />
          </a>
          <ThemeSwitcher defaultTheme="system" />
        </div>
      </div>
    </header>
  )
}
