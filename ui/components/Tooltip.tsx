"use client"
/**
 * Tooltip Component
 *
 * A popup that displays contextual information on hover or focus.
 *
 * Features:
 * - Open/close state management via props
 * - Shows on hover (mouseenter/mouseleave)
 * - Shows on focus (for keyboard accessibility)
 * - Configurable placement (top, right, bottom, left)
 * - Accessibility (role="tooltip", aria-describedby)
 *
 * Design Decision: Props-based state management
 * Similar to Dialog/Accordion, this component uses props for state.
 * The parent component manages the open state with a signal.
 *
 * Note: Uses CSS-based visibility (hidden class) due to BarefootJS compiler
 * constraints. The compiler processes JSX structure but does not preserve
 * custom createEffect logic.
 */

import type { Child } from '../types'

// --- TooltipTrigger ---

export interface TooltipTriggerProps {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  ariaDescribedby?: string
  children?: Child
  /** Delay in ms before showing tooltip on hover (default: 700) */
  delayDuration?: number
  /** Delay in ms before hiding tooltip after mouse leave (default: 0) */
  closeDelay?: number
}

export function TooltipTrigger({
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ariaDescribedby,
  children,
  delayDuration = 700,
  closeDelay = 0,
}: TooltipTriggerProps) {
  let openTimerId: number | undefined = undefined
  let closeTimerId: number | undefined = undefined

  const handleMouseEnter = () => {
    // Clear any pending close timer
    if (closeTimerId !== undefined) {
      clearTimeout(closeTimerId)
      closeTimerId = undefined
    }

    // Set open timer with delay
    if (delayDuration > 0) {
      openTimerId = setTimeout(() => {
        onMouseEnter?.()
        openTimerId = undefined
      }, delayDuration) as unknown as number
    } else {
      onMouseEnter?.()
    }
  }

  const handleMouseLeave = () => {
    // Clear any pending open timer
    if (openTimerId !== undefined) {
      clearTimeout(openTimerId)
      openTimerId = undefined
    }

    // Set close timer with delay
    if (closeDelay > 0) {
      closeTimerId = setTimeout(() => {
        onMouseLeave?.()
        closeTimerId = undefined
      }, closeDelay) as unknown as number
    } else {
      onMouseLeave?.()
    }
  }

  return (
    <span
      class="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-describedby={ariaDescribedby}
      data-tooltip-trigger
    >
      {children}
    </span>
  )
}

// --- TooltipContent ---

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

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
  // Placement CSS classes for tooltip container position
  const placementClasses: Record<TooltipPlacement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  // Arrow CSS classes based on placement
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
      class={`absolute z-50 ${placementClass} ${open ? '' : 'hidden'}`}
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
