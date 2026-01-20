"use client"

/**
 * Tooltip Component
 *
 * A popup that displays contextual information on hover or focus.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Features:
 * - Shows on hover with configurable delay
 * - Shows on focus for keyboard accessibility
 * - Configurable placement (top, right, bottom, left)
 * - Accessibility (role="tooltip", aria-describedby)
 *
 * @example Basic tooltip
 * ```tsx
 * <Tooltip content="This is helpful information">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 *
 * @example With placement
 * ```tsx
 * <Tooltip content="Tooltip on the right" placement="right">
 *   <span>Hover me</span>
 * </Tooltip>
 * ```
 *
 * @example With delay
 * ```tsx
 * <Tooltip content="Delayed tooltip" delayDuration={500} closeDelay={200}>
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */

import { createSignal } from '@barefootjs/dom'
import type { Child } from '../../types'

// Type definitions
type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

// Tooltip container classes
const tooltipContainerClasses = 'relative inline-block'

// Tooltip content classes
const tooltipContentClasses = 'bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap'

// Placement classes
const placementClasses: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
}

// Arrow classes
const arrowClasses: Record<TooltipPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-l-transparent border-r-transparent border-b-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-t-transparent border-b-transparent border-l-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-t-transparent border-b-transparent border-r-transparent',
}

/**
 * Props for Tooltip component.
 */
interface TooltipProps {
  /** Tooltip content text */
  content: string
  /** Trigger element */
  children?: Child
  /**
   * Placement of tooltip relative to trigger.
   * @default 'top'
   */
  placement?: TooltipPlacement
  /**
   * Delay in ms before showing tooltip on hover.
   * @default 0
   */
  delayDuration?: number
  /**
   * Delay in ms before hiding tooltip after mouse leave.
   * @default 0
   */
  closeDelay?: number
  /** ID for accessibility (aria-describedby) */
  id?: string
}

/**
 * Tooltip component that displays on hover/focus.
 *
 * @param props.content - Tooltip text
 * @param props.placement - Position relative to trigger
 * @param props.delayDuration - Delay before showing
 * @param props.closeDelay - Delay before hiding
 * @param props.id - ID for accessibility
 */
function Tooltip({
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

  return (
    <span
      data-slot="tooltip"
      className={tooltipContainerClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={id}
    >
      <span>{children}</span>
      <div
        data-slot="tooltip-content"
        data-state={open() ? 'open' : 'closed'}
        className={`absolute z-50 ${placementClasses[placement]}`}
        role="tooltip"
        id={id}
      >
        <div className={tooltipContentClasses}>
          {content}
        </div>
        <span
          className={`absolute w-0 h-0 border-4 ${arrowClasses[placement]}`}
          aria-hidden="true"
        />
      </div>
    </span>
  )
}

// -----------------------------------------------------------
// Deprecated exports for backwards compatibility
// -----------------------------------------------------------

/**
 * Props for TooltipTrigger component.
 * @deprecated Use `Tooltip` component instead which handles state internally.
 */
interface TooltipTriggerProps {
  ariaDescribedby?: string
  children?: Child
  delayDuration?: number
  closeDelay?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

/**
 * Tooltip trigger wrapper.
 * @deprecated Use `Tooltip` component instead which handles state internally.
 */
function TooltipTrigger({
  ariaDescribedby,
  children,
}: TooltipTriggerProps) {
  return (
    <span
      className="inline-block"
      aria-describedby={ariaDescribedby}
      data-tooltip-trigger
    >
      {children}
    </span>
  )
}

/**
 * Props for TooltipContent component.
 * @deprecated Use `Tooltip` component instead which handles state internally.
 */
interface TooltipContentProps {
  placement?: TooltipPlacement
  open?: boolean
  id?: string
  children?: Child
}

/**
 * Tooltip content container.
 * @deprecated Use `Tooltip` component instead which handles state internally.
 */
function TooltipContent({
  placement = 'top',
  open = false,
  id,
  children,
}: TooltipContentProps) {
  return (
    <div
      className={`absolute z-50 ${placementClasses[placement]}`}
      role="tooltip"
      id={id}
      data-tooltip-content
      data-tooltip-open={open ? 'true' : 'false'}
    >
      <div className={tooltipContentClasses}>
        {children}
      </div>
      <span
        className={`absolute w-0 h-0 border-4 ${arrowClasses[placement]}`}
        aria-hidden="true"
      />
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent }
export type { TooltipPlacement, TooltipProps, TooltipTriggerProps, TooltipContentProps }
