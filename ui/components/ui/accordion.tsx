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

import type { Child } from '../../types'
import { ChevronDownIcon } from './icon'

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
      class="border-b border-border"
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
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement
    const accordion = target.closest('.w-full')
    if (!accordion) return

    const triggers = accordion.querySelectorAll('[aria-expanded]:not([disabled])')
    const currentIndex = Array.from(triggers).indexOf(target)

    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = currentIndex < triggers.length - 1 ? currentIndex + 1 : 0
        break
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : triggers.length - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = triggers.length - 1
        break
    }

    if (nextIndex !== null && triggers[nextIndex]) {
      ;(triggers[nextIndex] as HTMLElement).focus()
    }
  }

  return (
    <h3 class="flex">
      <button
        class={`flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline ${
          disabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''
        }`}
        {...(disabled ? { disabled: true } : {})}
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        {children}
        <ChevronDownIcon
          size="sm"
          class={`text-muted-foreground transition-transform duration-normal ${
            open ? 'rotate-180' : ''
          }`}
        />
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
      role="region"
      class={`grid transition-[grid-template-rows,visibility] duration-normal ease-out ${
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
