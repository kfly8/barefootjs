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
const previewHrefs = new Set(['/components/button', '/components/badge'])

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
      { title: 'Accordion', href: '/components/accordion' },
      { title: 'Badge', href: '/components/badge' },
      { title: 'Button', href: '/components/button' },
      { title: 'Card', href: '/components/card' },
      { title: 'Checkbox', href: '/components/checkbox' },
      { title: 'Counter', href: '/components/counter' },
      { title: 'Dialog', href: '/components/dialog' },
      { title: 'Dropdown', href: '/components/dropdown' },
      { title: 'Input', href: '/components/input' },
      { title: 'Select', href: '/components/select' },
      { title: 'Switch', href: '/components/switch' },
      { title: 'Tabs', href: '/components/tabs' },
      { title: 'Toast', href: '/components/toast' },
      { title: 'Tooltip', href: '/components/tooltip' },
    ],
  },
  {
    title: 'Forms',
    items: [
      { title: 'Controlled Input', href: '/forms/controlled-input' },
      { title: 'Field Arrays', href: '/forms/field-arrays' },
      { title: 'Submit', href: '/forms/submit' },
      { title: 'Validation', href: '/forms/validation' },
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

// Chevron icon component
function ChevronIcon() {
  return (
    <svg
      class="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-90"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

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
      class="block"
      data-preview-href={hasPreview ? href : undefined}
    >
      <a
        href={href}
        class={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
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
    <details class="mb-2 group" open={hasActiveItem || defaultOpen}>
      <summary class="flex w-full items-center justify-between py-2 px-3 text-sm font-medium text-foreground hover:bg-accent/50 rounded-md transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronIcon />
      </summary>
      <div class="pl-2 py-1 space-y-0.5">
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
      class="hidden xl:block fixed top-14 left-0 w-56 h-[calc(100vh-56px)] overflow-y-auto border-r border-border bg-background p-4"
      aria-label="Main navigation"
      data-sidebar-menu
    >
      <div class="space-y-1">
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
