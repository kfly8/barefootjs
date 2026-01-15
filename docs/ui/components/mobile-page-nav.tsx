/**
 * Mobile Page Navigation Component
 *
 * Fixed bottom-right navigation for mobile devices.
 * Shows prev/next page links like: < Badge | Card >
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
    <div class="fixed bottom-6 right-6 z-[10000] sm:hidden flex items-center gap-1 bg-background/95 backdrop-blur rounded-full shadow-lg border border-border px-2 py-1.5">
      {prev ? (
        <a
          href={prev.href}
          class="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
          aria-label={`Previous: ${prev.title}`}
        >
          <ChevronLeftIcon size="sm" />
          <span class="text-sm max-w-16 truncate">{prev.title}</span>
        </a>
      ) : (
        <div class="w-16" />
      )}
      <span class="text-muted-foreground/50">|</span>
      {next ? (
        <a
          href={next.href}
          class="flex items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors no-underline"
          aria-label={`Next: ${next.title}`}
        >
          <span class="text-sm max-w-16 truncate">{next.title}</span>
          <ChevronRightIcon size="sm" />
        </a>
      ) : (
        <div class="w-16" />
      )}
    </div>
  )
}
