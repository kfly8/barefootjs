"use client"

/**
 * DropdownMenu Components
 *
 * An action menu triggered by a button, avatar, or any element.
 * Inspired by shadcn/ui DropdownMenu with CSS variable theming support.
 *
 * State management uses createContext/useContext for parent-child communication.
 * Root DropdownMenu manages open state, children consume via context.
 *
 * Features:
 * - ESC key to close
 * - Arrow key navigation
 * - Accessibility (role="menu", role="menuitem")
 *
 * @example Basic dropdown menu
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <DropdownMenu open={open()} onOpenChange={setOpen}>
 *   <DropdownMenuTrigger>
 *     <span>Open Menu</span>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuLabel>My Account</DropdownMenuLabel>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem onSelect={() => {}}>Settings</DropdownMenuItem>
 *     <DropdownMenuItem onSelect={() => {}}>Log out</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */

import { createContext, useContext, createEffect, createPortal, isSSRPortal } from '@barefootjs/dom'
import type { Child } from '../../types'

// Context for parent-child state sharing
interface DropdownMenuContextValue {
  open: () => boolean
  onOpenChange: (open: boolean) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextValue>()

// Store Content → Trigger element mapping for MenuItem focus return after portal
const contentTriggerMap = new WeakMap<HTMLElement, HTMLElement>()

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
  /** Whether the dropdown menu is open */
  open?: boolean
  /** Callback when open state should change */
  onOpenChange?: (open: boolean) => void
  /** DropdownMenuTrigger and DropdownMenuContent */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * DropdownMenu root component.
 * Provides open state to children via context.
 *
 * @param props.open - Whether the dropdown menu is open
 * @param props.onOpenChange - Callback when open state should change
 */
function DropdownMenu(props: DropdownMenuProps) {
  return (
    <DropdownMenuContext.Provider value={{
      open: () => props.open ?? false,
      onOpenChange: props.onOpenChange ?? (() => {}),
    }}>
      <div data-slot="dropdown-menu" className={`${dropdownMenuClasses} ${props.class ?? ''}`}>
        {props.children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

/**
 * Props for DropdownMenuTrigger component.
 */
interface DropdownMenuTriggerProps {
  /** Whether disabled */
  disabled?: boolean
  /** Render child element as trigger instead of built-in button */
  asChild?: boolean
  /** Trigger content (any element: button, avatar, icon, etc.) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Button that toggles the dropdown menu.
 * Reads open state from context and toggles via onOpenChange.
 *
 * @param props.disabled - Whether disabled
 * @param props.asChild - Render child as trigger
 */
function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(DropdownMenuContext)

    createEffect(() => {
      el.setAttribute('aria-expanded', String(ctx.open()))
    })

    el.addEventListener('click', () => {
      ctx.onOpenChange(!ctx.open())
    })

    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ctx.open()) {
        e.preventDefault()
        ctx.onOpenChange(false)
      }
    })
  }

  if (props.asChild) {
    return (
      <span
        data-slot="dropdown-menu-trigger"
        aria-expanded="false"
        aria-haspopup="menu"
        style="display:contents"
        ref={handleMount}
      >
        {props.children}
      </span>
    )
  }

  return (
    <button
      data-slot="dropdown-menu-trigger"
      type="button"
      aria-expanded="false"
      aria-haspopup="menu"
      disabled={props.disabled ?? false}
      className={`${dropdownMenuTriggerClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for DropdownMenuContent component.
 */
interface DropdownMenuContentProps {
  /** DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator components */
  children?: Child
  /** Alignment relative to trigger */
  align?: 'start' | 'end'
  /** Additional CSS classes */
  class?: string
}

/**
 * Content container for dropdown menu items.
 * Portaled to body. Reads open state from context.
 *
 * @param props.align - Alignment ('start' or 'end')
 */
function DropdownMenuContent(props: DropdownMenuContentProps) {
  const handleMount = (el: HTMLElement) => {
    // Get trigger ref before portal (while still inside DropdownMenu container)
    const triggerEl = el.parentElement?.querySelector('[data-slot="dropdown-menu-trigger"]') as HTMLElement
    if (triggerEl) contentTriggerMap.set(el, triggerEl)

    // Portal to body to escape overflow clipping
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[data-bf-scope]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }

    const ctx = useContext(DropdownMenuContext)

    // Reactive show/hide + positioning
    createEffect(() => {
      const isOpen = ctx.open()
      el.dataset.state = isOpen ? 'open' : 'closed'
      el.className = `${dropdownMenuContentBaseClasses} ${isOpen ? dropdownMenuContentOpenClasses : dropdownMenuContentClosedClasses} ${props.class ?? ''}`

      if (isOpen && triggerEl) {
        const rect = triggerEl.getBoundingClientRect()
        el.style.top = `${rect.bottom + 4}px`
        if (props.align === 'end') {
          el.style.left = `${rect.right - el.offsetWidth}px`
        } else {
          el.style.left = `${rect.left}px`
        }
      }
    })

    // Keyboard navigation
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      const items = el.querySelectorAll('[data-slot="dropdown-menu-item"]:not([aria-disabled="true"])')
      const currentIndex = Array.from(items).findIndex(item => item === document.activeElement)

      switch (e.key) {
        case 'Escape':
          ctx.onOpenChange(false)
          triggerEl?.focus()
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
    })
  }

  return (
    <div
      data-slot="dropdown-menu-content"
      data-state="closed"
      role="menu"
      tabindex={-1}
      className={`${dropdownMenuContentBaseClasses} ${dropdownMenuContentClosedClasses} ${props.class ?? ''}`}
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
  /** Callback when item is selected (menu auto-closes) */
  onSelect?: () => void
  /** Item content (text, icons, shortcuts) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Individual dropdown menu item (action).
 * Auto-closes menu and returns focus to trigger on select.
 *
 * @param props.disabled - Whether disabled
 * @param props.onSelect - Selection callback
 */
function DropdownMenuItem(props: DropdownMenuItemProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(DropdownMenuContext)

    el.addEventListener('click', () => {
      if (el.getAttribute('aria-disabled') === 'true') return
      props.onSelect?.()
      ctx.onOpenChange(false)

      // Focus return: use stored trigger ref
      const content = el.closest('[data-slot="dropdown-menu-content"]') as HTMLElement
      const trigger = content ? contentTriggerMap.get(content) : null
      setTimeout(() => trigger?.focus(), 0)
    })
  }

  return (
    <div
      data-slot="dropdown-menu-item"
      role="menuitem"
      aria-disabled={(props.disabled ?? false) || undefined}
      tabindex={(props.disabled ?? false) ? -1 : 0}
      className={`${dropdownMenuItemBaseClasses} ${(props.disabled ?? false) ? dropdownMenuItemDisabledClasses : dropdownMenuItemDefaultClasses} ${props.class ?? ''}`}
      ref={handleMount}
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
