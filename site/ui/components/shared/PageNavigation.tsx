/**
 * Page Navigation — UI site data
 *
 * Component ordering and link generation for UI site page navigation.
 * The PageNavigation component itself is in site/shared/components/page-navigation.tsx.
 */

// Component order for navigation (alphabetical)
export const componentOrder = [
  { slug: 'accordion', title: 'Accordion' },
  { slug: 'alert-dialog', title: 'Alert Dialog' },
  { slug: 'badge', title: 'Badge' },
  { slug: 'breadcrumb', title: 'Breadcrumb' },
  { slug: 'button', title: 'Button' },
  { slug: 'card', title: 'Card' },
  { slug: 'checkbox', title: 'Checkbox' },
  { slug: 'collapsible', title: 'Collapsible' },
  { slug: 'dialog', title: 'Dialog' },
  { slug: 'drawer', title: 'Drawer' },
  { slug: 'dropdown-menu', title: 'Dropdown Menu' },
  { slug: 'hover-card', title: 'Hover Card' },
  { slug: 'input', title: 'Input' },
  { slug: 'label', title: 'Label' },
  { slug: 'pagination', title: 'Pagination' },
  { slug: 'popover', title: 'Popover' },
  { slug: 'portal', title: 'Portal' },
  { slug: 'radio-group', title: 'Radio Group' },
  { slug: 'resizable', title: 'Resizable' },
  { slug: 'scroll-area', title: 'Scroll Area' },
  { slug: 'select', title: 'Select' },
  { slug: 'separator', title: 'Separator' },
  { slug: 'sheet', title: 'Sheet' },
  { slug: 'slider', title: 'Slider' },
  { slug: 'switch', title: 'Switch' },
  { slug: 'tabs', title: 'Tabs' },
  { slug: 'textarea', title: 'Textarea' },
  { slug: 'toast', title: 'Toast' },
  { slug: 'toggle', title: 'Toggle' },
  { slug: 'toggle-group', title: 'Toggle Group' },
  { slug: 'tooltip', title: 'Tooltip' },
]

// Get prev/next links for a component
export function getNavLinks(currentSlug: string): {
  prev?: { href: string; title: string }
  next?: { href: string; title: string }
} {
  const currentIndex = componentOrder.findIndex(c => c.slug === currentSlug)
  if (currentIndex === -1) return {}

  const prev = currentIndex > 0 ? componentOrder[currentIndex - 1] : undefined
  const next = currentIndex < componentOrder.length - 1 ? componentOrder[currentIndex + 1] : undefined

  return {
    prev: prev ? { href: `/docs/components/${prev.slug}`, title: prev.title } : undefined,
    next: next ? { href: `/docs/components/${next.slug}`, title: next.title } : undefined,
  }
}
