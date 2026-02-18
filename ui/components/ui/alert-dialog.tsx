"use client"

/**
 * AlertDialog Components
 *
 * A modal dialog for critical confirmations that require explicit user action.
 * Unlike Dialog, AlertDialog does NOT close on overlay click — users must
 * choose an action (Cancel or Action).
 *
 * Follows the WAI-ARIA alertdialog pattern and shadcn/ui's AlertDialog design.
 *
 * Features:
 * - ESC key to close
 * - Overlay does NOT close on click (key difference from Dialog)
 * - Focus trap (Tab/Shift+Tab cycles within modal)
 * - Accessibility (role="alertdialog", aria-modal="true")
 *
 * @example Basic alert dialog
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <AlertDialog open={open()} onOpenChange={setOpen}>
 *   <AlertDialogTrigger>Delete</AlertDialogTrigger>
 *   <AlertDialogOverlay />
 *   <AlertDialogContent ariaLabelledby="alert-title" ariaDescribedby="alert-desc">
 *     <AlertDialogHeader>
 *       <AlertDialogTitle id="alert-title">Are you sure?</AlertDialogTitle>
 *       <AlertDialogDescription id="alert-desc">
 *         This action cannot be undone.
 *       </AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Continue</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 */

import { createContext, useContext, createEffect, createPortal, isSSRPortal } from '@barefootjs/dom'
import type { Child } from '../../types'

// Context for AlertDialog → children state sharing
interface AlertDialogContextValue {
  open: () => boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = createContext<AlertDialogContextValue>()

// AlertDialogTrigger classes
const alertDialogTriggerClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50'

// AlertDialogOverlay base classes (aligned with shadcn/ui)
const alertDialogOverlayBaseClasses = 'fixed inset-0 z-50 bg-black/80 transition-opacity duration-200'

// AlertDialogOverlay open/closed classes
const alertDialogOverlayOpenClasses = 'opacity-100'
const alertDialogOverlayClosedClasses = 'opacity-0 pointer-events-none'

// AlertDialogContent base classes (aligned with shadcn/ui)
const alertDialogContentBaseClasses = 'fixed left-[50%] top-[50%] z-50 flex flex-col w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg'

// AlertDialogContent open/closed classes
const alertDialogContentOpenClasses = 'opacity-100 scale-100'
const alertDialogContentClosedClasses = 'opacity-0 scale-95 pointer-events-none'

// AlertDialogHeader classes
const alertDialogHeaderClasses = 'flex flex-col gap-2 text-center sm:text-left'

// AlertDialogTitle classes
const alertDialogTitleClasses = 'text-lg leading-none font-semibold'

// AlertDialogDescription classes
const alertDialogDescriptionClasses = 'text-muted-foreground text-sm'

// AlertDialogFooter classes
const alertDialogFooterClasses = 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'

// AlertDialogCancel classes (outline style like DialogClose)
const alertDialogCancelClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2'

// AlertDialogAction classes (primary style)
const alertDialogActionClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2'

/**
 * Props for AlertDialog component.
 */
interface AlertDialogProps {
  /** Whether the alert dialog is open */
  open?: boolean
  /** Callback when open state should change */
  onOpenChange?: (open: boolean) => void
  /** Scope ID for SSR portal support (explicit) */
  scopeId?: string
  /** Scope ID from compiler (auto-passed via hydration props) */
  __instanceId?: string
  /** Scope ID from compiler in loops (auto-passed via hydration props) */
  __bfScope?: string
  /** AlertDialog content */
  children?: Child
}

/**
 * AlertDialog root component.
 * Provides open state to children via context.
 */
function AlertDialog(props: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{
      open: () => props.open ?? false,
      onOpenChange: props.onOpenChange ?? (() => {}),
    }}>
      {props.children}
    </AlertDialogContext.Provider>
  )
}

/**
 * Props for AlertDialogTrigger component.
 */
interface AlertDialogTriggerProps {
  /** Whether disabled */
  disabled?: boolean
  /** Render child element as trigger instead of built-in button */
  asChild?: boolean
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Button that triggers the alert dialog to open.
 */
function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(AlertDialogContext)

    el.addEventListener('click', () => {
      ctx.onOpenChange(!ctx.open())
    })
  }

  if (props.asChild) {
    return (
      <span
        data-slot="alert-dialog-trigger"
        style="display:contents"
        ref={handleMount}
      >
        {props.children}
      </span>
    )
  }

  return (
    <button
      data-slot="alert-dialog-trigger"
      type="button"
      className={`${alertDialogTriggerClasses} ${props.class ?? ''}`}
      disabled={props.disabled ?? false}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for AlertDialogOverlay component.
 */
interface AlertDialogOverlayProps {
  /** Additional CSS classes */
  class?: string
}

/**
 * Semi-transparent overlay behind the alert dialog.
 * Unlike Dialog overlay, this does NOT close on click.
 */
function AlertDialogOverlay(props: AlertDialogOverlayProps) {
  const handleMount = (el: HTMLElement) => {
    // Portal to body
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[bf-s]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }

    const ctx = useContext(AlertDialogContext)

    // Reactive show/hide — NO click-to-close (key difference from Dialog)
    createEffect(() => {
      const isOpen = ctx.open()
      el.dataset.state = isOpen ? 'open' : 'closed'
      el.className = `${alertDialogOverlayBaseClasses} ${isOpen ? alertDialogOverlayOpenClasses : alertDialogOverlayClosedClasses} ${props.class ?? ''}`
    })
  }

  return (
    <div
      data-slot="alert-dialog-overlay"
      data-state="closed"
      className={`${alertDialogOverlayBaseClasses} ${alertDialogOverlayClosedClasses} ${props.class ?? ''}`}
      ref={handleMount}
    />
  )
}

/**
 * Props for AlertDialogContent component.
 */
interface AlertDialogContentProps {
  /** AlertDialog content */
  children?: Child
  /** ID of the title element for aria-labelledby */
  ariaLabelledby?: string
  /** ID of the description element for aria-describedby */
  ariaDescribedby?: string
  /** Additional CSS classes */
  class?: string
}

/**
 * Main content container for the alert dialog.
 * Uses role="alertdialog" instead of role="dialog".
 */
function AlertDialogContent(props: AlertDialogContentProps) {
  const handleMount = (el: HTMLElement) => {
    // Portal to body
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[bf-s]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }

    const ctx = useContext(AlertDialogContext)

    // Track cleanup functions for global listeners
    let cleanupFns: Function[] = []

    // Reactive show/hide + scroll lock + focus trap + ESC key
    createEffect(() => {
      // Clean up previous listeners
      for (const fn of cleanupFns) fn()
      cleanupFns = []

      const isOpen = ctx.open()
      el.dataset.state = isOpen ? 'open' : 'closed'
      el.className = `${alertDialogContentBaseClasses} ${isOpen ? alertDialogContentOpenClasses : alertDialogContentClosedClasses} ${props.class ?? ''}`

      if (isOpen) {
        // Scroll lock
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        // Focus first focusable element
        const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        setTimeout(() => {
          const focusableElements = el.querySelectorAll(focusableSelector)
          const firstElement = focusableElements[0] as HTMLElement
          firstElement?.focus()
        }, 0)

        // ESC key to close
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            ctx.onOpenChange(false)
            return
          }

          // Focus trap
          if (e.key === 'Tab') {
            const focusableElements = el.querySelectorAll(focusableSelector)
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

            if (e.shiftKey) {
              if (document.activeElement === firstElement || document.activeElement === el) {
                e.preventDefault()
                lastElement?.focus()
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault()
                firstElement?.focus()
              }
            }
          }
        }

        document.addEventListener('keydown', handleKeyDown)

        cleanupFns.push(
          () => { document.body.style.overflow = originalOverflow },
          () => document.removeEventListener('keydown', handleKeyDown),
        )
      }
    })
  }

  return (
    <div
      data-slot="alert-dialog-content"
      data-state="closed"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      tabindex={-1}
      className={`${alertDialogContentBaseClasses} ${alertDialogContentClosedClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </div>
  )
}

/**
 * Props for AlertDialogHeader component.
 */
interface AlertDialogHeaderProps {
  /** Header content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Header section of the alert dialog.
 */
function AlertDialogHeader({ class: className = '', children }: AlertDialogHeaderProps) {
  return (
    <div data-slot="alert-dialog-header" className={`${alertDialogHeaderClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for AlertDialogTitle component.
 */
interface AlertDialogTitleProps {
  /** ID for aria-labelledby reference */
  id?: string
  /** Title text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Title of the alert dialog.
 */
function AlertDialogTitle({ class: className = '', id, children }: AlertDialogTitleProps) {
  return (
    <h2 data-slot="alert-dialog-title" id={id} className={`${alertDialogTitleClasses} ${className}`}>
      {children}
    </h2>
  )
}

/**
 * Props for AlertDialogDescription component.
 */
interface AlertDialogDescriptionProps {
  /** ID for aria-describedby reference */
  id?: string
  /** Description text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Description text for the alert dialog.
 */
function AlertDialogDescription({ class: className = '', id, children }: AlertDialogDescriptionProps) {
  return (
    <p data-slot="alert-dialog-description" id={id} className={`${alertDialogDescriptionClasses} ${className}`}>
      {children}
    </p>
  )
}

/**
 * Props for AlertDialogFooter component.
 */
interface AlertDialogFooterProps {
  /** Footer content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Footer section of the alert dialog.
 */
function AlertDialogFooter({ class: className = '', children }: AlertDialogFooterProps) {
  return (
    <div data-slot="alert-dialog-footer" className={`${alertDialogFooterClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for AlertDialogCancel component.
 */
interface AlertDialogCancelProps {
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Cancel button for the alert dialog.
 * Closes the dialog without performing the action.
 */
function AlertDialogCancel(props: AlertDialogCancelProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(AlertDialogContext)

    el.addEventListener('click', () => {
      ctx.onOpenChange(false)
    })
  }

  return (
    <button
      data-slot="alert-dialog-cancel"
      type="button"
      className={`${alertDialogCancelClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for AlertDialogAction component.
 */
interface AlertDialogActionProps {
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
  /** Click handler for the action */
  onClick?: () => void
}

/**
 * Action button for the alert dialog.
 * Closes the dialog and triggers the action.
 */
function AlertDialogAction(props: AlertDialogActionProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(AlertDialogContext)

    el.addEventListener('click', () => {
      props.onClick?.()
      ctx.onOpenChange(false)
    })
  }

  return (
    <button
      data-slot="alert-dialog-action"
      type="button"
      className={`${alertDialogActionClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
}
export type {
  AlertDialogProps,
  AlertDialogTriggerProps,
  AlertDialogOverlayProps,
  AlertDialogContentProps,
  AlertDialogHeaderProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
  AlertDialogFooterProps,
  AlertDialogCancelProps,
  AlertDialogActionProps,
}
