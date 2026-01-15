/**
 * Mobile Page Navigation Component
 *
 * Fixed bottom navigation for mobile devices.
 * Shows prev/next as separate buttons.
 */

import { ChevronLeftIcon, ChevronRightIcon } from '@ui/components/ui/icon'
import { getNavLinks } from './shared/PageNavigation'

interface MobilePageNavProps {
  currentPath: string
}

export function MobilePageNav({ currentPath }: MobilePageNavProps) {
  // Extract slug from path like /docs/components/button -> button
  const match = currentPath.match(/\/docs\/components\/([^/]+)/)
  if (!match) return null

  const slug = match[1]
  const { prev, next } = getNavLinks(slug)

  // Don't render if no prev and no next
  if (!prev && !next) return null

  return (
    <div class="fixed bottom-6 left-18 right-4 z-[10000] sm:hidden flex items-center justify-end gap-2">
      {prev && (
        <a
          href={prev.href}
          class="flex items-center gap-1 px-3 py-2 bg-background/95 backdrop-blur rounded-full shadow-lg border border-border text-muted-foreground hover:text-foreground transition-colors no-underline"
          aria-label={`Previous: ${prev.title}`}
        >
          <ChevronLeftIcon size="sm" />
          <span class="text-sm truncate">{prev.title}</span>
        </a>
      )}
      {next && (
        <a
          href={next.href}
          class="flex items-center gap-1 px-3 py-2 bg-background/95 backdrop-blur rounded-full shadow-lg border border-border text-muted-foreground hover:text-foreground transition-colors no-underline"
          aria-label={`Next: ${next.title}`}
        >
          <span class="text-sm truncate">{next.title}</span>
          <ChevronRightIcon size="sm" />
        </a>
      )}
    </div>
  )
}
