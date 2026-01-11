/**
 * Site Header Component
 *
 * Main header with logo, navigation, search, GitHub stars, and theme switcher.
 * Layout: [Logo | core | ui] --- [Search] [GitHub] [Theme]
 */

import { SearchButton } from './search-button'
import { GitHubStars } from './github-stars'
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

export interface HeaderProps {
  currentPath?: string
}

export function Header({ currentPath = '/' }: HeaderProps) {
  // Check if a nav item is active
  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  return (
    <header class="hidden sm:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div class="px-6 h-14 flex items-center justify-between gap-4">
        {/* Left section: Logo + Navigation */}
        <div class="flex items-center gap-6">
          {/* Logo */}
          <a
            href="/"
            class="flex items-center gap-2 text-foreground hover:text-primary transition-colors no-underline"
          >
            <LogoIcon />
            <span class="font-semibold text-lg hidden sm:inline">Barefoot.js</span>
          </a>

          {/* Navigation separator */}
          <div class="hidden sm:block h-5 w-px bg-border" />

          {/* Navigation links */}
          <nav class="hidden sm:flex items-center gap-1">
            <a
              href="/docs/core"
              class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors no-underline ${
                isActive('/docs/core')
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              core
            </a>
            <a
              href="/components"
              class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors no-underline ${
                isActive('/components') || isActive('/forms')
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              ui
            </a>
          </nav>
        </div>

        {/* Right section: Search + GitHub + Theme */}
        <div class="flex items-center gap-4">
          <SearchButton />
          <GitHubStars repo="kfly8/barefootjs" />
          <ThemeSwitcher defaultTheme="system" />
        </div>
      </div>
    </header>
  )
}
