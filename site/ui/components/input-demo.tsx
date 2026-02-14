"use client"
/**
 * InputDemo Components
 *
 * Interactive demos for Input component.
 * Used in input documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Input } from '@ui/components/ui/input'

/**
 * Value binding example
 */
export function InputBindingDemo() {
  const [value, setValue] = createSignal('')
  return (
    <div className="space-y-2">
      <Input
        value={value()}
        onInput={(e) => setValue(e.target.value)}
        placeholder="Type something..."
      />
      <p className="text-sm text-muted-foreground">You typed: <span className="typed-value font-medium">{value()}</span></p>
    </div>
  )
}

/**
 * Focus/blur state example
 */
export function InputFocusDemo() {
  const [focused, setFocused] = createSignal(false)
  return (
    <div className="space-y-2">
      <Input
        placeholder="Focus me..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <p className="text-sm">
        Status: <span className="focus-status font-medium">{focused() ? 'Focused' : 'Not focused'}</span>
      </p>
    </div>
  )
}
