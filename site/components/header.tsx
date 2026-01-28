/**
 * Site Header Component (same as docs/ui)
 *
 * Header with logo, navigation, GitHub link, and theme switcher.
 */

import { Logo } from './ui/logo'
import { GitHubIcon } from './ui/icons'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="px-6 h-14 flex items-center justify-between gap-4">
        {/* Left section: Logo + Navigation */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <a
            href="/"
            className="text-foreground transition-colors no-underline"
          >
            <Logo />
          </a>

          {/* Navigation separator */}
          <div className="hidden sm:block h-5 w-px bg-border" />

          {/* Navigation links */}
          <nav className="hidden sm:flex items-center gap-1">
            <a
              href="/docs/core"
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors no-underline text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              core
            </a>
            <a
              href="/components"
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors no-underline text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              ui
            </a>
          </nav>
        </div>

        {/* Right section: GitHub + Theme */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/kfly8/barefootjs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-background text-foreground hover:bg-accent transition-colors"
            aria-label="View on GitHub"
          >
            <GitHubIcon />
          </a>
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
