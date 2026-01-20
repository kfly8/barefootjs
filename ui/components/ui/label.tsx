"use client"

/**
 * Label Component
 *
 * A styled label component for form inputs.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 * ```
 *
 * @example With required indicator
 * ```tsx
 * <Label htmlFor="name">
 *   Name <span className="text-destructive">*</span>
 * </Label>
 * ```
 */

import type { Child } from '../../types'

// Label classes (aligned with shadcn/ui)
const labelClasses = 'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'

/**
 * Props for the Label component.
 */
interface LabelProps {
  /**
   * Additional CSS class names.
   */
  className?: string
  /**
   * The ID of the form element this label is for.
   */
  htmlFor?: string
  /**
   * Label content.
   */
  children?: Child
}

/**
 * Label component for form inputs.
 *
 * @param props.htmlFor - ID of the associated form element
 * @param props.children - Label content
 */
function Label({
  className = '',
  htmlFor,
  children,
}: LabelProps) {
  return (
    <label
      data-slot="label"
      for={htmlFor}
      className={`${labelClasses} ${className}`}
    >
      {children}
    </label>
  )
}

export { Label }
export type { LabelProps }
