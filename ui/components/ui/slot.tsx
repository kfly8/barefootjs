"use client"

/**
 * Slot Component
 *
 * A polymorphic component that merges its props with its child element.
 * Inspired by @radix-ui/react-slot. This enables the `asChild` pattern
 * used by components like Button and Badge.
 *
 * @example Basic usage
 * ```tsx
 * // Slot merges its props with the child element
 * <Slot class="custom-class" data-active="true">
 *   <a href="/home">Home</a>
 * </Slot>
 * // Renders: <a href="/home" class="custom-class" data-active="true">Home</a>
 * ```
 *
 * @example asChild pattern (used by Button, Badge, etc.)
 * ```tsx
 * // Button component internally uses Slot when asChild is true
 * <Button asChild>
 *   <a href="/home">Go Home</a>
 * </Button>
 * // Renders: <a href="/home" class="btn-classes...">Go Home</a>
 *
 * // Without asChild, renders a button element
 * <Button>Click me</Button>
 * // Renders: <button class="btn-classes...">Click me</button>
 * ```
 *
 * @example Class merging
 * ```tsx
 * // Classes from Slot and child are merged
 * <Slot class="slot-class">
 *   <div class="child-class">Content</div>
 * </Slot>
 * // Renders: <div class="slot-class child-class">Content</div>
 * ```
 */

import type { Child } from '../../types'

/**
 * Props for the Slot component.
 */
interface SlotProps {
  /** Child element to merge props with */
  children?: Child
  /** CSS class to merge with child's class */
  class?: string
  /** Additional props to merge with child element */
  [key: string]: unknown
}

/**
 * Check if a value is a valid JSX element.
 * Hono's JSX elements have `tag` and `props` properties.
 */
function isValidElement(element: unknown): element is { tag: unknown; props: Record<string, unknown> } {
  return !!(element && typeof element === 'object' && 'tag' in element && 'props' in element)
}

/**
 * Slot component that renders its child with merged props.
 *
 * @param props.children - Child element to merge props with
 * @param props.class - CSS class to merge with child's class
 */
function Slot({ children, class: className, ...props }: SlotProps) {
  if (children && isValidElement(children)) {
    const Tag = children.tag as any
    const childProps = children.props || {}
    const childClass = (childProps.class as string) || ''
    const childChildren = childProps.children

    // Use JSX syntax - compiler will call jsx() from jsxImportSource
    const mergedClass = [className, childClass].filter(Boolean).join(' ')
    return <Tag {...childProps} {...props} class={mergedClass || undefined}>{childChildren}</Tag>
  }

  // Fallback: use Fragment to avoid DOM structure change
  return <>{children}</>
}

export { Slot }
export type { SlotProps }
