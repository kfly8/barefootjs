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

// State classes using data-state attribute selectors for reactivity
// When data-state changes, CSS automatically applies correct styles
const stateClasses = [
  // Unchecked state
  '[&[data-state=unchecked]]:border-input',
  'dark:[&[data-state=unchecked]]:bg-input/30',
  '[&[data-state=unchecked]]:bg-background',
  // Checked state
  '[&[data-state=checked]]:bg-primary',
  '[&[data-state=checked]]:text-primary-foreground',
  '[&[data-state=checked]]:border-primary',
].join(' ')

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

  // Controlled state - synced from parent via DOM attribute
  // When parent passes checked={value()}, the compiler generates a sync effect
  // that updates this signal when the parent's value changes
  const [controlledChecked, setControlledChecked] = createSignal<boolean | undefined>(checked)

  // Track if component is in controlled mode (checked prop provided)
  // Note: This captures the initial checked value. For dynamic mode switching,
  // use props object pattern instead of destructuring.
  const isControlled = createMemo(() => checked !== undefined)

  // Determine current checked state: use controlled if provided, otherwise internal
  const isChecked = createMemo(() => isControlled() ? controlledChecked() : internalChecked())

  // Helper function to update checkbox UI (visual state)
  // Note: CSS classes are now handled by data-state attribute selectors
  const updateCheckboxUI = (target: HTMLElement, newValue: boolean) => {
    // Update ARIA and data attributes (CSS reacts to data-state changes)
    target.setAttribute('aria-checked', String(newValue))
    target.setAttribute('data-state', newValue ? 'checked' : 'unchecked')

    // Update SVG checkmark visibility
    const svg = target.querySelector('svg')
    if (newValue && !svg) {
      // Add checkmark SVG
      target.innerHTML = '<svg data-slot="checkbox-indicator" class="size-3.5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>'
    } else if (!newValue && svg) {
      // Remove checkmark SVG
      svg.remove()
    }
  }

  // Classes - state styling handled by data-state attribute selectors
  const classes = `${baseClasses} ${focusClasses} ${errorClasses} ${stateClasses} ${className} grid place-content-center`

  // Click handler that works for both controlled and uncontrolled modes
  const handleClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const currentChecked = target.getAttribute('aria-checked') === 'true'
    const newValue = !currentChecked

    // Update state based on mode
    if (isControlled()) {
      // In controlled mode, update controlledChecked directly for immediate UI update
      setControlledChecked(newValue)
    } else {
      // In uncontrolled mode, update internal state
      setInternalChecked(newValue)
    }

    // Update the UI visually
    updateCheckboxUI(target, newValue)

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
