"use client"
/**
 * Dropdown Component
 *
 * A select-like dropdown menu for choosing from a list of options.
 *
 * Features:
 * - Open/close state management via props
 * - ESC key to close
 * - Click on item to select
 * - Accessibility (role="combobox", role="listbox", role="option")
 *
 * Design Decision: Props-based state management
 * Similar to Accordion/Tabs/Dialog, this component uses props for state.
 * The parent component manages the open and selected state with signals.
 *
 * Note: Uses CSS-based visibility (hidden class) due to BarefootJS compiler
 * constraints. The compiler processes JSX structure but does not preserve
 * custom createEffect logic with conditional JSX returns.
 */

import type { Child } from '../types'

// --- Dropdown ---
// Note: This is a simple positioning wrapper with no client-side behavior.
// Due to BarefootJS compiler constraints, this renders directly as a div.

export interface DropdownProps {
  children?: Child
}

export function Dropdown({ children }: DropdownProps) {
  return (
    <div class="relative inline-block">
      {children}
    </div>
  )
}

// --- DropdownTrigger ---

export interface DropdownTriggerProps {
  open?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: Child
}

export function DropdownTrigger({
  open = false,
  disabled = false,
  onClick,
  children,
}: DropdownTriggerProps) {
  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      class={`inline-flex items-center justify-between rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 border border-zinc-200 bg-white hover:bg-zinc-100 h-10 px-4 py-2 min-w-[160px] ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
      {...(disabled ? { disabled: true } : {})}
      onClick={onClick}
      data-dropdown-trigger
    >
      <span class="truncate">{children}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={`ml-2 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
          open ? 'rotate-180' : ''
        }`}
      >
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </button>
  )
}

// --- DropdownContent ---

export interface DropdownContentProps {
  open?: boolean
  onClose?: () => void
  children?: Child
}

export function DropdownContent({
  open = false,
  onClose,
  children,
}: DropdownContentProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose()
    }
  }

  // Animation: scale + fade from trigger with transform-origin at top
  // Uses CSS transitions for smooth open/close animation
  return (
    <div
      role="listbox"
      class={`absolute z-50 mt-1 w-full min-w-[160px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg transform-gpu origin-top transition-all duration-200 ease-out ${
        open
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      data-dropdown-content
    >
      {children}
    </div>
  )
}

// --- DropdownItem ---

export interface DropdownItemProps {
  value: string
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: Child
}

export function DropdownItem({
  value,
  selected = false,
  disabled = false,
  onClick,
  children,
}: DropdownItemProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      data-value={value}
      class={`relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none ${
        disabled ? 'pointer-events-none opacity-50' : ''
      } ${
        selected
          ? 'bg-zinc-100 text-zinc-900 font-medium'
          : 'text-zinc-700 hover:bg-zinc-50'
      }`}
      onClick={onClick}
      data-dropdown-item
    >
      {selected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="absolute left-2 h-4 w-4"
        >
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      <span class={selected ? 'pl-6' : ''}>{children}</span>
    </div>
  )
}

// --- DropdownLabel ---

export interface DropdownLabelProps {
  children?: Child
}

export function DropdownLabel({ children }: DropdownLabelProps) {
  return (
    <span class="text-zinc-500">{children}</span>
  )
}
