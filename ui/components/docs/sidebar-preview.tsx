'use client'

/**
 * Sidebar Preview Component
 *
 * Shows a preview panel when hovering over menu items with data-preview-href.
 * Uses event delegation to detect hover without passing callbacks as props.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

// Preview content for Button component
function ButtonPreview() {
  return (
    <div class="space-y-3">
      <div>
        <h4 class="font-medium text-foreground text-sm">Button</h4>
        <p class="text-xs text-muted-foreground">Displays a button or a component that looks like a button.</p>
      </div>
      <div class="flex items-center justify-center p-4 border border-border rounded-md">
        <Button>Button</Button>
      </div>
    </div>
  )
}

// Preview content for Badge component
function BadgePreview() {
  return (
    <div class="space-y-3">
      <div>
        <h4 class="font-medium text-foreground text-sm">Badge</h4>
        <p class="text-xs text-muted-foreground">Displays a badge or a component that looks like a badge.</p>
      </div>
      <div class="flex items-center justify-center p-4 border border-border rounded-md">
        <Badge>Badge</Badge>
      </div>
    </div>
  )
}

export function SidebarPreview() {
  const [visible, setVisible] = createSignal(false)

  // Set up event delegation for hover detection and positioning
  createEffect(() => {
    const nav = document.querySelector('[data-sidebar-menu]')
    const preview = document.querySelector('[data-sidebar-preview]') as HTMLElement
    if (!nav || !preview) return

    const showPreview = (href: string) => {
      // Hide all previews
      preview.querySelectorAll('[data-preview-for]').forEach(el => {
        (el as HTMLElement).style.display = 'none'
      })
      // Show matching preview
      const target = preview.querySelector(`[data-preview-for="${href}"]`) as HTMLElement
      if (target) {
        target.style.display = 'block'
      }
    }

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement
      const previewEl = target.closest('[data-preview-href]') as HTMLElement
      if (previewEl) {
        const href = previewEl.getAttribute('data-preview-href') || ''
        const rect = previewEl.getBoundingClientRect()
        // Align preview title with menu item text (account for padding p-4 = 16px)
        preview.style.top = `${rect.top - 28}px`
        showPreview(href)
        setVisible(true)
      }
    }

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement
      const previewEl = target.closest('[data-preview-href]')
      if (previewEl) {
        setVisible(false)
      }
    }

    nav.addEventListener('mouseover', handleMouseOver)
    nav.addEventListener('mouseout', handleMouseOut)

    return () => {
      nav.removeEventListener('mouseover', handleMouseOver)
      nav.removeEventListener('mouseout', handleMouseOut)
    }
  })

  return (
    <div
      data-sidebar-preview
      data-state={visible() ? 'visible' : 'hidden'}
      class="hidden sm:block fixed left-56 w-64 p-4 bg-background border border-border rounded-lg shadow-lg z-[9999] transition-opacity duration-150 data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none data-[state=visible]:opacity-100"
    >
      <div data-preview-for="/components/button">
        <ButtonPreview />
      </div>
      <div data-preview-for="/components/badge" style="display: none">
        <BadgePreview />
      </div>
    </div>
  )
}
