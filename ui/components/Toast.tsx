"use client"
/**
 * Toast Component
 *
 * A non-blocking notification component that displays brief messages to users.
 *
 * Features:
 * - Variants: default, success, error, warning, info
 * - Auto-dismiss with configurable duration
 * - Manual dismiss via close button
 * - Multiple toasts can be stacked
 * - Position options: top-right, top-left, bottom-right, bottom-left
 * - Accessibility: role="status", aria-live="polite"
 * - Slide-in/slide-out animations with fade effect
 *
 * Design Decision: Props-based state management
 * Similar to Dialog, this component uses props for state.
 * The parent component manages the open state with a signal.
 *
 * Animation States:
 * - 'entering': Toast is sliding in from right
 * - 'visible': Toast is fully visible
 * - 'exiting': Toast is sliding out to right
 * - 'hidden': Toast is not rendered (display: none)
 */

import type { Child } from '../types'

// --- Toast Variants ---

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

/** Animation states for the toast */
export type ToastAnimationState = 'entering' | 'visible' | 'exiting' | 'hidden'

// --- ToastProvider ---

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export interface ToastProviderProps {
  position?: ToastPosition
  children?: Child
}

export function ToastProvider({
  position = 'bottom-right',
  children,
}: ToastProviderProps) {
  return (
    <div
      class={`fixed z-50 flex flex-col gap-2 pointer-events-none ${
        position === 'top-right' ? 'top-4 right-4' :
        position === 'top-left' ? 'top-4 left-4' :
        position === 'bottom-left' ? 'bottom-4 left-4' :
        'bottom-4 right-4'
      }`}
      data-toast-provider
    >
      {children}
    </div>
  )
}

// --- Toast ---

export interface ToastProps {
  variant?: ToastVariant
  /** Controls visibility of the toast */
  open?: boolean
  /** Animation state for enter/exit animations */
  animationState?: ToastAnimationState
  onOpenChange?: (open: boolean) => void
  children?: Child
}

export function Toast({
  variant = 'default',
  open = false,
  animationState,
  children,
}: ToastProps) {
  // Note: animationState is passed as a reactive accessor from the parent.
  // All expressions using animationState must be inline in JSX for reactivity.
  //
  // Animation class mapping:
  // - 'entering': translated right and transparent (for enter animation start)
  // - 'visible': in position and visible
  // - 'exiting': translated right and transparent (for exit animation)
  // - 'hidden': not displayed

  return (
    <div
      class={`${
        (animationState ?? (open ? 'visible' : 'hidden')) === 'entering' ? 'flex translate-x-full opacity-0' :
        (animationState ?? (open ? 'visible' : 'hidden')) === 'visible' ? 'flex translate-x-0 opacity-100' :
        (animationState ?? (open ? 'visible' : 'hidden')) === 'exiting' ? 'flex translate-x-full opacity-0' :
        'hidden'
      } items-start gap-3 w-80 p-4 rounded-lg border shadow-lg pointer-events-auto transition-all duration-slow ease-out ${
        variant === 'success' ? 'bg-success/10 border-success text-foreground' :
        variant === 'error' ? 'bg-destructive/10 border-destructive text-foreground' :
        variant === 'warning' ? 'bg-warning/10 border-warning text-foreground' :
        variant === 'info' ? 'bg-info/10 border-info text-foreground' :
        'bg-background border-border text-foreground'
      }`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      data-toast
      data-toast-variant={variant}
      data-toast-animation-state={animationState ?? (open ? 'visible' : 'hidden')}
    >
      {children}
    </div>
  )
}

// --- ToastTitle ---

export interface ToastTitleProps {
  children?: Child
}

export function ToastTitle({ children }: ToastTitleProps) {
  return (
    <div class="text-sm font-semibold" data-toast-title>
      {children}
    </div>
  )
}

// --- ToastDescription ---

export interface ToastDescriptionProps {
  children?: Child
}

export function ToastDescription({ children }: ToastDescriptionProps) {
  return (
    <div class="text-sm opacity-90" data-toast-description>
      {children}
    </div>
  )
}

// --- ToastClose ---

export interface ToastCloseProps {
  onClick?: () => void
}

export function ToastClose({ onClick }: ToastCloseProps) {
  return (
    <button
      type="button"
      class="ml-auto -mr-1 -mt-1 h-6 w-6 rounded-md inline-flex items-center justify-center opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Close"
      onClick={onClick}
      data-toast-close
    >
      <svg
        class="h-4 w-4 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}

// --- ToastAction ---

export interface ToastActionProps {
  altText: string
  onClick?: () => void
  children?: Child
}

export function ToastAction({ altText, onClick, children }: ToastActionProps) {
  return (
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border border-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label={altText}
      onClick={onClick}
      data-toast-action
    >
      {children}
    </button>
  )
}
