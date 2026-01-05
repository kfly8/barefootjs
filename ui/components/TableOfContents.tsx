/**
 * Table of Contents Component
 *
 * Displays a sticky sidebar navigation for documentation pages.
 * Shows section links for easy navigation within the page.
 * Highlights the currently visible section using IntersectionObserver.
 */

'use client'

import { createSignal, createEffect } from '@barefootjs/dom'

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

  const [activeId, setActiveId] = createSignal<string>(items[0]?.id || '')

  // Track visible sections using IntersectionObserver
  createEffect(() => {
    const sectionIds = items.map(item => item.id)
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          // Sort by top position and take the first one
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px', // Account for header and prefer top sections
        threshold: 0,
      }
    )

    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  })

  // Show on xl screens (1280px+) - positioned relative to centered main content
  return (
    <nav class="hidden xl:block fixed top-20 w-56 max-h-[calc(100vh-6rem)] overflow-y-auto" style="left: calc(50% + 416px);" aria-label="Table of contents">
      <div class="space-y-2">
        <p class="text-sm font-semibold text-foreground">On This Page</p>
        <ul class="space-y-1 text-sm">
          {items.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                class={`block py-1 transition-colors ${
                  item.level === 3 ? 'pl-4' : ''
                } ${
                  activeId() === item.id
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
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
