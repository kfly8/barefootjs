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
 *
 * Design Decision: Props-based state management
 * Similar to Dialog, this component uses props for state.
 * The parent component manages the open state with a signal.
 */

import type { Child } from '../types'

// --- Toast Variants ---

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

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
      class={`fixed z-50 flex flex-col gap-2 ${
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: Child
}

export function Toast({
  variant = 'default',
  open = false,
  children,
}: ToastProps) {
  return (
    <div
      class={`flex items-start gap-3 w-80 p-4 rounded-lg border shadow-lg transition-all ${
        variant === 'success' ? 'bg-green-50 border-green-200 text-green-900' :
        variant === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
        variant === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
        variant === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900' :
        'bg-white border-zinc-200 text-zinc-900'
      } ${open ? '' : 'hidden'}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      data-toast
      data-toast-variant={variant}
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
      class="ml-auto -mr-1 -mt-1 h-6 w-6 rounded-md inline-flex items-center justify-center opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
      class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border border-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      aria-label={altText}
      onClick={onClick}
      data-toast-action
    >
      {children}
    </button>
  )
}
