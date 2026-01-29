"use client"

import { createSignal, createMemo, createEffect, onMount, onCleanup } from '@barefootjs/dom'

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

  // Controlled state - synced from parent via DOM attribute
  // Initial value uses 'checked' prop (compiler transforms to props.checked)
  const [controlledChecked, setControlledChecked] = createSignal<boolean | undefined>(checked)

  // Track if component is in controlled mode (checked prop provided)
  // Access 'checked' prop in memo to ensure it's marked as reactive prop
  const isControlled = createMemo(() => checked !== undefined)

  // Determine current checked state: use controlled if provided, otherwise internal
  const isChecked = createMemo(() => isControlled() ? controlledChecked() : internalChecked())

  // Watch for parent's checked attribute changes via MutationObserver
  // Parent components update the 'checked' attribute on the scope element
  // when their signal changes, so we monitor that attribute
  onMount(() => {
    // Find all checkbox buttons and their scopes
    // Note: When Checkbox is a child component, its scope may be named like
    // "ParentComponent_xxx_slot_0" instead of "Checkbox_xxx"
    const buttons = document.querySelectorAll('[data-slot="checkbox"]')
    for (const button of buttons) {
      // First try to find Checkbox-specific scope, then fall back to any scope with data-bf-scope
      const scopeEl = button.closest('[data-bf-scope^="Checkbox_"]') ||
                      button.closest('[data-bf-scope]')
      if (!scopeEl || scopeEl.hasAttribute('data-bf-observer')) continue

      // Mark this scope as having an observer
      scopeEl.setAttribute('data-bf-observer', 'true')

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'checked') {
            const newValue = (mutation.target as Element).getAttribute('checked')
            if (newValue !== null) {
              setControlledChecked(newValue === 'true')
            }
          }
        }
      })

      observer.observe(scopeEl, { attributes: true, attributeFilter: ['checked'] })

      onCleanup(() => {
        observer.disconnect()
        scopeEl.removeAttribute('data-bf-observer')
      })
      break // Only attach observer to first unobserved scope (this instance)
    }
  })

  // Classes computed inline to avoid variable ordering issues
  const classes = `${baseClasses} ${focusClasses} ${errorClasses} ${isChecked() ? checkedClasses : uncheckedClasses} ${className} grid place-content-center`

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

    // Directly update DOM for child component case where hydration may not work
    // This ensures the checkbox visually updates regardless of scope issues
    target.setAttribute('aria-checked', String(newValue))
    target.setAttribute('data-state', newValue ? 'checked' : 'unchecked')

    // Update checkbox styling classes
    if (newValue) {
      target.classList.remove('border-input', 'bg-background')
      target.classList.add('bg-primary', 'text-primary-foreground', 'border-primary')
    } else {
      target.classList.remove('bg-primary', 'text-primary-foreground', 'border-primary')
      target.classList.add('border-input', 'bg-background')
    }

    // Update SVG checkmark visibility
    let svg = target.querySelector('svg')
    if (newValue && !svg) {
      // Add checkmark SVG
      target.innerHTML = '<svg data-slot="checkbox-indicator" class="size-3.5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>'
    } else if (!newValue && svg) {
      // Remove checkmark SVG
      svg.remove()
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
