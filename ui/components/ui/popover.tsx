"use client"

/**
 * Popover Components
 *
 * A floating panel that appears relative to a trigger element.
 * Inspired by shadcn/ui Popover with CSS variable theming support.
 *
 * State management uses createContext/useContext for parent-child communication.
 * Root Popover manages open state, children consume via context.
 *
 * Features:
 * - ESC key to close
 * - Click outside to close
 * - Non-modal (no scroll lock, no focus trap)
 * - Accessibility (aria-expanded, data-state)
 *
 * @example Basic popover
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <Popover open={open()} onOpenChange={setOpen}>
 *   <PopoverTrigger>
 *     <button>Open</button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <p>Popover content here.</p>
 *   </PopoverContent>
 * </Popover>
 * ```
 */

import { createContext, useContext, createEffect, createPortal, isSSRPortal } from '@barefootjs/dom'
import type { Child } from '../../types'

// Context for parent-child state sharing
interface PopoverContextValue {
  open: () => boolean
  onOpenChange: (open: boolean) => void
}

const PopoverContext = createContext<PopoverContextValue>()

// Store Content -> Trigger element mapping for positioning after portal
const contentTriggerMap = new WeakMap<HTMLElement, HTMLElement>()

// Popover container classes
const popoverClasses = 'relative inline-block'

// PopoverTrigger classes
const popoverTriggerClasses = 'inline-flex items-center disabled:pointer-events-none disabled:opacity-50'

// PopoverContent base classes (from shadcn/ui)
const popoverContentBaseClasses = 'fixed z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden transform-gpu origin-top transition-[opacity,transform] duration-normal ease-out'

// PopoverContent open/closed classes
const popoverContentOpenClasses = 'opacity-100 scale-100'
const popoverContentClosedClasses = 'opacity-0 scale-95 pointer-events-none'

/**
 * Props for Popover component.
 */
interface PopoverProps {
  /** Whether the popover is open */
  open?: boolean
  /** Callback when open state should change */
  onOpenChange?: (open: boolean) => void
  /** PopoverTrigger and PopoverContent */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Popover root component.
 * Provides open state to children via context.
 *
 * @param props.open - Whether the popover is open
 * @param props.onOpenChange - Callback when open state should change
 */
function Popover(props: PopoverProps) {
  return (
    <PopoverContext.Provider value={{
      open: () => props.open ?? false,
      onOpenChange: props.onOpenChange ?? (() => {}),
    }}>
      <div data-slot="popover" className={`${popoverClasses} ${props.class ?? ''}`}>
        {props.children}
      </div>
    </PopoverContext.Provider>
  )
}

/**
 * Props for PopoverTrigger component.
 */
interface PopoverTriggerProps {
  /** Whether disabled */
  disabled?: boolean
  /** Render child element as trigger instead of built-in button */
  asChild?: boolean
  /** Trigger content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Button that toggles the popover.
 * Reads open state from context and toggles via onOpenChange.
 *
 * @param props.disabled - Whether disabled
 * @param props.asChild - Render child as trigger
 */
function PopoverTrigger(props: PopoverTriggerProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(PopoverContext)

    createEffect(() => {
      el.setAttribute('aria-expanded', String(ctx.open()))
    })

    el.addEventListener('click', () => {
      ctx.onOpenChange(!ctx.open())
    })
  }

  if (props.asChild) {
    return (
      <span
        data-slot="popover-trigger"
        aria-expanded="false"
        style="display:contents"
        ref={handleMount}
      >
        {props.children}
      </span>
    )
  }

  return (
    <button
      data-slot="popover-trigger"
      type="button"
      aria-expanded="false"
      disabled={props.disabled ?? false}
      className={`${popoverTriggerClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for PopoverContent component.
 */
interface PopoverContentProps {
  /** Popover content */
  children?: Child
  /** Alignment relative to trigger */
  align?: 'start' | 'center' | 'end'
  /** Side relative to trigger */
  side?: 'top' | 'bottom'
  /** Additional CSS classes */
  class?: string
}

/**
 * Content container for the popover.
 * Portaled to body. Reads open state from context.
 *
 * @param props.align - Alignment ('start', 'center', or 'end')
 * @param props.side - Side ('top' or 'bottom')
 */
function PopoverContent(props: PopoverContentProps) {
  const handleMount = (el: HTMLElement) => {
    // Get trigger ref before portal (while still inside Popover container)
    const triggerEl = el.parentElement?.querySelector('[data-slot="popover-trigger"]') as HTMLElement
    if (triggerEl) contentTriggerMap.set(el, triggerEl)

    // Portal to body to escape overflow clipping
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[bf-s]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }

    const ctx = useContext(PopoverContext)

    // Position content relative to trigger
    const updatePosition = () => {
      if (!triggerEl) return
      const rect = triggerEl.getBoundingClientRect()
      const align = props.align ?? 'center'
      const side = props.side ?? 'bottom'

      if (side === 'bottom') {
        el.style.top = `${rect.bottom + 4}px`
      } else {
        el.style.top = `${rect.top - el.offsetHeight - 4}px`
      }

      if (align === 'start') {
        el.style.left = `${rect.left}px`
      } else if (align === 'end') {
        el.style.left = `${rect.right - el.offsetWidth}px`
      } else {
        // center
        el.style.left = `${rect.left + rect.width / 2 - el.offsetWidth / 2}px`
      }
    }

    // Track cleanup functions for global listeners
    let cleanupFns: Function[] = []

    // Reactive show/hide + positioning + global listeners
    createEffect(() => {
      // Clean up previous listeners
      for (const fn of cleanupFns) fn()
      cleanupFns = []

      const isOpen = ctx.open()
      el.dataset.state = isOpen ? 'open' : 'closed'
      el.className = `${popoverContentBaseClasses} ${isOpen ? popoverContentOpenClasses : popoverContentClosedClasses} ${props.class ?? ''}`

      if (isOpen) {
        updatePosition()

        // Close on click outside (content or trigger)
        const handleClickOutside = (e: MouseEvent) => {
          if (!el.contains(e.target as Node) && !triggerEl?.contains(e.target as Node)) {
            ctx.onOpenChange(false)
          }
        }

        // Close on ESC
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            ctx.onOpenChange(false)
            triggerEl?.focus()
          }
        }

        // Reposition on scroll and resize
        const handleScroll = () => updatePosition()

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', handleScroll)

        cleanupFns.push(
          () => document.removeEventListener('mousedown', handleClickOutside),
          () => document.removeEventListener('keydown', handleKeyDown),
          () => window.removeEventListener('scroll', handleScroll, true),
          () => window.removeEventListener('resize', handleScroll),
        )
      }
    })
  }

  return (
    <div
      data-slot="popover-content"
      data-state="closed"
      tabindex={-1}
      className={`${popoverContentBaseClasses} ${popoverContentClosedClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </div>
  )
}

/**
 * Props for PopoverClose component.
 */
interface PopoverCloseProps {
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Close button for the popover.
 * Reads context and calls onOpenChange(false) on click.
 */
function PopoverClose(props: PopoverCloseProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(PopoverContext)

    el.addEventListener('click', () => {
      ctx.onOpenChange(false)
    })
  }

  return (
    <button
      data-slot="popover-close"
      type="button"
      className={props.class ?? ''}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
}

export type {
  PopoverProps,
  PopoverTriggerProps,
  PopoverContentProps,
  PopoverCloseProps,
}
