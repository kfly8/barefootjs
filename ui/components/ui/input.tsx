"use client"

/**
 * Input Component
 *
 * A styled text input component with error state support.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Input placeholder="Enter your name" />
 * ```
 *
 * @example With value binding
 * ```tsx
 * <Input value={name} onInput={(e) => setName(e.target.value)} />
 * ```
 *
 * @example With error state
 * ```tsx
 * <Input error describedBy="error-message" />
 * ```
 */

import type { InputHTMLAttributes } from '@barefootjs/jsx'

// Base classes for all inputs
const baseClasses = 'flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// Error state classes
const errorClasses = 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

// Default border classes (when not in error state)
const defaultBorderClasses = 'border-input'

/**
 * Props for the Input component.
 */
interface InputProps extends Pick<InputHTMLAttributes, 'onInput' | 'onChange' | 'onBlur' | 'onFocus' | 'class'> {
  /**
   * Input type attribute (text, email, password, etc.).
   * @default 'text'
   */
  type?: string
  /**
   * Placeholder text shown when input is empty.
   * @default ''
   */
  placeholder?: string
  /**
   * Current value of the input.
   * @default ''
   */
  value?: string
  /**
   * Whether the input is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the input is read-only.
   * @default false
   */
  readOnly?: boolean
  /**
   * Whether the input is in an error state.
   * @default false
   */
  error?: boolean
  /**
   * ID of the element that describes this input (for accessibility).
   */
  describedBy?: string
}

/**
 * Input component with error state support.
 *
 * @param props.type - Input type attribute
 * @param props.placeholder - Placeholder text
 * @param props.value - Current value
 * @param props.disabled - Whether disabled
 * @param props.readOnly - Whether read-only
 * @param props.error - Whether in error state
 * @param props.describedBy - ID of describing element for accessibility
 */
function Input({
  class: className = '',
  type = 'text',
  placeholder = '',
  value = '',
  disabled = false,
  readOnly = false,
  error = false,
  describedBy,
  onInput = () => {},
  onChange = () => {},
  onBlur = () => {},
  onFocus = () => {},
}: InputProps) {
  const classes = `${baseClasses} ${errorClasses} ${defaultBorderClasses} ${className}`

  return (
    <input
      data-slot="input"
      type={type}
      class={classes}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readonly={readOnly}
      aria-invalid={error || undefined}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}

export { Input }
export type { InputProps }
