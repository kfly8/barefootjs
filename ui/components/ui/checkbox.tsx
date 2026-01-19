"use client"

/**
 * Checkbox Component
 *
 * An accessible checkbox with custom styling.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 * ```
 *
 * @example With label (using external label)
 * ```tsx
 * <label class="flex items-center gap-2">
 *   <Checkbox checked={agreed} onCheckedChange={setAgreed} />
 *   I agree to the terms
 * </label>
 * ```
 *
 * @example Disabled state
 * ```tsx
 * <Checkbox checked disabled />
 * ```
 */

// Base classes for all checkboxes
const baseClasses = 'peer size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'

// Focus visible classes
const focusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50'

// Error state classes
const errorClasses = 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

// Unchecked state classes
const uncheckedClasses = 'border-input dark:bg-input/30 bg-background'

// Checked state classes
const checkedClasses = 'bg-primary text-primary-foreground border-primary'

/**
 * Props for the Checkbox component.
 */
interface CheckboxProps {
  /**
   * Whether the checkbox is checked.
   * @default false
   */
  checked?: boolean
  /**
   * Whether the checkbox is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether the checkbox is in an error state.
   * @default false
   */
  error?: boolean
  /**
   * Callback when the checked state changes.
   */
  onCheckedChange?: (checked: boolean) => void
  /**
   * Additional CSS classes.
   */
  class?: string
}

/**
 * Checkbox component with custom styling.
 *
 * @param props.checked - Whether checked
 * @param props.disabled - Whether disabled
 * @param props.error - Whether in error state
 * @param props.onCheckedChange - Callback when checked state changes
 */
function Checkbox({
  class: className = '',
  checked = false,
  disabled = false,
  error = false,
  onCheckedChange,
}: CheckboxProps) {
  const stateClasses = checked ? checkedClasses : uncheckedClasses
  const classes = `${baseClasses} ${focusClasses} ${errorClasses} ${stateClasses} ${className}`

  return (
    <button
      data-slot="checkbox"
      data-state={checked ? 'checked' : 'unchecked'}
      role="checkbox"
      aria-checked={checked}
      aria-invalid={error || undefined}
      disabled={disabled}
      class={classes}
      onClick={() => onCheckedChange?.(!checked)}
    >
      {checked && (
        <svg
          data-slot="checkbox-indicator"
          class="size-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  )
}

export { Checkbox }
export type { CheckboxProps }
