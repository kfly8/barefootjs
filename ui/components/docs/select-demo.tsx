"use client"
/**
 * SelectDemo Components
 *
 * Interactive demos for Select component.
 * Used in select documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Select, type SelectOption } from '../ui/select'

const fruitOptions: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'orange', label: 'Orange' },
  { value: 'grape', label: 'Grape' },
]

/**
 * Value binding example
 */
export function SelectBindingDemo() {
  const [value, setValue] = createSignal('')
  return (
    <div class="space-y-2">
      <Select
        options={fruitOptions}
        selectValue={value()}
        selectPlaceholder="Select a fruit..."
        onChange={(e) => setValue(e.target.value)}
      />
      <p class="text-sm text-muted-foreground">
        Selected: <span class="selected-value font-medium">{value() || 'None'}</span>
      </p>
    </div>
  )
}

/**
 * Focus/blur state example
 */
export function SelectFocusDemo() {
  const [focused, setFocused] = createSignal(false)
  return (
    <div class="space-y-2">
      <Select
        options={fruitOptions}
        selectPlaceholder="Focus me..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <p class="text-sm">
        Status: <span class="focus-status font-medium">{focused() ? 'Focused' : 'Not focused'}</span>
      </p>
    </div>
  )
}
