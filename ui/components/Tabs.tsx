/**
 * Tabs Component
 *
 * A set of layered sections of content—known as tab panels—that are
 * displayed one at a time.
 * Inspired by shadcn/ui Tabs component.
 *
 * Design Decision: Selected state management
 * This component uses props-based state management rather than Context.
 * The parent component should:
 * 1. Use a signal to track the currently selected tab value
 * 2. Pass `value` and `onValueChange` props to Tabs
 * 3. Pass the same `value` to TabsTrigger and TabsContent for matching
 *
 * This approach keeps the component tree explicit and avoids Context
 * complexity while maintaining full control over tab state.
 */

import type { Child } from '../types'

// Tabs - Container component
export interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: Child
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
}: TabsProps) {
  return (
    <div class="w-full" data-value={value || defaultValue}>
      {children}
    </div>
  )
}

// TabsList - Container for tab triggers
export interface TabsListProps {
  children?: Child
}

export function TabsList({
  children,
}: TabsListProps) {
  return (
    <div
      role="tablist"
      class="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 p-1 text-zinc-500"
    >
      {children}
    </div>
  )
}

// TabsTrigger - Individual tab button
export interface TabsTriggerProps {
  value: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: Child
}

export function TabsTrigger({
  value,
  selected = false,
  disabled = false,
  onClick,
  children,
}: TabsTriggerProps) {
  return (
    <button
      role="tab"
      aria-selected={selected}
      {...(disabled ? { disabled: true } : {})}
      data-state={selected ? 'active' : 'inactive'}
      data-value={value}
      class={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${
        disabled ? 'pointer-events-none opacity-50' : ''
      } ${
        selected
          ? 'bg-white text-zinc-950 shadow'
          : 'text-zinc-500 hover:text-zinc-900'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// TabsContent - Content panel for each tab
// Note: Uses CSS to show/hide instead of conditional rendering
// because the compiler has limitations with ternary conditional returns.
export interface TabsContentProps {
  value: string
  selected?: boolean
  children?: Child
}

export function TabsContent({
  value,
  selected = false,
  children,
}: TabsContentProps) {
  return (
    <div
      role="tabpanel"
      data-state={selected ? 'active' : 'inactive'}
      data-value={value}
      class={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${selected ? '' : 'hidden'}`}
    >
      {children}
    </div>
  )
}
