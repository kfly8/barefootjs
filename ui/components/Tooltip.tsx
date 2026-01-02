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
}

export function TooltipTrigger({
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ariaDescribedby,
  children,
}: TooltipTriggerProps) {
  return (
    <span
      class="inline-block"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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

export interface TooltipContentProps {
  open?: boolean
  id?: string
  children?: Child
}

// Tooltip positioned at top (default)
export function TooltipContent({
  open = false,
  id,
  children,
}: TooltipContentProps) {
  return (
    <div
      class={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 ${open ? '' : 'hidden'}`}
      role="tooltip"
      id={id}
      data-tooltip-content
      data-tooltip-open={open ? 'true' : 'false'}
    >
      <div class="bg-zinc-900 text-zinc-50 text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
        {children}
      </div>
      <span
        class="absolute w-0 h-0 border-4 top-full left-1/2 -translate-x-1/2 border-t-zinc-900 border-l-transparent border-r-transparent border-b-transparent"
        aria-hidden="true"
      />
    </div>
  )
}

// Tooltip positioned at right
export function TooltipContentRight({
  open = false,
  id,
  children,
}: TooltipContentProps) {
  return (
    <div
      class={`absolute z-50 left-full top-1/2 -translate-y-1/2 ml-2 ${open ? '' : 'hidden'}`}
      role="tooltip"
      id={id}
      data-tooltip-content
      data-tooltip-open={open ? 'true' : 'false'}
    >
      <div class="bg-zinc-900 text-zinc-50 text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
        {children}
      </div>
      <span
        class="absolute w-0 h-0 border-4 right-full top-1/2 -translate-y-1/2 border-r-zinc-900 border-t-transparent border-b-transparent border-l-transparent"
        aria-hidden="true"
      />
    </div>
  )
}

// Tooltip positioned at bottom
export function TooltipContentBottom({
  open = false,
  id,
  children,
}: TooltipContentProps) {
  return (
    <div
      class={`absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 ${open ? '' : 'hidden'}`}
      role="tooltip"
      id={id}
      data-tooltip-content
      data-tooltip-open={open ? 'true' : 'false'}
    >
      <div class="bg-zinc-900 text-zinc-50 text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
        {children}
      </div>
      <span
        class="absolute w-0 h-0 border-4 bottom-full left-1/2 -translate-x-1/2 border-b-zinc-900 border-l-transparent border-r-transparent border-t-transparent"
        aria-hidden="true"
      />
    </div>
  )
}

// Tooltip positioned at left
export function TooltipContentLeft({
  open = false,
  id,
  children,
}: TooltipContentProps) {
  return (
    <div
      class={`absolute z-50 right-full top-1/2 -translate-y-1/2 mr-2 ${open ? '' : 'hidden'}`}
      role="tooltip"
      id={id}
      data-tooltip-content
      data-tooltip-open={open ? 'true' : 'false'}
    >
      <div class="bg-zinc-900 text-zinc-50 text-sm px-3 py-1.5 rounded-md shadow-md whitespace-nowrap">
        {children}
      </div>
      <span
        class="absolute w-0 h-0 border-4 left-full top-1/2 -translate-y-1/2 border-l-zinc-900 border-t-transparent border-b-transparent border-r-transparent"
        aria-hidden="true"
      />
    </div>
  )
}
