/**
 * Sidebar Menu Component
 *
 * Left sidebar navigation with accordion categories.
 * Features:
 * - Accordion categories (multiple can be open simultaneously)
 * - Active item highlighting with background color + bold
 * - Auto-expand category containing the active item
 * - Fixed position at left edge
 *
 * Note: Prefix matching and session persistence require compiler support
 * for module-level helper functions. These features are documented in spec
 * but implementation is pending compiler improvements.
 */

import { ChevronRightIcon } from '@ui/components/ui/icon'

// Menu data types
interface MenuItem {
  title: string
  href: string
}

interface MenuCategory {
  title: string
  items: MenuItem[]
  defaultOpen?: boolean
}

// Map of component hrefs that have preview available
const previewHrefs = new Set(['/docs/components/button', '/docs/components/badge'])

// Menu configuration
const menuData: MenuCategory[] = [
  {
    title: 'Get Started',
    defaultOpen: true,
    items: [
      { title: 'Introduction', href: '/' },
    ],
  },
  {
    title: 'Components',
    items: [
      { title: 'Accordion', href: '/docs/components/accordion' },
      { title: 'Badge', href: '/docs/components/badge' },
      { title: 'Button', href: '/docs/components/button' },
      { title: 'Card', href: '/docs/components/card' },
      { title: 'Checkbox', href: '/docs/components/checkbox' },
      { title: 'Dialog', href: '/docs/components/dialog' },
      { title: 'Dropdown', href: '/docs/components/dropdown' },
      { title: 'Input', href: '/docs/components/input' },
      { title: 'Select', href: '/docs/components/select' },
      { title: 'Switch', href: '/docs/components/switch' },
      { title: 'Tabs', href: '/docs/components/tabs' },
      { title: 'Toast', href: '/docs/components/toast' },
      { title: 'Tooltip', href: '/docs/components/tooltip' },
    ],
  },
  {
    title: 'Forms',
    items: [
      { title: 'Controlled Input', href: '/docs/forms/controlled-input' },
      { title: 'Field Arrays', href: '/docs/forms/field-arrays' },
      { title: 'Submit', href: '/docs/forms/submit' },
      { title: 'Validation', href: '/docs/forms/validation' },
    ],
  },
  {
    title: 'Blocks',
    items: [],
  },
  {
    title: 'Charts',
    items: [],
  },
]


// Sidebar item component (server-side only)
interface SidebarItemProps {
  title: string
  href: string
  isActive?: boolean
}

export function SidebarItem({ title, href, isActive = false }: SidebarItemProps) {
  const baseClass = 'block py-1.5 px-3 text-sm rounded-md transition-colors no-underline'
  const activeClass = 'bg-accent text-foreground font-medium'
  const inactiveClass = 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
  const hasPreview = previewHrefs.has(href)

  return (
    <span
      className="block"
      data-preview-href={hasPreview ? href : undefined}
    >
      <a
        href={href}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
      >
        {title}
      </a>
    </span>
  )
}

// Sidebar category component (server-side only)
interface SidebarCategoryProps {
  title: string
  items: MenuItem[]
  defaultOpen?: boolean
  currentPath?: string
}

export function SidebarCategory({
  title,
  items,
  defaultOpen = false,
  currentPath = '',
}: SidebarCategoryProps) {
  const hasActiveItem = items.some(item => item.href === currentPath)

  return (
    <details className="mb-2 group" open={hasActiveItem || defaultOpen}>
      <summary className="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronRightIcon size="sm" className="transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="pl-2 py-1 space-y-0.5">
        {items.map(item => (
          <SidebarItem
            key={item.href}
            title={item.title}
            href={item.href}
            isActive={currentPath === item.href}
          />
        ))}
      </div>
    </details>
  )
}

// Main sidebar menu component (server-side only - no 'use client')
interface SidebarMenuProps {
  currentPath?: string
}

export function SidebarMenu({ currentPath = '' }: SidebarMenuProps) {
  const hasActiveItemAnywhere = menuData.some(category =>
    category.items.some(item => item.href === currentPath)
  )

  return (
    <nav
      className="hidden sm:block fixed top-14 left-0 w-56 h-[calc(100vh-56px)] overflow-y-auto border-r border-border bg-background p-4"
      aria-label="Main navigation"
      data-sidebar-menu
    >
      <div className="space-y-1">
        {menuData.map(category => {
          const shouldOpen = hasActiveItemAnywhere
            ? category.items.some(item => item.href === currentPath)
            : (category.defaultOpen ?? false)

          return (
            <SidebarCategory
              key={category.title}
              title={category.title}
              items={category.items}
              defaultOpen={shouldOpen}
              currentPath={currentPath}
            />
          )
        })}
      </div>
    </nav>
  )
}
