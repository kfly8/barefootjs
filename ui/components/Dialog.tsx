"use client"
/**
 * Dialog Component
 *
 * A modal dialog that displays content in a layer above the page.
 *
 * Features:
 * - Open/close state management via props
 * - ESC key to close (document-level listener)
 * - Click outside (overlay) to close
 * - Scroll lock on body (via CSS)
 * - Focus trap (Tab/Shift+Tab cycles within modal)
 * - Accessibility (role="dialog", aria-modal="true", aria-labelledby, aria-describedby)
 *
 * Design Decision: Props-based state management
 * Similar to Accordion/Tabs, this component uses props for state.
 * The parent component manages the open state with a signal.
 *
 * Note: Uses CSS-based visibility (hidden class) due to BarefootJS compiler
 * constraints. The compiler processes JSX structure but does not preserve
 * custom createEffect logic with createPortal.
 */

import { createEffect } from '@barefootjs/dom'
import type { Child } from '../types'

// --- DialogTrigger ---

export interface DialogTriggerProps {
  onClick?: () => void
  disabled?: boolean
  children?: Child
}

export function DialogTrigger({
  onClick,
  disabled = false,
  children,
}: DialogTriggerProps) {
  return (
    <button
      type="button"
      class={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
      {...(disabled ? { disabled: true } : {})}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// --- DialogOverlay ---

export interface DialogOverlayProps {
  open?: boolean
  onClick?: () => void
}

export function DialogOverlay({
  open = false,
  onClick,
}: DialogOverlayProps) {
  // Use opacity + pointer-events for fade animation (hidden class breaks transitions)
  return (
    <div
      class={`fixed inset-0 z-50 bg-black/80 transition-opacity duration-fast ${
        open ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      data-dialog-overlay
      data-dialog-overlay-open={open ? 'true' : 'false'}
      onClick={onClick}
    />
  )
}

// --- DialogContent ---

export interface DialogContentProps {
  open?: boolean
  onClose?: () => void
  children?: Child
  ariaLabelledby?: string
  ariaDescribedby?: string
}

export function DialogContent({
  open = false,
  onClose,
  children,
  ariaLabelledby,
  ariaDescribedby,
}: DialogContentProps) {
  // Handle keyboard events: ESC to close, Tab for focus trap
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose()
      return
    }

    // Focus trap: Tab/Shift+Tab cycles within dialog
    if (e.key === 'Tab') {
      const dialog = e.currentTarget as HTMLElement
      const focusableElements = dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement || document.activeElement === dialog) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }

  // Focus first focusable element when dialog opens
  const handleFocusOnOpen = (el: HTMLElement) => {
    if (open && el) {
      const focusableElements = el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => firstElement?.focus(), 0)
    }
  }

  // Use opacity + scale for fade + zoom animation (hidden class breaks transitions)
  // pointer-events-none prevents interaction when closed
  return (
    <div
      class={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg sm:rounded-lg transition-all duration-fast ${
        open
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      data-dialog-content
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      data-dialog-open={open ? 'true' : 'false'}
      ref={handleFocusOnOpen}
    >
      {children}
    </div>
  )
}

// --- DialogHeader ---

export interface DialogHeaderProps {
  children?: Child
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div class="flex flex-col space-y-1.5 text-center sm:text-left">
      {children}
    </div>
  )
}

// --- DialogTitle ---

export interface DialogTitleProps {
  id?: string
  children?: Child
}

export function DialogTitle({ id, children }: DialogTitleProps) {
  return (
    <h2
      id={id}
      class="text-lg font-semibold leading-none tracking-tight"
    >
      {children}
    </h2>
  )
}

// --- DialogDescription ---

export interface DialogDescriptionProps {
  id?: string
  children?: Child
}

export function DialogDescription({ id, children }: DialogDescriptionProps) {
  return (
    <p
      id={id}
      class="text-sm text-muted-foreground"
    >
      {children}
    </p>
  )
}

// --- DialogFooter ---

export interface DialogFooterProps {
  children?: Child
}

export function DialogFooter({ children }: DialogFooterProps) {
  return (
    <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      {children}
    </div>
  )
}

// --- DialogClose ---

export interface DialogCloseProps {
  onClick?: () => void
  children?: Child
}

export function DialogClose({ onClick, children }: DialogCloseProps) {
  return (
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
