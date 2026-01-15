/**
 * Mobile Page Navigation Component
 *
 * Fixed bottom navigation for mobile devices with prev/next buttons.
 */

import { ChevronLeftIcon, ChevronRightIcon } from '@ui/components/ui/icon'
import { getNavLinks } from './shared/PageNavigation'

interface MobilePageNavProps {
  currentPath: string
}

const navLinkClass = 'flex items-center px-2 py-1.5 w-28 bg-background/95 backdrop-blur rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors no-underline'

export function MobilePageNav({ currentPath }: MobilePageNavProps) {
  const match = currentPath.match(/\/docs\/components\/([^/]+)/)
  if (!match) return null

  const slug = match[1]
  const { prev, next } = getNavLinks(slug)

  if (!prev && !next) return null

  return (
    <div class="fixed bottom-6 left-18 right-4 z-[10000] sm:hidden flex items-center justify-end gap-2">
      {prev && (
        <a href={prev.href} class={navLinkClass} aria-label={`Previous: ${prev.title}`}>
          <ChevronLeftIcon size="sm" class="shrink-0" />
          <span class="flex-1 text-center text-xs truncate">{prev.title}</span>
        </a>
      )}
      {next && (
        <a href={next.href} class={navLinkClass} aria-label={`Next: ${next.title}`}>
          <span class="flex-1 text-center text-xs truncate">{next.title}</span>
          <ChevronRightIcon size="sm" class="shrink-0" />
        </a>
      )}
    </div>
  )
}
