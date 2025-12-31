"use client"
/**
 * CheckboxDemo Components
 *
 * Interactive demos for Checkbox component.
 * Used in checkbox documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Checkbox } from './Checkbox'

/**
 * Binding example showing state synchronization
 */
export function CheckboxBindingDemo() {
  const [checked, setChecked] = createSignal(false)
  return (
    <div class="space-y-2">
      <Checkbox
        checked={checked()}
        onCheckedChange={setChecked}
      />
      <p class="text-sm text-zinc-600">
        Status: <span class="checked-status font-medium">{checked() ? 'Checked' : 'Unchecked'}</span>
      </p>
    </div>
  )
}

/**
 * Checkbox with label example
 */
export function CheckboxWithLabelDemo() {
  const [accepted, setAccepted] = createSignal(false)
  return (
    <div class="space-y-2">
      <label class="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
        <span class="text-sm">Accept terms and conditions</span>
      </label>
      <p class="text-sm text-zinc-600">
        Terms: <span class="terms-status font-medium">{accepted() ? 'Accepted' : 'Not accepted'}</span>
      </p>
    </div>
  )
}
