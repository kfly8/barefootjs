"use client"
/**
 * Select Component
 *
 * A styled select component inspired by shadcn/ui.
 * Supports value binding and change events.
 * Uses CSS variables for theming support.
 */

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Event with typed target for select elements.
 * Provides convenient access to e.target.value without manual casting.
 */
export type SelectTargetEvent<T extends Event = Event> = T & { target: HTMLSelectElement }

export interface SelectProps {
  options: SelectOption[]
  selectValue?: string
  selectPlaceholder?: string
  selectDisabled?: boolean
  selectError?: boolean
  selectDescribedBy?: string
  /** Handler with typed target for convenient access to e.target.value */
  onChange?: (e: SelectTargetEvent) => void
  /** Handler with typed target for convenient access to e.target.value */
  onFocus?: (e: SelectTargetEvent<FocusEvent>) => void
  /** Handler with typed target for convenient access to e.target.value */
  onBlur?: (e: SelectTargetEvent<FocusEvent>) => void
}

export function Select({
  options,
  selectValue = '',
  selectPlaceholder,
  selectDisabled = false,
  selectError = false,
  selectDescribedBy,
  onChange,
  onFocus,
  onBlur,
}: SelectProps) {
  return (
    <select
      class={`flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        selectError
          ? 'border-destructive focus:ring-destructive'
          : 'border-input focus:ring-ring'
      }`}
      value={selectValue}
      disabled={selectDisabled}
      aria-invalid={selectError || undefined}
      {...(selectDescribedBy ? { 'aria-describedby': selectDescribedBy } : {})}
      onChange={onChange as ((e: Event) => void) | undefined}
      onFocus={onFocus as ((e: FocusEvent) => void) | undefined}
      onBlur={onBlur as ((e: FocusEvent) => void) | undefined}
    >
      {selectPlaceholder && (
        <option value="" disabled>
          {selectPlaceholder}
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
