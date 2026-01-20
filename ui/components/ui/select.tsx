"use client"

/**
 * Select Component
 *
 * A native select element with consistent styling.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Select
 *   options={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' },
 *   ]}
 *   value={fruit}
 *   onChange={(e) => setFruit(e.target.value)}
 * />
 * ```
 *
 * @example With placeholder
 * ```tsx
 * <Select
 *   options={options}
 *   placeholder="Select a fruit..."
 * />
 * ```
 *
 * @example With error state
 * ```tsx
 * <Select options={options} error describedBy="error-message" />
 * ```
 */

import type { SelectHTMLAttributes } from '@barefootjs/jsx'

/**
 * Option type for Select component.
 */
interface SelectOption {
  /** The value submitted when this option is selected */
  value: string
  /** Display text for the option */
  label: string
  /** Whether this option is disabled */
  disabled?: boolean
}

// Base classes for native select
const baseClasses = 'flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

// Error state classes
const errorClasses = 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

// Default border classes
const defaultBorderClasses = 'border-input'

/**
 * Props for the Select component.
 */
interface SelectProps extends Pick<SelectHTMLAttributes, 'onChange' | 'onFocus' | 'onBlur' | 'class'> {
  /**
   * Array of options to display.
   */
  options: SelectOption[]
  /**
   * Current selected value.
   * @default ''
   */
  value?: string
  /**
   * Placeholder text shown when no option is selected.
   */
  placeholder?: string
  /**
   * Whether the select is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the select is in an error state.
   * @default false
   */
  error?: boolean
  /**
   * ID of the element that describes this select (for accessibility).
   */
  describedBy?: string
}

/**
 * Native select component with error state support.
 *
 * @param props.options - Array of options to display
 * @param props.value - Current selected value
 * @param props.placeholder - Placeholder text
 * @param props.disabled - Whether disabled
 * @param props.error - Whether in error state
 * @param props.describedBy - ID of describing element for accessibility
 */
function Select({
  class: className = '',
  options,
  value = '',
  placeholder,
  disabled = false,
  error = false,
  describedBy,
  onChange,
  onFocus,
  onBlur,
}: SelectProps) {
  const classes = `${baseClasses} ${errorClasses} ${defaultBorderClasses} ${className}`

  return (
    <select
      data-slot="select"
      className={classes}
      value={value}
      disabled={disabled}
      aria-invalid={error || undefined}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} {...(option.disabled && { disabled: true })}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export { Select }
export type { SelectOption, SelectProps }
