"use client"
/**
 * Input Component
 *
 * A styled input component inspired by shadcn/ui.
 * Supports value binding and change events.
 * Uses CSS variables for theming support.
 */

/**
 * Event with typed target for input elements.
 * Provides convenient access to e.target.value without manual casting.
 */
export type InputTargetEvent<T extends Event = Event> = T & { target: HTMLInputElement }

export interface InputProps {
  inputType?: string
  inputPlaceholder?: string
  inputValue?: string
  inputDisabled?: boolean
  inputReadOnly?: boolean
  inputError?: boolean
  inputDescribedBy?: string
  /** Handler with typed target for convenient access to e.target.value */
  onInput?: (e: InputTargetEvent<InputEvent>) => void
  /** Handler with typed target for convenient access to e.target.value */
  onChange?: (e: InputTargetEvent) => void
  /** Handler with typed target for convenient access to e.target.value */
  onBlur?: (e: InputTargetEvent<FocusEvent>) => void
  /** Handler with typed target for convenient access to e.target.value */
  onFocus?: (e: InputTargetEvent<FocusEvent>) => void
}

export function Input({
  inputType = 'text',
  inputPlaceholder = '',
  inputValue = '',
  inputDisabled = false,
  inputReadOnly = false,
  inputError = false,
  inputDescribedBy,
  onInput = () => {},
  onChange = () => {},
  onBlur = () => {},
  onFocus = () => {},
}: InputProps) {
  return (
    <input
      type={inputType}
      class={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base text-foreground shadow-inner transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
        inputError
          ? 'border-destructive focus-visible:ring-destructive'
          : 'border-input focus-visible:ring-ring'
      }`}
      placeholder={inputPlaceholder}
      value={inputValue}
      disabled={inputDisabled}
      readOnly={inputReadOnly}
      aria-invalid={inputError || undefined}
      {...(inputDescribedBy ? { 'aria-describedby': inputDescribedBy } : {})}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}
