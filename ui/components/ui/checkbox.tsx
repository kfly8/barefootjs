"use client"

import { createSignal, createMemo } from '@barefootjs/dom'

/**
 * Checkbox Component
 *
 * An accessible checkbox with custom styling.
 * Supports both controlled and uncontrolled modes.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Uncontrolled (internal state)
 * ```tsx
 * <Checkbox />
 * <Checkbox defaultChecked />
 * ```
 *
 * @example Controlled (external state)
 * ```tsx
 * <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 * ```
 *
 * @example With label
 * ```tsx
 * <label className="flex items-center gap-2">
 *   <Checkbox />
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
   * Default checked state (for uncontrolled mode).
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Controlled checked state. When provided, component is in controlled mode.
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
 * Supports both controlled and uncontrolled modes.
 *
 * @param props.defaultChecked - Initial value for uncontrolled mode
 * @param props.checked - Controlled checked state
 * @param props.disabled - Whether disabled
 * @param props.error - Whether in error state
 * @param props.onCheckedChange - Callback when checked state changes
 */
function Checkbox({
  class: className = '',
  defaultChecked = false,
  checked,
  disabled = false,
  error = false,
  onCheckedChange,
}: CheckboxProps) {
  // Internal state for uncontrolled mode
  const [internalChecked, setInternalChecked] = createSignal(defaultChecked)

  // Determine current checked state: use external if provided, otherwise internal
  const isChecked = createMemo(() => checked !== undefined ? checked : internalChecked())

  // Classes computed inline to avoid variable ordering issues
  const classes = `${baseClasses} ${focusClasses} ${errorClasses} ${isChecked() ? checkedClasses : uncheckedClasses} ${className} grid place-content-center`

  // Click handler that works for both controlled and uncontrolled modes
  const handleClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const currentChecked = target.getAttribute('aria-checked') === 'true'
    const newValue = !currentChecked

    // Update internal state in uncontrolled mode
    if (checked === undefined) {
      setInternalChecked(newValue)
    }

    // Notify parent if callback provided (works for both modes)
    // Check scope element for callback (parent sets callback there during hydration)
    const scope = target.closest('[data-bf-scope]')
    // @ts-ignore - oncheckedChange is set by parent during hydration
    const scopeCallback = scope?.oncheckedChange
    const handler = onCheckedChange || scopeCallback
    handler?.(newValue)
  }

  return (
    <button
      data-slot="checkbox"
      data-state={isChecked() ? 'checked' : 'unchecked'}
      role="checkbox"
      aria-checked={isChecked()}
      aria-invalid={error || undefined}
      disabled={disabled}
      className={classes}
      onClick={handleClick}
    >
      {isChecked() && (
        <svg
          data-slot="checkbox-indicator"
          className="size-3.5 text-current"
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
