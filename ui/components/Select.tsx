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

export interface SelectProps {
  options: SelectOption[]
  selectValue?: string
  selectPlaceholder?: string
  selectDisabled?: boolean
  selectError?: boolean
  selectDescribedBy?: string
  onChange?: (e: Event & { target: HTMLSelectElement }) => void
  onFocus?: (e: Event & { target: HTMLSelectElement }) => void
  onBlur?: (e: Event & { target: HTMLSelectElement }) => void
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
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
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
