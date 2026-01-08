"use client"
/**
 * Tooltip Component
 *
 * A popup that displays contextual information on hover or focus.
 *
 * Features:
 * - Internal open/close state management
 * - Shows on hover (mouseenter/mouseleave)
 * - Shows on focus (for keyboard accessibility)
 * - Configurable placement (top, right, bottom, left)
 * - Accessibility (role="tooltip", aria-describedby)
 * - Configurable delay
 *
 * Design Decision: Single component with internal state
 * The component manages its own open state internally via createSignal.
 * This simplifies usage and ensures correct client-side hydration.
 */

import { createSignal } from '@barefootjs/dom'
import type { Child } from '../../types'

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

export interface TooltipProps {
  /** Tooltip content text */
  content: string
  /** Trigger element */
  children?: Child
  /** Placement of tooltip relative to trigger */
  placement?: TooltipPlacement
  /** Delay in ms before showing tooltip on hover (default: 0) */
  delayDuration?: number
  /** Delay in ms before hiding tooltip after mouse leave (default: 0) */
  closeDelay?: number
  /** ID for accessibility */
  id?: string
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delayDuration = 0,
  closeDelay = 0,
  id,
}: TooltipProps) {
  const [open, setOpen] = createSignal(false)
  let openTimerId: number | undefined = undefined
  let closeTimerId: number | undefined = undefined

  const handleMouseEnter = () => {
    if (closeTimerId !== undefined) {
      clearTimeout(closeTimerId)
      closeTimerId = undefined
    }

    if (delayDuration > 0) {
      openTimerId = setTimeout(() => {
        setOpen(true)
        openTimerId = undefined
      }, delayDuration) as unknown as number
    } else {
      setOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (openTimerId !== undefined) {
      clearTimeout(openTimerId)
      openTimerId = undefined
    }

    if (closeDelay > 0) {
      closeTimerId = setTimeout(() => {
        setOpen(false)
        closeTimerId = undefined
      }, closeDelay) as unknown as number
    } else {
      setOpen(false)
    }
  }

  const handleFocus = () => setOpen(true)
  const handleBlur = () => setOpen(false)

  // Placement CSS classes
  const placementClasses: Record<TooltipPlacement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  // Arrow CSS classes
  const arrowClasses: Record<TooltipPlacement, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-t-transparent border-b-transparent border-r-transparent',
  }

  const placementClass = placementClasses[placement]
  const arrowClass = arrowClasses[placement]

  return (
    <span
      class="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={id}
      data-tooltip-trigger
    >
      <span>{children}</span>
      <div
        class={`absolute z-50 ${placementClass}`}
        role="tooltip"
        id={id}
        data-tooltip-content
        data-tooltip-open={open()}
      >
        <div class="bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
          {content}
        </div>
        <span
          class={`absolute w-0 h-0 border-4 ${arrowClass}`}
          aria-hidden="true"
        />
      </div>
    </span>
  )
}

// Keep old exports for backwards compatibility (deprecated)
export interface TooltipTriggerProps {
  ariaDescribedby?: string
  children?: Child
  delayDuration?: number
  closeDelay?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

export function TooltipTrigger({
  ariaDescribedby,
  children,
}: TooltipTriggerProps) {
  return (
    <span
      class="inline-block"
      aria-describedby={ariaDescribedby}
      data-tooltip-trigger
    >
      {children}
    </span>
  )
}

export interface TooltipContentProps {
  placement?: TooltipPlacement
  open?: boolean
  id?: string
  children?: Child
}

export function TooltipContent({
  placement = 'top',
  open = false,
  id,
  children,
}: TooltipContentProps) {
  const placementClasses: Record<TooltipPlacement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  const arrowClasses: Record<TooltipPlacement, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-t-transparent border-b-transparent border-r-transparent',
  }

  const placementClass = placementClasses[placement]
  const arrowClass = arrowClasses[placement]

  return (
    <div
      class={`absolute z-50 ${placementClass}`}
      role="tooltip"
      id={id}
      data-tooltip-content
      data-tooltip-open={open ? 'true' : 'false'}
    >
      <div class="bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
        {children}
      </div>
      <span
        class={`absolute w-0 h-0 border-4 ${arrowClass}`}
        aria-hidden="true"
      />
    </div>
  )
}
