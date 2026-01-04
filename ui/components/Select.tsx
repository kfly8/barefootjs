"use client"
/**
 * Select Component
 *
 * A styled select component inspired by shadcn/ui.
 * Supports value binding and change events.
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
  onChange?: (e: Event & { target: HTMLSelectElement }) => void
  onFocus?: (e: Event & { target: HTMLSelectElement }) => void
  onBlur?: (e: Event & { target: HTMLSelectElement }) => void
}

export function Select({
  options,
  selectValue = '',
  selectPlaceholder,
  selectDisabled = false,
  onChange,
  onFocus,
  onBlur,
}: SelectProps) {
  return (
    <select
      class="flex h-9 w-full items-center justify-between rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-50 shadow-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      value={selectValue}
      disabled={selectDisabled}
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
