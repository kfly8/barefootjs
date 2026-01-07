"use client"
/**
 * TooltipDemo Components
 *
 * Interactive demos for Tooltip component.
 * Used in tooltip documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { TooltipTrigger, TooltipContent } from '../ui/tooltip'

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
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
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
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent h-10 px-4 py-2"
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
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent h-10 px-4 py-2"
        >
          Right
        </button>
      </TooltipTrigger>
      <TooltipContent placement="right" open={open()} id="tooltip-right">
        Right placement
      </TooltipContent>
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
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent h-10 px-4 py-2"
        >
          Bottom
        </button>
      </TooltipTrigger>
      <TooltipContent placement="bottom" open={open()} id="tooltip-bottom">
        Bottom placement
      </TooltipContent>
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
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent h-10 px-4 py-2"
        >
          Left
        </button>
      </TooltipTrigger>
      <TooltipContent placement="left" open={open()} id="tooltip-left">
        Left placement
      </TooltipContent>
    </div>
  )
}

/**
 * Tooltip with delay demo (700ms default)
 */
export function TooltipDelayDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-delay"
        delayDuration={700}
      >
        <span class="underline decoration-dotted cursor-help">
          Hover me (700ms delay)
        </span>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-delay">
        This tooltip has a 700ms delay
      </TooltipContent>
    </div>
  )
}

/**
 * Tooltip with no delay (immediate)
 */
export function TooltipNoDelayDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-no-delay"
        delayDuration={0}
      >
        <span class="underline decoration-dotted cursor-help">
          Hover me (no delay)
        </span>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-no-delay">
        This tooltip appears immediately
      </TooltipContent>
    </div>
  )
}
