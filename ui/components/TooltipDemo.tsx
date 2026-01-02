"use client"
/**
 * TooltipDemo Components
 *
 * Interactive demos for Tooltip component.
 * Used in tooltip documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  TooltipTrigger,
  TooltipContent,
  TooltipContentRight,
  TooltipContentBottom,
  TooltipContentLeft,
} from './Tooltip'

/**
 * Basic tooltip demo
 */
export function TooltipBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-basic"
      >
        <span class="underline decoration-dotted cursor-help">
          Hover me
        </span>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-basic">
        This is a tooltip
      </TooltipContent>
    </div>
  )
}

/**
 * Tooltip with button (focus support)
 */
export function TooltipButtonDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        ariaDescribedby="tooltip-button"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 h-10 px-4 py-2"
        >
          Hover or Focus
        </button>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-button">
        Keyboard accessible tooltip
      </TooltipContent>
    </div>
  )
}

/**
 * Tooltip placement demo - Top
 */
export function TooltipTopDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-top"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 h-10 px-4 py-2"
        >
          Top
        </button>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-top">
        Top placement
      </TooltipContent>
    </div>
  )
}

/**
 * Tooltip placement demo - Right
 */
export function TooltipRightDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-right"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 h-10 px-4 py-2"
        >
          Right
        </button>
      </TooltipTrigger>
      <TooltipContentRight open={open()} id="tooltip-right">
        Right placement
      </TooltipContentRight>
    </div>
  )
}

/**
 * Tooltip placement demo - Bottom
 */
export function TooltipBottomDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-bottom"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 h-10 px-4 py-2"
        >
          Bottom
        </button>
      </TooltipTrigger>
      <TooltipContentBottom open={open()} id="tooltip-bottom">
        Bottom placement
      </TooltipContentBottom>
    </div>
  )
}

/**
 * Tooltip placement demo - Left
 */
export function TooltipLeftDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-left"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-zinc-200 bg-white hover:bg-zinc-100 h-10 px-4 py-2"
        >
          Left
        </button>
      </TooltipTrigger>
      <TooltipContentLeft open={open()} id="tooltip-left">
        Left placement
      </TooltipContentLeft>
    </div>
  )
}
