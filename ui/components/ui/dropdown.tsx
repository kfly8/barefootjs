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

import type { Child } from '../../types'

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
      class={`inline-flex items-center justify-between rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent h-10 px-4 py-2 min-w-[160px] ${
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
        class={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-normal ${
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
    const target = e.currentTarget as HTMLElement
    const items = target.querySelectorAll('[data-dropdown-item]:not([aria-disabled="true"])')
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement)

    switch (e.key) {
      case 'Escape':
        if (onClose) onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (items.length > 0) {
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
          ;(items[nextIndex] as HTMLElement).focus()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (items.length > 0) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
          ;(items[prevIndex] as HTMLElement).focus()
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (document.activeElement && (document.activeElement as HTMLElement).dataset.dropdownItem !== undefined) {
          ;(document.activeElement as HTMLElement).click()
        }
        break
      case 'Home':
        e.preventDefault()
        if (items.length > 0) {
          ;(items[0] as HTMLElement).focus()
        }
        break
      case 'End':
        e.preventDefault()
        if (items.length > 0) {
          ;(items[items.length - 1] as HTMLElement).focus()
        }
        break
    }
  }

  // Animation: scale + fade from trigger with transform-origin at top
  // Uses CSS transitions for smooth open/close animation
  return (
    <div
      role="listbox"
      class={`absolute z-50 mt-1 w-full min-w-[160px] rounded-md border border-border bg-popover py-1 shadow-md transform-gpu origin-top transition-all duration-normal ease-out ${
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
  const handleClick = () => {
    onClick?.()
    // Return focus to trigger after selection
    const trigger = document.querySelector('[data-dropdown-trigger]') as HTMLElement
    setTimeout(() => trigger?.focus(), 0)
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      data-value={value}
      tabIndex={disabled ? -1 : 0}
      class={`relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground ${
        disabled ? 'pointer-events-none opacity-50' : ''
      } ${
        selected
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-popover-foreground hover:bg-accent/50'
      }`}
      onClick={handleClick}
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
    <span class="text-muted-foreground">{children}</span>
  )
}
