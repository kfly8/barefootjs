/**
 * Page Navigation Component
 *
 * Displays Previous/Next navigation links at the bottom of documentation pages.
 * Helps users navigate between component pages.
 */

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
    <nav class="flex items-center justify-between pt-8 mt-12 border-0 border-t border-solid border-border" aria-label="Page navigation">
      {prev ? (
        <a
          href={prev.href}
          class="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform group-hover:-translate-x-1"
          >
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <div class="flex flex-col">
            <span class="text-sm text-muted-foreground">Previous</span>
            <span class="text-xl font-medium text-foreground">{prev.title}</span>
          </div>
        </a>
      ) : (
        <div />
      )}
      {next ? (
        <a
          href={next.href}
          class="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors text-right no-underline"
        >
          <div class="flex flex-col">
            <span class="text-sm text-muted-foreground">Next</span>
            <span class="text-xl font-medium text-foreground">{next.title}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform group-hover:translate-x-1"
          >
            <path d="m9 18 6-6-6-6"/>
          </svg>
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
  { slug: 'counter', title: 'Counter' },
  { slug: 'dialog', title: 'Dialog' },
  { slug: 'dropdown', title: 'Dropdown' },
  { slug: 'input', title: 'Input' },
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
    prev: prev ? { href: `/components/${prev.slug}`, title: prev.title } : undefined,
    next: next ? { href: `/components/${next.slug}`, title: next.title } : undefined,
  }
}
