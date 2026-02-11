'use client'

/**
 * Mobile Header Component
 * Layout: [LogoIcon] --- [SearchIcon] [GitHubIcon] [ThemeSwitcher]
 */

import { createEffect } from '@barefootjs/dom'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { LogoIcon } from '@/components/logo'
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
    <header className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-4 h-14 flex items-center justify-between">
        <a
          href="https://barefootjs.dev"
          className="flex items-center text-foreground no-underline"
          aria-label="Barefoot.js Home"
        >
          <LogoIcon />
        </a>

        <div className="flex items-center gap-2">
          <button
            data-mobile-search
            type="button"
            className="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
            aria-label="Search"
          >
            <SearchIcon size="md" />
          </button>
          <a
            href="https://github.com/kfly8/barefootjs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-foreground hover:bg-accent rounded-md transition-colors"
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
