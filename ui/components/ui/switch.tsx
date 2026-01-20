"use client"

/**
 * Switch Component
 *
 * A toggle switch for boolean state.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
 * ```
 *
 * @example With label
 * ```tsx
 * <label className="flex items-center gap-2">
 *   <Switch checked={darkMode} onCheckedChange={setDarkMode} />
 *   Dark mode
 * </label>
 * ```
 *
 * @example Disabled state
 * ```tsx
 * <Switch checked disabled />
 * ```
 */

// Base classes for the switch track
const trackBaseClasses = 'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50'

// Focus visible classes
const trackFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// Unchecked track classes
const trackUncheckedClasses = 'bg-input dark:bg-input/80'

// Checked track classes
const trackCheckedClasses = 'bg-primary'

// Thumb base classes
const thumbBaseClasses = 'pointer-events-none block size-4 rounded-full ring-0 transition-transform'

// Thumb unchecked classes
const thumbUncheckedClasses = 'translate-x-0 bg-background dark:bg-foreground'

// Thumb checked classes
const thumbCheckedClasses = 'translate-x-[calc(100%-2px)] bg-background dark:bg-primary-foreground'

/**
 * Props for the Switch component.
 */
interface SwitchProps {
  /**
   * Whether the switch is on.
   * @default false
   */
  checked?: boolean
  /**
   * Whether the switch is disabled.
   * @default false
   */
  disabled?: boolean
  /**
   * Callback when the switch is toggled.
   */
  onCheckedChange?: (checked: boolean) => void
  /**
   * Additional CSS classes for the switch track.
   */
  class?: string
}

/**
 * Switch component for toggling boolean state.
 *
 * @param props.checked - Whether the switch is on
 * @param props.disabled - Whether the switch is disabled
 * @param props.onCheckedChange - Callback when toggled
 */
function Switch({
  class: className = '',
  checked = false,
  disabled = false,
  onCheckedChange,
}: SwitchProps) {
  const trackStateClasses = checked ? trackCheckedClasses : trackUncheckedClasses
  const trackClasses = `${trackBaseClasses} ${trackFocusClasses} ${trackStateClasses} ${className}`

  const thumbStateClasses = checked ? thumbCheckedClasses : thumbUncheckedClasses
  const thumbClasses = `${thumbBaseClasses} ${thumbStateClasses}`

  return (
    <button
      data-slot="switch"
      data-state={checked ? 'checked' : 'unchecked'}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={trackClasses}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span data-slot="switch-thumb" className={thumbClasses} />
    </button>
  )
}

export { Switch }
export type { SwitchProps }
