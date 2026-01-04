"use client"
/**
 * Input Component
 *
 * A styled input component inspired by shadcn/ui.
 * Supports value binding and change events.
 * Uses CSS variables for theming support.
 */

export interface InputProps {
  inputType?: string
  inputPlaceholder?: string
  inputValue?: string
  inputDisabled?: boolean
  inputReadOnly?: boolean
  onInput?: (e: Event & { target: HTMLInputElement }) => void
  onChange?: (e: Event & { target: HTMLInputElement }) => void
  onBlur?: (e: Event & { target: HTMLInputElement }) => void
  onFocus?: (e: Event & { target: HTMLInputElement }) => void
}

export function Input({
  inputType = 'text',
  inputPlaceholder = '',
  inputValue = '',
  inputDisabled = false,
  inputReadOnly = false,
  onInput = () => {},
  onChange = () => {},
  onBlur = () => {},
  onFocus = () => {},
}: InputProps) {
  return (
    <input
      type={inputType}
      class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      placeholder={inputPlaceholder}
      value={inputValue}
      disabled={inputDisabled}
      readOnly={inputReadOnly}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}
