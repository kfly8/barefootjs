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
import { GitHubIcon } from '@ui/components/ui/icon'

// Loading placeholder for GitHub stars (matches GitHubStars layout)
function GitHubStarsPlaceholder() {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <GitHubIcon size="md" className="text-foreground" />
      <span className="text-sm font-medium min-w-[1.25rem] text-right">
        <span className="inline-block w-5 h-4 bg-muted rounded animate-pulse" />
      </span>
    </span>
  )
}

export function Header() {
  return (
    <header className="hidden sm:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-6 h-14 flex items-center justify-between gap-4">
        {/* Left section: Logo + Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <a
            href="https://barefootjs.dev"
            className="text-foreground transition-colors no-underline"
          >
            <Logo />
          </a>

          {/* Navigation separator */}
          <div className="hidden sm:block h-5 w-px bg-border" />

          {/* Navigation links */}
          <nav className="hidden sm:flex items-center gap-1">
            <a
              href="https://docs.barefootjs.dev"
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors no-underline text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              docs
            </a>
            <a
              href="/"
              className="relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors no-underline text-foreground"
            >
              UI
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
            </a>
          </nav>
        </div>

        {/* Right section: Search + GitHub + Theme */}
        <div className="flex items-center gap-4">
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
