/**
 * Page Navigation Component
 *
 * Displays Previous/Next navigation links at the bottom of documentation pages.
 * Helps users navigate between component pages.
 */

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icon'

export interface NavLink {
  href: string
  title: string
}

export interface PageNavigationProps {
  prev?: NavLink
  next?: NavLink
}

export function PageNavigation({ prev, next }: PageNavigationProps) {
  if (!prev && !next) return null

  return (
    <nav className="hidden sm:flex items-center justify-between pt-8 mt-12 border-0 border-t border-solid border-border" aria-label="Page navigation">
      {prev ? (
        <a
          href={prev.href}
          className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <ChevronLeftIcon size="lg" className="transition-transform group-hover:-translate-x-1" />
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Previous</span>
            <span className="text-xl font-medium text-foreground">{prev.title}</span>
          </div>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a
          href={next.href}
          className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-right no-underline"
        >
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Next</span>
            <span className="text-xl font-medium text-foreground">{next.title}</span>
          </div>
          <ChevronRightIcon size="lg" className="transition-transform group-hover:translate-x-1" />
        </a>
      ) : (
        <div />
      )}
    </nav>
  )
}

// Component order for navigation (alphabetical)
export const componentOrder = [
  { slug: 'accordion', title: 'Accordion' },
  { slug: 'badge', title: 'Badge' },
  { slug: 'button', title: 'Button' },
  { slug: 'card', title: 'Card' },
  { slug: 'checkbox', title: 'Checkbox' },
  { slug: 'dialog', title: 'Dialog' },
  { slug: 'dropdown', title: 'Dropdown' },
  { slug: 'input', title: 'Input' },
  { slug: 'portal', title: 'Portal' },
  { slug: 'select', title: 'Select' },
  { slug: 'switch', title: 'Switch' },
  { slug: 'tabs', title: 'Tabs' },
  { slug: 'toast', title: 'Toast' },
  { slug: 'tooltip', title: 'Tooltip' },
]

// Get prev/next links for a component
export function getNavLinks(currentSlug: string): PageNavigationProps {
  const currentIndex = componentOrder.findIndex(c => c.slug === currentSlug)
  if (currentIndex === -1) return {}

  const prev = currentIndex > 0 ? componentOrder[currentIndex - 1] : undefined
  const next = currentIndex < componentOrder.length - 1 ? componentOrder[currentIndex + 1] : undefined

  return {
    prev: prev ? { href: `/docs/components/${prev.slug}`, title: prev.title } : undefined,
    next: next ? { href: `/docs/components/${next.slug}`, title: next.title } : undefined,
  }
}
