"use client"

/**
 * Toast Components
 *
 * A non-blocking notification component that displays brief messages.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * State management uses createContext/useContext for parent-child communication.
 * Toast root manages open state and animation, children consume via context.
 *
 * Features:
 * - Variants: default, success, error, warning, info
 * - Auto-dismiss with configurable duration
 * - Manual dismiss via close button or context
 * - Portal rendering to document.body
 * - Reactive enter/exit animations via createEffect
 * - Position options: top-right, top-left, bottom-right, bottom-left
 * - Accessibility: role="status", aria-live="polite"
 *
 * @example Basic toast
 * ```tsx
 * const [open, setOpen] = createSignal(false)
 *
 * <ToastProvider position="bottom-right">
 *   <Toast open={open()} onOpenChange={setOpen}>
 *     <div className="flex-1">
 *       <ToastTitle>Success!</ToastTitle>
 *       <ToastDescription>Your changes have been saved.</ToastDescription>
 *     </div>
 *     <ToastClose />
 *   </Toast>
 * </ToastProvider>
 * ```
 *
 * @example Toast with action
 * ```tsx
 * <Toast open={open()} onOpenChange={setOpen}>
 *   <div className="flex-1">
 *     <ToastTitle>Item deleted</ToastTitle>
 *     <ToastDescription>The item has been removed.</ToastDescription>
 *   </div>
 *   <ToastAction altText="Undo" onClick={handleUndo}>Undo</ToastAction>
 *   <ToastClose />
 * </Toast>
 * ```
 */

import { createContext, useContext, createEffect, createPortal, isSSRPortal } from '@barefootjs/dom'
import type { Child } from '../../types'
import { XIcon } from './icon'

// Type definitions
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

// Context for Toast -> children state sharing
interface ToastContextValue {
  dismiss: () => void
}

const ToastContext = createContext<ToastContextValue>()

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

// Toast animation classes by data-state
const toastStateClasses = {
  entering: 'flex translate-x-full opacity-0',
  visible: 'flex translate-x-0 opacity-100',
  exiting: 'flex translate-x-full opacity-0',
  hidden: 'hidden',
}

// Animation duration in ms (must match CSS transition-duration)
const ANIMATION_DURATION = 300

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
 * Portals to document.body to avoid z-index issues.
 *
 * @param props.position - Position of the container
 */
function ToastProvider(props: ToastProviderProps) {
  const position = props.position ?? 'bottom-right'

  const handleMount = (el: HTMLElement) => {
    // Portal to body
    if (el && el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[data-bf-scope]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }
  }

  return (
    <div
      data-slot="toast-provider"
      className={`${toastProviderClasses} ${positionClasses[position]} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
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
  /** Callback when open state changes (e.g., on auto-dismiss) */
  onOpenChange?: (open: boolean) => void
  /**
   * Auto-dismiss duration in ms. Set to 0 to disable auto-dismiss.
   * @default 5000
   */
  duration?: number
  /** Toast content */
  children?: Child
  /** Additional CSS classes */
  class?: string
}

/**
 * Toast notification component.
 * Manages enter/exit animations reactively via createEffect.
 *
 * @param props.variant - Visual variant
 * @param props.open - Whether visible
 * @param props.onOpenChange - Called on auto-dismiss or close
 * @param props.duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 */
function Toast(props: ToastProps) {
  const variant = props.variant ?? 'default'
  const className = props.class ?? ''

  const dismiss = () => {
    props.onOpenChange?.(false)
  }

  const handleMount = (el: HTMLElement) => {
    let dismissTimer: ReturnType<typeof setTimeout> | null = null
    let exitTimer: ReturnType<typeof setTimeout> | null = null

    createEffect(() => {
      const isOpen = props.open ?? false
      const duration = props.duration ?? 5000

      // Clear existing timers
      if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
      if (exitTimer) { clearTimeout(exitTimer); exitTimer = null }

      if (isOpen) {
        // Entering state
        el.dataset.state = 'entering'
        el.className = `${toastStateClasses.entering} ${toastBaseClasses} ${toastVariantClasses[variant]} ${className}`

        // Transition to visible on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.dataset.state = 'visible'
            el.className = `${toastStateClasses.visible} ${toastBaseClasses} ${toastVariantClasses[variant]} ${className}`
          })
        })

        // Auto-dismiss timer
        if (duration > 0) {
          dismissTimer = setTimeout(() => {
            dismiss()
          }, duration)
        }
      } else {
        const currentState = el.dataset.state
        if (currentState === 'visible' || currentState === 'entering') {
          // Exiting state
          el.dataset.state = 'exiting'
          el.className = `${toastStateClasses.exiting} ${toastBaseClasses} ${toastVariantClasses[variant]} ${className}`

          exitTimer = setTimeout(() => {
            el.dataset.state = 'hidden'
            el.className = `${toastStateClasses.hidden} ${toastBaseClasses} ${toastVariantClasses[variant]} ${className}`
          }, ANIMATION_DURATION)
        }
        // If already hidden, stay hidden
      }
    })
  }

  return (
    <ToastContext.Provider value={{ dismiss }}>
      <div
        data-slot="toast"
        data-variant={variant}
        data-state="hidden"
        role={variant === 'error' ? 'alert' : 'status'}
        aria-live={variant === 'error' ? 'assertive' : 'polite'}
        className={`${toastStateClasses.hidden} ${toastBaseClasses} ${toastVariantClasses[variant]} ${className}`}
        ref={handleMount}
      >
        {props.children}
      </div>
    </ToastContext.Provider>
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
  /** Additional click handler (called before dismiss) */
  onClick?: () => void
  /** Additional CSS classes */
  class?: string
}

/**
 * Close button for the toast.
 * Uses ToastContext to auto-dismiss on click.
 *
 * @param props.onClick - Additional click handler
 */
function ToastClose(props: ToastCloseProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(ToastContext)

    el.addEventListener('click', () => {
      props.onClick?.()
      ctx.dismiss()
    })
  }

  return (
    <button
      data-slot="toast-close"
      type="button"
      aria-label="Close"
      className={`${toastCloseClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      <XIcon size="sm" class="pointer-events-none" />
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
 * Uses ToastContext to auto-dismiss after action.
 *
 * @param props.altText - Accessible description
 * @param props.onClick - Click handler
 */
function ToastAction(props: ToastActionProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(ToastContext)

    el.addEventListener('click', () => {
      props.onClick?.()
      ctx.dismiss()
    })
  }

  return (
    <button
      data-slot="toast-action"
      type="button"
      aria-label={props.altText}
      className={`${toastActionClasses} ${props.class ?? ''}`}
      ref={handleMount}
    >
      {props.children}
    </button>
  )
}

export { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction }
export type { ToastVariant, ToastPosition, ToastProviderProps, ToastProps, ToastTitleProps, ToastDescriptionProps, ToastCloseProps, ToastActionProps }
