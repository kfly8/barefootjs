"use client"

/**
 * DropdownMenu Components
 *
 * An action menu triggered by a button, avatar, or any element.
 * Inspired by shadcn/ui DropdownMenu with CSS variable theming support.
 *
 * Features:
 * - ESC key to close
 * - Arrow key navigation
 * - Click outside to close
 * - Accessibility (role="menu", role="menuitem")
 *
 * @example Basic dropdown menu
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <DropdownMenu>
 *   <DropdownMenuTrigger open={open()} onClick={() => setOpen(!open())}>
 *     <button>Open Menu</button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent open={open()} onClose={() => setOpen(false)}>
 *     <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem onClick={() => {}}>Settings</DropdownMenuItem>
 *     <DropdownMenuItem onClick={() => {}}>Log out</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */

import { createEffect, createPortal, isSSRPortal } from '@barefootjs/dom'
import type { Child } from '../../types'

// DropdownMenu container classes
const dropdownMenuClasses = 'relative inline-block'

// DropdownMenuTrigger classes (minimal - user styles their own content)
const dropdownMenuTriggerClasses = 'inline-flex items-center disabled:pointer-events-none disabled:opacity-50'

// DropdownMenuContent base classes
const dropdownMenuContentBaseClasses = 'fixed z-50 min-w-[8rem] rounded-md border border-border bg-popover p-1 shadow-md transform-gpu origin-top transition-[opacity,transform] duration-normal ease-out'

// DropdownMenuContent open/closed classes
const dropdownMenuContentOpenClasses = 'opacity-100 scale-100'
const dropdownMenuContentClosedClasses = 'opacity-0 scale-95 pointer-events-none'

// DropdownMenuItem base classes
const dropdownMenuItemBaseClasses = 'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden'

// DropdownMenuItem state classes
const dropdownMenuItemDefaultClasses = 'text-popover-foreground hover:bg-accent/50 focus:bg-accent focus:text-accent-foreground'
const dropdownMenuItemDisabledClasses = 'pointer-events-none opacity-50'

// DropdownMenuLabel classes
const dropdownMenuLabelClasses = 'px-2 py-1.5 text-sm font-semibold text-foreground'

// DropdownMenuSeparator classes
const dropdownMenuSeparatorClasses = '-mx-1 my-1 h-px bg-border'

// DropdownMenuShortcut classes
const dropdownMenuShortcutClasses = 'ml-auto text-xs tracking-widest text-muted-foreground'

/**
 * Props for DropdownMenu component.
 */
interface DropdownMenuProps {
  /** DropdownMenuTrigger and DropdownMenuContent */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * DropdownMenu container component.
 *
 * @param props.children - Trigger and content components
 */
function DropdownMenu(props: DropdownMenuProps) {
  return (
    <div data-slot="dropdown-menu" className={`${dropdownMenuClasses} ${props.class ?? ''}`}>
      {props.children}
    </div>
  )
}

/**
 * Props for DropdownMenuTrigger component.
 */
interface DropdownMenuTriggerProps {
  /** Whether the dropdown menu is open */
  open?: boolean
  /** Whether disabled */
  disabled?: boolean
  /** Render child element as trigger instead of built-in button */
  asChild?: boolean
  /** Click handler to toggle dropdown menu */
  onClick?: () => void
  /** Trigger content (any element: button, avatar, icon, etc.) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Button that toggles the dropdown menu.
 * Renders children as-is without built-in styling or chevron.
 *
 * @param props.open - Whether open
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open) {
      e.preventDefault()
      props.onClick?.()
    }
  }

  if (props.asChild) {
    return (
      <span
        data-slot="dropdown-menu-trigger"
        aria-expanded={props.open ?? false}
        aria-haspopup="menu"
        onClick={props.onClick}
        onKeyDown={handleKeyDown}
        style="display:contents"
      >
        {props.children}
      </span>
    )
  }

  return (
    <button
      data-slot="dropdown-menu-trigger"
      type="button"
      aria-expanded={props.open ?? false}
      aria-haspopup="menu"
      disabled={props.disabled ?? false}
      className={`${dropdownMenuTriggerClasses} ${props.class ?? ''}`}
      onClick={props.onClick}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for DropdownMenuContent component.
 */
interface DropdownMenuContentProps {
  /** Whether the dropdown menu is open */
  open?: boolean
  /** Callback to close the dropdown menu */
  onClose?: () => void
  /** DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator components */
  children?: Child
  /** Alignment relative to trigger */
  align?: 'start' | 'end'
  /** Additional CSS classes */
  class?: string
}

/**
 * Content container for dropdown menu items.
 *
 * @param props.open - Whether visible
 * @param props.onClose - Close callback
 * @param props.align - Alignment ('start' or 'end')
 */
function DropdownMenuContent(props: DropdownMenuContentProps) {
  const ref = { current: null as HTMLElement | null }
  const triggerRef = { current: null as HTMLElement | null }

  // Position content relative to trigger using fixed positioning
  createEffect(() => {
    if (props.open && ref.current && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      ref.current.style.top = `${rect.bottom + 4}px`
      if (props.align === 'end') {
        ref.current.style.left = `${rect.right - ref.current.offsetWidth}px`
      } else {
        ref.current.style.left = `${rect.left}px`
      }
    }
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement
    const items = target.querySelectorAll('[data-slot="dropdown-menu-item"]:not([aria-disabled="true"])')
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement)

    switch (e.key) {
      case 'Escape':
        if (props.onClose) props.onClose()
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
        if (document.activeElement && (document.activeElement as HTMLElement).dataset.slot === 'dropdown-menu-item') {
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

  // Portal: move to body to escape overflow clipping from ancestors
  const handleMount = (el: HTMLElement) => {
    ref.current = el
    triggerRef.current = el.parentElement?.querySelector('[data-slot="dropdown-menu-trigger"]') as HTMLElement
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[data-bf-scope]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }
  }

  return (
    <div
      data-slot="dropdown-menu-content"
      data-state={(props.open ?? false) ? 'open' : 'closed'}
      role="menu"
      tabindex={-1}
      className={`${dropdownMenuContentBaseClasses} ${(props.open ?? false) ? dropdownMenuContentOpenClasses : dropdownMenuContentClosedClasses} ${props.class ?? ''}`}
      onKeyDown={handleKeyDown}
      ref={handleMount}
    >
      {props.children}
    </div>
  )
}

/**
 * Props for DropdownMenuItem component.
 */
interface DropdownMenuItemProps {
  /** Whether disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Item content (text, icons, shortcuts) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Individual dropdown menu item (action).
 *
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function DropdownMenuItem(props: DropdownMenuItemProps) {
  const handleClick = () => {
    props.onClick?.()
    const trigger = document.querySelector('[data-slot="dropdown-menu-trigger"]') as HTMLElement
    setTimeout(() => trigger?.focus(), 0)
  }

  return (
    <div
      data-slot="dropdown-menu-item"
      role="menuitem"
      aria-disabled={(props.disabled ?? false) || undefined}
      tabindex={(props.disabled ?? false) ? -1 : 0}
      className={`${dropdownMenuItemBaseClasses} ${(props.disabled ?? false) ? dropdownMenuItemDisabledClasses : dropdownMenuItemDefaultClasses} ${props.class ?? ''}`}
      onClick={handleClick}
    >
      {props.children}
    </div>
  )
}

/**
 * Props for DropdownMenuLabel component.
 */
interface DropdownMenuLabelProps {
  /** Label text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Section label inside the dropdown menu.
 *
 * @param props.children - Label content
 */
function DropdownMenuLabel(props: DropdownMenuLabelProps) {
  return (
    <div data-slot="dropdown-menu-label" className={`${dropdownMenuLabelClasses} ${props.class ?? ''}`}>
      {props.children}
    </div>
  )
}

/**
 * Props for DropdownMenuSeparator component.
 */
interface DropdownMenuSeparatorProps {
  /** Additional CSS classes */
  class?: string
}

/**
 * Visual separator between menu item groups.
 */
function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
  return (
    <div data-slot="dropdown-menu-separator" role="separator" className={`${dropdownMenuSeparatorClasses} ${props.class ?? ''}`} />
  )
}

/**
 * Props for DropdownMenuShortcut component.
 */
interface DropdownMenuShortcutProps {
  /** Shortcut text (e.g., "Ctrl+Q") */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Keyboard shortcut indicator displayed inside a menu item.
 *
 * @param props.children - Shortcut text
 */
function DropdownMenuShortcut(props: DropdownMenuShortcutProps) {
  return (
    <span data-slot="dropdown-menu-shortcut" className={`${dropdownMenuShortcutClasses} ${props.class ?? ''}`}>
      {props.children}
    </span>
  )
}

/**
 * Props for DropdownMenuGroup component.
 */
interface DropdownMenuGroupProps {
  /** Grouped menu items */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Semantic grouping of related menu items.
 *
 * @param props.children - Grouped items
 */
function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  return (
    <div data-slot="dropdown-menu-group" role="group" className={props.class ?? ''}>
      {props.children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
}

export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuLabelProps,
  DropdownMenuSeparatorProps,
  DropdownMenuShortcutProps,
  DropdownMenuGroupProps,
}
