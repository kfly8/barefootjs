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
 * - Built-in close button (X icon)
 * - Portal rendering to document.body
 * - Accessibility (role="dialog", aria-modal="true")
 *
 * @example Basic dialog with new API
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <Dialog open={open()} onOpenChange={setOpen}>
 *   <DialogTrigger>Open Dialog</DialogTrigger>
 *   <DialogPortal>
 *     <DialogOverlay />
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Dialog Title</DialogTitle>
 *         <DialogDescription>Dialog description here.</DialogDescription>
 *       </DialogHeader>
 *       <DialogFooter>
 *         <DialogClose>Cancel</DialogClose>
 *         <Button onClick={handleAction}>Confirm</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </DialogPortal>
 * </Dialog>
 * ```
 *
 * @example Legacy API (still supported)
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <>
 *   <DialogTrigger onClick={() => setOpen(true)}>Open Dialog</DialogTrigger>
 *   <DialogOverlay open={open()} onClick={() => setOpen(false)} />
 *   <DialogContent
 *     open={open()}
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

import type { Child } from '../../types'
import { XIcon } from './icon'
import { Portal } from './portal'

// DialogTrigger classes (minimal - just for accessibility)
const dialogTriggerClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:pointer-events-none disabled:opacity-50'

// DialogOverlay base classes
const dialogOverlayBaseClasses = 'fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm transition-opacity duration-normal'

// DialogOverlay open/closed classes
const dialogOverlayOpenClasses = 'opacity-100'
const dialogOverlayClosedClasses = 'opacity-0 pointer-events-none'

// DialogContent base classes
const dialogContentBaseClasses = 'fixed left-[50%] top-[50%] z-[51] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-background p-6 shadow-lg transition-all duration-normal outline-none sm:max-w-lg'

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

// Close button (X icon) classes
const dialogCloseButtonClasses = 'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'

/**
 * Props for Dialog root component.
 */
interface DialogProps {
  /** Whether the dialog is open (controlled mode) */
  open?: boolean
  /** Default open state (uncontrolled mode) */
  defaultOpen?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Dialog content (DialogTrigger, DialogPortal, etc.) */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Dialog root component that provides state context to children.
 *
 * Supports both controlled (open + onOpenChange) and uncontrolled (defaultOpen) modes.
 *
 * @param props.open - Controlled open state
 * @param props.defaultOpen - Initial open state for uncontrolled mode
 * @param props.onOpenChange - Callback when open state changes
 */
function Dialog(props: DialogProps) {
  // Note: onOpenChange is part of the API for future use when Context is available
  // Currently, state management is done via props passed to child components
  const open = () => props.open ?? props.defaultOpen ?? false
  const className = () => props.class ?? ''

  return (
    <div
      data-slot="dialog"
      data-state={open() ? 'open' : 'closed'}
      data-dialog-open={open() ? 'true' : 'false'}
      className={className()}
    >
      {props.children}
    </div>
  )
}

/**
 * Props for DialogTrigger component.
 */
interface DialogTriggerProps {
  /** Click handler to open dialog (legacy API) */
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
 * @param props.disabled - Whether disabled
 */
function DialogTrigger({
  class: className = '',
  onClick,
  disabled = false,
  children,
}: DialogTriggerProps) {
  return (
    <button
      data-slot="dialog-trigger"
      type="button"
      className={`${dialogTriggerClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/**
 * Props for DialogPortal component.
 */
interface DialogPortalProps {
  /** Portal content (DialogOverlay and DialogContent) */
  children?: Child
  /** Target container element (defaults to document.body) */
  container?: HTMLElement | null
}

/**
 * Portal wrapper for dialog overlay and content.
 * Renders children to document.body via Portal component.
 *
 * @param props.children - Overlay and content
 * @param props.container - Target container
 */
function DialogPortal(props: DialogPortalProps) {
  return (
    <Portal container={props.container}>
      {props.children}
    </Portal>
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
 *
 * @param props.open - Whether visible
 * @param props.onClick - Click handler to close
 */
function DialogOverlay(props: DialogOverlayProps) {
  const open = () => props.open ?? false
  const className = () => props.class ?? ''
  const stateClasses = () => open() ? dialogOverlayOpenClasses : dialogOverlayClosedClasses
  return (
    <div
      data-slot="dialog-overlay"
      data-state={open() ? 'open' : 'closed'}
      className={`${dialogOverlayBaseClasses} ${stateClasses()} ${className()}`}
      onClick={props.onClick}
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
  /** Whether to show the close button (X icon) */
  showCloseButton?: boolean
  /** Additional CSS classes */
  class?: string
}

/**
 * Main content container for the dialog.
 *
 * @param props.open - Whether visible
 * @param props.onClose - Close callback
 * @param props.ariaLabelledby - ID of title for accessibility
 * @param props.ariaDescribedby - ID of description for accessibility
 * @param props.showCloseButton - Whether to show X close button (default: true)
 */
function DialogContent(props: DialogContentProps) {
  const open = () => props.open ?? false
  const className = () => props.class ?? ''
  const showCloseButton = () => props.showCloseButton ?? true

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

  const handleFocusOnOpen = (el: HTMLElement) => {
    if (open() && el) {
      const focusableElements = el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      setTimeout(() => firstElement?.focus(), 0)
    }
  }

  const stateClasses = () => open() ? dialogContentOpenClasses : dialogContentClosedClasses

  return (
    <div
      data-slot="dialog-content"
      data-state={open() ? 'open' : 'closed'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      tabindex={-1}
      className={`${dialogContentBaseClasses} ${stateClasses()} ${className()}`}
      onKeyDown={handleKeyDown}
      ref={handleFocusOnOpen}
    >
      {props.children}
      {showCloseButton() && (
        <button
          data-slot="dialog-close-button"
          type="button"
          className={dialogCloseButtonClasses}
          onClick={props.onClose}
          aria-label="Close"
        >
          <XIcon size="sm" />
          <span className="sr-only">Close</span>
        </button>
      )}
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
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
export type {
  DialogProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogCloseProps,
}
