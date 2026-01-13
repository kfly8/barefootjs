/**
 * Site Header Component
 *
 * Main header with logo, navigation, search, GitHub stars, and theme switcher.
 * Layout: [Logo | core | ui] --- [Search] [GitHub] [Theme]
 */

import { Suspense } from 'hono/jsx'
import { SearchButton } from './search-button'
import { AsyncGitHubStars } from './github-stars-async'
import { ThemeSwitcher } from './theme-switcher'
import { Logo } from './logo'
import { GitHubIcon } from '../ui/icon'

// Loading placeholder for GitHub stars (matches GitHubStars layout)
function GitHubStarsPlaceholder() {
  return (
    <span class="flex items-center gap-1.5 text-muted-foreground">
      <GitHubIcon size="md" class="text-foreground" />
      <span class="text-sm font-medium min-w-[1.25rem] text-right">
        <span class="inline-block w-5 h-4 bg-muted rounded animate-pulse" />
      </span>
    </span>
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
            class="text-foreground transition-colors no-underline"
          >
            <Logo />
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
          <Suspense fallback={<GitHubStarsPlaceholder />}>
            <AsyncGitHubStars repo="kfly8/barefootjs" />
          </Suspense>
          <ThemeSwitcher defaultTheme="system" />
        </div>
      </div>
    </header>
  )
}
