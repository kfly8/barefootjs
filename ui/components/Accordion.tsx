"use client"
/**
 * Accordion Component
 *
 * A vertically stacked set of interactive headings that each reveal
 * an associated section of content.
 * Inspired by shadcn/ui Accordion component.
 *
 * Design Decision: "Only one open at a time" pattern
 * This component uses a simple approach where each AccordionItem manages
 * its own open/close state. For "only one open at a time" behavior,
 * the parent component should:
 * 1. Use a single signal to track the currently open item
 * 2. Pass `open` and `onOpenChange` props to control each item
 *
 * This approach avoids the need for Context API while keeping
 * the component composable and flexible.
 */

import type { Child } from '../types'

// AccordionItem - Individual collapsible section
export interface AccordionItemProps {
  value: string
  open?: boolean
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
  children?: Child
}

export function AccordionItem({
  value,
  open = false,
  disabled = false,
  onOpenChange,
  children,
}: AccordionItemProps) {
  return (
    <div
      class="border-b border-zinc-200"
      data-state={open ? 'open' : 'closed'}
      data-value={value}
    >
      {children}
    </div>
  )
}

// AccordionTrigger - The clickable header
export interface AccordionTriggerProps {
  open?: boolean
  disabled?: boolean
  onClick?: () => void
  children?: Child
}

export function AccordionTrigger({
  open = false,
  disabled = false,
  onClick,
  children,
}: AccordionTriggerProps) {
  return (
    <h3 class="flex">
      <button
        class={`flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
        {...(disabled ? { disabled: true } : {})}
        aria-expanded={open}
        onClick={onClick}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    </h3>
  )
}

// AccordionContent - The collapsible content
// Uses CSS grid-template-rows animation for smooth expand/collapse
// grid-rows-[0fr] → grid-rows-[1fr] transition with overflow-hidden
export interface AccordionContentProps {
  open?: boolean
  children?: Child
}

export function AccordionContent({
  open = false,
  children,
}: AccordionContentProps) {
  return (
    <div
      class={`grid transition-[grid-template-rows,visibility] duration-200 ease-out ${
        open ? 'grid-rows-[1fr] visible' : 'grid-rows-[0fr] invisible'
      }`}
      data-state={open ? 'open' : 'closed'}
    >
      <div class="overflow-hidden">
        <div class="pb-4 pt-0 text-sm">
          {children}
        </div>
      </div>
    </div>
  )
}

// Accordion - Container for accordion items
export interface AccordionProps {
  children?: Child
}

export function Accordion({
  children,
}: AccordionProps) {
  return (
    <div class="w-full">
      {children}
    </div>
  )
}
