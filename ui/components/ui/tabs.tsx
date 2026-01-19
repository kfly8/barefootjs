"use client"

/**
 * Tabs Components
 *
 * A set of layered sections of content displayed one at a time.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Design Decision: Props-based state management instead of Context.
 * The parent component should use signals to track state and pass
 * `selected` prop to TabsTrigger and TabsContent for matching.
 *
 * @example Basic tabs
 * ```tsx
 * const [activeTab, setActiveTab] = useState('account')
 *
 * <Tabs value={activeTab} onValueChange={setActiveTab}>
 *   <TabsList>
 *     <TabsTrigger value="account" selected={activeTab === 'account'} onClick={() => setActiveTab('account')}>
 *       Account
 *     </TabsTrigger>
 *     <TabsTrigger value="password" selected={activeTab === 'password'} onClick={() => setActiveTab('password')}>
 *       Password
 *     </TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account" selected={activeTab === 'account'}>
 *     Account settings here
 *   </TabsContent>
 *   <TabsContent value="password" selected={activeTab === 'password'}>
 *     Password settings here
 *   </TabsContent>
 * </Tabs>
 * ```
 */

import type { Child } from '../../types'

// Tabs container classes
const tabsClasses = 'flex flex-col gap-2 w-full'

// TabsList classes
const tabsListClasses = 'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]'

// TabsTrigger base classes
const tabsTriggerBaseClasses = 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'

// TabsTrigger focus classes
const tabsTriggerFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// TabsTrigger active classes
const tabsTriggerActiveClasses = 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30'

// TabsTrigger inactive classes
const tabsTriggerInactiveClasses = 'text-foreground dark:text-muted-foreground'

// TabsContent classes
const tabsContentClasses = 'flex-1 outline-none'

/**
 * Props for Tabs component.
 */
interface TabsProps {
  /** Currently selected tab value */
  value?: string
  /** Default selected value (uncontrolled) */
  defaultValue?: string
  /** Callback when tab changes */
  onValueChange?: (value: string) => void
  /** Tab components (TabsList and TabsContent) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Tabs container component.
 *
 * @param props.value - Currently selected tab value
 * @param props.defaultValue - Default value for uncontrolled usage
 * @param props.onValueChange - Callback when tab changes
 */
function Tabs({
  class: className = '',
  value,
  defaultValue,
  children,
}: TabsProps) {
  return (
    <div data-slot="tabs" data-value={value || defaultValue} class={`${tabsClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for TabsList component.
 */
interface TabsListProps {
  /** TabsTrigger components */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Container for tab triggers.
 *
 * @param props.children - TabsTrigger components
 */
function TabsList({
  class: className = '',
  children,
}: TabsListProps) {
  return (
    <div data-slot="tabs-list" role="tablist" class={`${tabsListClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for TabsTrigger component.
 */
interface TabsTriggerProps {
  /** Value that identifies this tab */
  value: string
  /** Whether this tab is currently selected */
  selected?: boolean
  /** Whether this tab is disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Tab label */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Individual tab button.
 *
 * @param props.value - Tab identifier
 * @param props.selected - Whether selected
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function TabsTrigger({
  class: className = '',
  value,
  selected = false,
  disabled = false,
  onClick,
  children,
}: TabsTriggerProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement
    const tabList = target.closest('[role="tablist"]')
    if (!tabList) return

    const tabs = tabList.querySelectorAll('[role="tab"]:not([disabled])')
    const currentIndex = Array.from(tabs).indexOf(target)

    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = tabs.length - 1
        break
    }

    if (nextIndex !== null && tabs[nextIndex]) {
      const nextTab = tabs[nextIndex] as HTMLElement
      nextTab.focus()
      nextTab.click()
    }
  }

  const stateClasses = selected ? tabsTriggerActiveClasses : tabsTriggerInactiveClasses
  const classes = `${tabsTriggerBaseClasses} ${tabsTriggerFocusClasses} ${stateClasses} ${className}`

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={selected}
      disabled={disabled}
      data-state={selected ? 'active' : 'inactive'}
      data-value={value}
      tabindex={selected ? 0 : -1}
      class={classes}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  )
}

/**
 * Props for TabsContent component.
 */
interface TabsContentProps {
  /** Value that identifies which tab this content belongs to */
  value: string
  /** Whether this content is currently visible */
  selected?: boolean
  /** Content to display */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Content panel for a tab.
 *
 * @param props.value - Tab identifier
 * @param props.selected - Whether visible
 */
function TabsContent({
  class: className = '',
  value,
  selected = false,
  children,
}: TabsContentProps) {
  const visibilityClass = selected ? '' : 'hidden'
  const classes = `${tabsContentClasses} ${visibilityClass} ${className}`

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      tabindex={0}
      data-state={selected ? 'active' : 'inactive'}
      data-value={value}
      class={classes}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
