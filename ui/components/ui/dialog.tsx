"use client"

/**
 * Dialog Components
 *
 * A modal dialog that displays content in a layer above the page.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Features:
 * - ESC key to close
 * - Click outside (overlay) to close
 * - Focus trap (Tab/Shift+Tab cycles within modal)
 * - Accessibility (role="dialog", aria-modal="true")
 *
 * @example Basic dialog
 * ```tsx
 * const [open, setOpen] = useState(false)
 *
 * <>
 *   <DialogTrigger onClick={() => setOpen(true)}>Open Dialog</DialogTrigger>
 *   <DialogOverlay open={open} onClick={() => setOpen(false)} />
 *   <DialogContent
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     ariaLabelledby="dialog-title"
 *   >
 *     <DialogHeader>
 *       <DialogTitle id="dialog-title">Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description here.</DialogDescription>
 *     </DialogHeader>
 *     <DialogFooter>
 *       <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
 *       <Button onClick={handleAction}>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </>
 * ```
 */

import { createEffect, onCleanup, createPortal, isSSRPortal } from '@barefootjs/dom'
import type { Child } from '../../types'

// Scope ID context for SSR portal support
// This is set by DialogRoot and used by DialogOverlay/DialogContent
let currentDialogScopeId: string | undefined = undefined

/**
 * Props for DialogRoot component.
 */
interface DialogRootProps {
  /** Scope ID for SSR portal support (explicit) */
  scopeId?: string
  /** Scope ID from compiler (auto-passed via hydration props) */
  __instanceId?: string
  /** Scope ID from compiler in loops (auto-passed via hydration props) */
  __bfScope?: string
  /** Dialog content */
  children?: Child
}

/**
 * Root component that provides scope context for Dialog components.
 * Wrap your Dialog usage with this to enable SSR portal support.
 *
 * The scopeId is automatically received from the compiler via `__instanceId`
 * or `__bfScope` props. You can also pass it explicitly via `scopeId` prop.
 *
 * @example
 * ```tsx
 * <DialogRoot>
 *   <DialogTrigger onClick={() => setOpen(true)}>Open</DialogTrigger>
 *   <DialogOverlay open={open()} onClick={() => setOpen(false)} />
 *   <DialogContent open={open()} onClose={() => setOpen(false)}>
 *     ...
 *   </DialogContent>
 * </DialogRoot>
 * ```
 */
function DialogRoot(props: DialogRootProps) {
  // Set the scope ID for child components to use
  // Prefer explicit scopeId, fallback to compiler-injected hydration props
  currentDialogScopeId = props.scopeId || props.__instanceId || props.__bfScope
  return <>{props.children}</>
}

// DialogTrigger classes
const dialogTriggerClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50'

// DialogOverlay base classes (aligned with shadcn/ui)
// Portal: element is moved to document.body during hydration
const dialogOverlayBaseClasses = 'fixed inset-0 z-50 bg-black/80 transition-opacity duration-200'

// DialogOverlay open/closed classes
const dialogOverlayOpenClasses = 'opacity-100'
const dialogOverlayClosedClasses = 'opacity-0 pointer-events-none'

// DialogContent base classes (aligned with shadcn/ui)
// Portal: element is moved to document.body during hydration
// Note: shadcn/ui uses 'grid', we use 'flex flex-col' for scroll behavior with fixed header/footer
const dialogContentBaseClasses = 'fixed left-[50%] top-[50%] z-50 flex flex-col w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg'

// DialogContent open/closed classes
const dialogContentOpenClasses = 'opacity-100 scale-100'
const dialogContentClosedClasses = 'opacity-0 scale-95 pointer-events-none'

// DialogHeader classes
const dialogHeaderClasses = 'flex flex-col gap-2 text-center sm:text-left'

// DialogTitle classes
const dialogTitleClasses = 'text-lg leading-none font-semibold'

// DialogDescription classes
const dialogDescriptionClasses = 'text-muted-foreground text-sm'

// DialogFooter classes
const dialogFooterClasses = 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'

// DialogClose classes
const dialogCloseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2'

/**
 * Props for DialogTrigger component.
 */
interface DialogTriggerProps {
  /** Click handler to open dialog */
  onClick?: () => void
  /** Whether disabled */
  disabled?: boolean
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Button that triggers the dialog to open.
 *
 * @param props.onClick - Click handler
 * @param props.disabled - Whether disabled (supports reactive values)
 */
function DialogTrigger(props: DialogTriggerProps) {
  return (
    <button
      data-slot="dialog-trigger"
      type="button"
      className={`${dialogTriggerClasses} ${props.class ?? ''}`}
      disabled={props.disabled ?? false}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for DialogOverlay component.
 */
interface DialogOverlayProps {
  /** Whether the dialog is open */
  open?: boolean
  /** Click handler to close dialog */
  onClick?: () => void
  /** Additional CSS classes */
  class?: string
}

/**
 * Semi-transparent overlay behind the dialog.
 * Portals to document.body to avoid z-index issues with fixed headers.
 *
 * @param props.open - Whether visible
 * @param props.onClick - Click handler to close
 */
function DialogOverlay(props: DialogOverlayProps) {
  // Move element to document.body on mount (portal behavior)
  // Uses createPortal with ownerScope for scope-based element detection
  // Skip if element is already in an SSR portal (content already at body)
  const moveToBody = (el: HTMLElement) => {
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[data-bf-scope]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }
  }

  return (
    <div
      data-slot="dialog-overlay"
      data-state={(props.open ?? false) ? 'open' : 'closed'}
      className={`${dialogOverlayBaseClasses} ${(props.open ?? false) ? dialogOverlayOpenClasses : dialogOverlayClosedClasses} ${props.class ?? ''}`}
      onClick={props.onClick}
      ref={moveToBody}
    />
  )
}

/**
 * Props for DialogContent component.
 */
interface DialogContentProps {
  /** Whether the dialog is open */
  open?: boolean
  /** Callback to close the dialog */
  onClose?: () => void
  /** Dialog content */
  children?: Child
  /** ID of the title element for aria-labelledby */
  ariaLabelledby?: string
  /** ID of the description element for aria-describedby */
  ariaDescribedby?: string
  /** Additional CSS classes */
  class?: string
}

/**
 * Main content container for the dialog.
 * Portals to document.body to avoid z-index issues with fixed headers.
 *
 * @param props.open - Whether visible
 * @param props.onClose - Close callback
 * @param props.ariaLabelledby - ID of title for accessibility
 * @param props.ariaDescribedby - ID of description for accessibility
 */
function DialogContent(props: DialogContentProps) {
  // Use object to store ref (const object can be mutated)
  const ref = { current: null as HTMLElement | null }

  // Scroll lock: prevent body scroll when dialog is open
  createEffect(() => {
    if (props.open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      onCleanup(() => {
        document.body.style.overflow = originalOverflow
      })
    }
  })

  // Focus first focusable element when dialog opens
  createEffect(() => {
    if (props.open && ref.current) {
      const focusableElements = ref.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      setTimeout(() => firstElement?.focus(), 0)
    }
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.onClose) {
      props.onClose()
      return
    }

    // Focus trap
    if (e.key === 'Tab') {
      const dialog = e.currentTarget as HTMLElement
      const focusableElements = dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === dialog) {
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

  // Move element to document.body on mount (portal behavior)
  // Uses createPortal with ownerScope for scope-based element detection
  // Skip if element is already in an SSR portal (content already at body)
  const handleMount = (el: HTMLElement) => {
    ref.current = el
    // Portal: move to body with ownerScope for find() support
    // Skip if already in SSR portal (content already at correct position)
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[data-bf-scope]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }
  }

  return (
    <div
      data-slot="dialog-content"
      data-state={(props.open ?? false) ? 'open' : 'closed'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      tabindex={-1}
      className={`${dialogContentBaseClasses} ${(props.open ?? false) ? dialogContentOpenClasses : dialogContentClosedClasses} ${props.class ?? ''}`}
      onKeyDown={handleKeyDown}
      ref={handleMount}
    >
      {props.children}
    </div>
  )
}

/**
 * Props for DialogHeader component.
 */
interface DialogHeaderProps {
  /** Header content (typically DialogTitle and DialogDescription) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Header section of the dialog.
 *
 * @param props.children - Header content
 */
function DialogHeader({ class: className = '', children }: DialogHeaderProps) {
  return (
    <div data-slot="dialog-header" className={`${dialogHeaderClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for DialogTitle component.
 */
interface DialogTitleProps {
  /** ID for aria-labelledby reference */
  id?: string
  /** Title text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Title of the dialog.
 *
 * @param props.id - ID for accessibility
 */
function DialogTitle({ class: className = '', id, children }: DialogTitleProps) {
  return (
    <h2 data-slot="dialog-title" id={id} className={`${dialogTitleClasses} ${className}`}>
      {children}
    </h2>
  )
}

/**
 * Props for DialogDescription component.
 */
interface DialogDescriptionProps {
  /** ID for aria-describedby reference */
  id?: string
  /** Description text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Description text for the dialog.
 *
 * @param props.id - ID for accessibility
 */
function DialogDescription({ class: className = '', id, children }: DialogDescriptionProps) {
  return (
    <p data-slot="dialog-description" id={id} className={`${dialogDescriptionClasses} ${className}`}>
      {children}
    </p>
  )
}

/**
 * Props for DialogFooter component.
 */
interface DialogFooterProps {
  /** Footer content (typically action buttons) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Footer section of the dialog.
 *
 * @param props.children - Footer content
 */
function DialogFooter({ class: className = '', children }: DialogFooterProps) {
  return (
    <div data-slot="dialog-footer" className={`${dialogFooterClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for DialogClose component.
 */
interface DialogCloseProps {
  /** Click handler to close dialog */
  onClick?: () => void
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Close button for the dialog.
 *
 * @param props.onClick - Close handler
 */
function DialogClose({ class: className = '', onClick, children }: DialogCloseProps) {
  return (
    <button
      data-slot="dialog-close"
      type="button"
      className={`${dialogCloseClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export {
  DialogRoot,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogCloseProps,
}
