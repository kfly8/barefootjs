"use client"
/**
 * InputDemo Components
 *
 * Interactive demos for Input component.
 * Used in input documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Input } from './Input'

/**
 * Value binding example
 */
export function InputBindingDemo() {
  const [value, setValue] = createSignal('')
  return (
    <div class="space-y-2">
      <Input
        inputValue={value()}
        onInput={(e) => setValue(e.target.value)}
        inputPlaceholder="Type something..."
      />
      <p class="text-sm text-zinc-600">You typed: <span class="typed-value font-medium">{value()}</span></p>
    </div>
  )
}

/**
 * Focus/blur state example
 */
export function InputFocusDemo() {
  const [focused, setFocused] = createSignal(false)
  return (
    <div class="space-y-2">
      <Input
        inputPlaceholder="Focus me..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <p class="text-sm">
        Status: <span class="focus-status font-medium">{focused() ? 'Focused' : 'Not focused'}</span>
      </p>
    </div>
  )
}
