/**
 * Mobile Header Component
 *
 * Simple header bar for mobile devices.
 * Layout: [LogoIcon] --- [GitHubIcon] [ThemeSwitcher]
 */

import { ThemeSwitcher } from './theme-switcher'
import { LogoIcon } from './logo'
import { GitHubIcon } from '@ui/components/ui/icon'

export interface MobileHeaderProps {
  currentPath?: string
}

export function MobileHeader({ currentPath = '/' }: MobileHeaderProps) {
  return (
    <header class="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div class="px-4 h-14 flex items-center justify-between">
        {/* Left: Logo Icon */}
        <a
          href="/"
          class="flex items-center text-foreground no-underline"
          aria-label="Barefoot.js Home"
        >
          <LogoIcon />
        </a>

        {/* Right: GitHub + Theme Switcher */}
        <div class="flex items-center gap-2">
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
