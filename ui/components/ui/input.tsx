"use client"
/**
 * Input Component
 *
 * A styled input component inspired by shadcn/ui.
 * Supports value binding and change events.
 * Uses CSS variables for theming support.
 */

import type { InputHTMLAttributes } from '@barefootjs/jsx'

export interface InputProps extends Pick<InputHTMLAttributes, 'onInput' | 'onChange' | 'onBlur' | 'onFocus'> {
  inputType?: string
  inputPlaceholder?: string
  inputValue?: string
  inputDisabled?: boolean
  inputReadOnly?: boolean
  inputError?: boolean
  inputDescribedBy?: string
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
      readonly={inputReadOnly}
      aria-invalid={inputError || undefined}
      {...(inputDescribedBy ? { 'aria-describedby': inputDescribedBy } : {})}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}
