/**
 * Slot Component
 *
 * A polymorphic component that merges its props with its child element.
 * Inspired by @radix-ui/react-slot.
 *
 * Uses JSX syntax directly instead of cloneElement to avoid hono/jsx dependency.
 * The JSX compiler (via tsconfig jsxImportSource) handles element creation.
 *
 * Usage:
 *   <Slot class="btn">{children}</Slot>
 */

import type { Child } from '../types'
import { cn } from '../lib/utils'

export interface SlotProps {
  children?: Child
  class?: string
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
 * If child is a valid JSX element, merges props and renders the child.
 * Otherwise, renders children as-is using Fragment.
 */
export function Slot({ children, class: className, ...props }: SlotProps) {
  if (children && isValidElement(children)) {
    const Tag = children.tag as any
    const childProps = children.props || {}
    const childClass = (childProps.class as string) || ''
    const childChildren = childProps.children

    // Use JSX syntax - compiler will call jsx() from jsxImportSource
    return <Tag {...childProps} {...props} class={cn(className, childClass)}>{childChildren}</Tag>
  }

  // Fallback: use Fragment to avoid DOM structure change
  return <>{children}</>
}
