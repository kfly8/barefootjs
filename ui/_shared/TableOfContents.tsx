/**
 * Table of Contents Component
 *
 * Displays a sticky sidebar navigation for documentation pages.
 * Shows section links for easy navigation within the page.
 */

export interface TocItem {
  id: string
  title: string
  level?: number
}

export interface TableOfContentsProps {
  items: TocItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) return null

  return (
    <nav class="hidden xl:block sticky top-20 w-56 shrink-0" aria-label="Table of contents">
      <div class="space-y-2">
        <p class="text-sm font-semibold text-foreground">On This Page</p>
        <ul class="space-y-1 text-sm">
          {items.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                class={`block py-1 text-muted-foreground hover:text-foreground transition-colors ${
                  item.level === 3 ? 'pl-4' : ''
                }`}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
