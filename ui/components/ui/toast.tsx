"use client"

/**
 * Toast Components
 *
 * A non-blocking notification component that displays brief messages.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Features:
 * - Variants: default, success, error, warning, info
 * - Auto-dismiss with configurable duration
 * - Manual dismiss via close button
 * - Position options: top-right, top-left, bottom-right, bottom-left
 * - Accessibility: role="status", aria-live="polite"
 *
 * @example Basic toast
 * ```tsx
 * const [open, setOpen] = useState(false)
 *
 * <ToastProvider position="bottom-right">
 *   <Toast variant="success" open={open}>
 *     <div className="flex-1">
 *       <ToastTitle>Success!</ToastTitle>
 *       <ToastDescription>Your changes have been saved.</ToastDescription>
 *     </div>
 *     <ToastClose onClick={() => setOpen(false)} />
 *   </Toast>
 * </ToastProvider>
 * ```
 *
 * @example Toast with action
 * ```tsx
 * <Toast variant="default" open={open}>
 *   <div className="flex-1">
 *     <ToastTitle>Undo?</ToastTitle>
 *     <ToastDescription>Item was deleted.</ToastDescription>
 *   </div>
 *   <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>
 *   <ToastClose onClick={() => setOpen(false)} />
 * </Toast>
 * ```
 */

import type { Child } from '../../types'
import { XIcon } from './icon'

// Type definitions
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'
type ToastAnimationState = 'entering' | 'visible' | 'exiting' | 'hidden'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

// ToastProvider position classes
const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

// ToastProvider base classes
const toastProviderClasses = 'fixed z-50 flex flex-col gap-2 pointer-events-none'

// Toast base classes
const toastBaseClasses = 'items-start gap-3 w-80 p-4 rounded-lg border shadow-lg pointer-events-auto transition-all duration-slow ease-out'

// Toast variant classes
const toastVariantClasses: Record<ToastVariant, string> = {
  default: 'bg-background border-border text-foreground',
  success: 'bg-success/10 border-success text-foreground',
  error: 'bg-destructive/10 border-destructive text-foreground',
  warning: 'bg-warning/10 border-warning text-foreground',
  info: 'bg-info/10 border-info text-foreground',
}

// Toast animation classes
const toastAnimationClasses: Record<ToastAnimationState, string> = {
  entering: 'flex translate-x-full opacity-0',
  visible: 'flex translate-x-0 opacity-100',
  exiting: 'flex translate-x-full opacity-0',
  hidden: 'hidden',
}

// ToastTitle classes
const toastTitleClasses = 'text-sm font-semibold'

// ToastDescription classes
const toastDescriptionClasses = 'text-sm opacity-90'

// ToastClose classes
const toastCloseClasses = 'ml-auto -mr-1 -mt-1 h-6 w-6 rounded-md inline-flex items-center justify-center opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring'

// ToastAction classes
const toastActionClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border border-current opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring'

/**
 * Props for ToastProvider component.
 */
interface ToastProviderProps {
  /**
   * Position of the toast container.
   * @default 'bottom-right'
   */
  position?: ToastPosition
  /** Toast components */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Container for toast notifications.
 *
 * @param props.position - Position of the container
 */
function ToastProvider({
  class: className = '',
  position = 'bottom-right',
  children,
}: ToastProviderProps) {
  return (
    <div
      data-slot="toast-provider"
      className={`${toastProviderClasses} ${positionClasses[position]} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Props for Toast component.
 */
interface ToastProps {
  /**
   * Visual variant of the toast.
   * @default 'default'
   */
  variant?: ToastVariant
  /**
   * Whether the toast is visible.
   * @default false
   */
  open?: boolean
  /** Animation state for enter/exit animations */
  animationState?: ToastAnimationState
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Toast content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Toast notification component.
 *
 * @param props.variant - Visual variant
 *   - `'default'` - Neutral styling
 *   - `'success'` - Success message (green)
 *   - `'error'` - Error message (red)
 *   - `'warning'` - Warning message (yellow)
 *   - `'info'` - Informational message (blue)
 * @param props.open - Whether visible
 * @param props.animationState - Current animation state
 */
function Toast({
  class: className = '',
  variant = 'default',
  open = false,
  animationState,
  children,
}: ToastProps) {
  // Determine the effective animation state
  const effectiveState = animationState ?? (open ? 'visible' : 'hidden')

  return (
    <div
      data-slot="toast"
      data-variant={variant}
      data-state={effectiveState}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`${toastAnimationClasses[effectiveState]} ${toastBaseClasses} ${toastVariantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Props for ToastTitle component.
 */
interface ToastTitleProps {
  /** Title text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Title text for the toast.
 */
function ToastTitle({ class: className = '', children }: ToastTitleProps) {
  return (
    <div data-slot="toast-title" className={`${toastTitleClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for ToastDescription component.
 */
interface ToastDescriptionProps {
  /** Description text */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Description text for the toast.
 */
function ToastDescription({ class: className = '', children }: ToastDescriptionProps) {
  return (
    <div data-slot="toast-description" className={`${toastDescriptionClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Props for ToastClose component.
 */
interface ToastCloseProps {
  /** Click handler to dismiss the toast */
  onClick?: () => void
  /** Additional CSS classes */
  class?: string
}

/**
 * Close button for the toast.
 *
 * @param props.onClick - Click handler
 */
function ToastClose({ class: className = '', onClick }: ToastCloseProps) {
  return (
    <button
      data-slot="toast-close"
      type="button"
      aria-label="Close"
      className={`${toastCloseClasses} ${className}`}
      onClick={onClick}
    >
      <XIcon size="sm" className="pointer-events-none" />
    </button>
  )
}

/**
 * Props for ToastAction component.
 */
interface ToastActionProps {
  /** Accessible text describing the action */
  altText: string
  /** Click handler */
  onClick?: () => void
  /** Button content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Action button for the toast.
 *
 * @param props.altText - Accessible description
 * @param props.onClick - Click handler
 */
function ToastAction({ class: className = '', altText, onClick, children }: ToastActionProps) {
  return (
    <button
      data-slot="toast-action"
      type="button"
      aria-label={altText}
      className={`${toastActionClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction }
export type { ToastVariant, ToastAnimationState, ToastPosition, ToastProviderProps, ToastProps, ToastTitleProps, ToastDescriptionProps, ToastCloseProps, ToastActionProps }
