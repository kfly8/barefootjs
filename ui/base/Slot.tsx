/**
 * Slot Component
 *
 * A polymorphic component that merges its props with its child element.
 * Inspired by @radix-ui/react-slot but framework-agnostic through dependency injection.
 *
 * Usage:
 * 1. Configure with your JSX runtime's cloneElement:
 *    import { cloneElement, isValidElement } from 'hono/jsx'
 *    configureSlot({ cloneElement, isValidElement })
 *
 * 2. Use in components:
 *    <Slot class="btn">{children}</Slot>
 */

import type { Child } from '../types'
import { cn } from '../lib/utils'

// Type definitions for JSX runtime functions
type CloneElementFn = <T>(element: T, props: Record<string, unknown>, ...children: Child[]) => T
type IsValidElementFn = (element: unknown) => boolean

// Configuration storage
let config: {
  cloneElement: CloneElementFn
  isValidElement: IsValidElementFn
} | null = null

/**
 * Configure Slot with JSX runtime functions.
 * Must be called before using Slot with asChild.
 */
export function configureSlot(c: {
  cloneElement: CloneElementFn
  isValidElement: IsValidElementFn
}) {
  config = c
}

export interface SlotProps {
  children?: Child
  class?: string
  [key: string]: unknown
}

/**
 * Slot component that renders its child with merged props.
 * If child is a valid JSX element, merges props and renders the child.
 * Otherwise, renders children wrapped in a span.
 */
export function Slot({ children, class: className, ...props }: SlotProps) {
  // Check if we can use cloneElement and children is a valid element
  if (config && isSlottable(children)) {
    const child = children as { props?: { class?: string } }
    const childClass = child.props?.class

    return config.cloneElement(children, {
      ...props,
      class: cn(className, childClass),
    })
  }

  // Fallback: wrap in span
  return (
    <span class={className} {...props}>
      {children}
    </span>
  )
}

/**
 * Check if children is a single valid JSX element that can be slotted.
 */
function isSlottable(children: Child): boolean {
  if (!config) return false
  if (children === null || children === undefined) return false
  if (typeof children !== 'object') return false
  if (Array.isArray(children)) return false

  return config.isValidElement(children)
}
