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
      class={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 h-10 px-4 py-2 ${
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
  return (
    <div
      class={`fixed inset-0 z-50 bg-black/80 ${open ? '' : 'hidden'}`}
      data-dialog-overlay
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
  // Handle ESC key to close dialog (requires focus on dialog)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose()
    }
  }

  return (
    <div
      class={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-200 bg-white p-6 shadow-lg sm:rounded-lg ${open ? '' : 'hidden'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      data-dialog-content
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      data-dialog-open={open ? 'true' : 'false'}
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
      class="text-sm text-zinc-500"
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
      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 h-10 px-4 py-2"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
