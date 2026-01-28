"use client"
/**
 * CheckboxDemo Components
 *
 * Interactive demos for Checkbox component.
 * Used in checkbox documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Checkbox } from '@ui/components/ui/checkbox'

/**
 * Simple uncontrolled checkbox demo
 * No external state management needed
 */
export function CheckboxUncontrolledDemo() {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox />
        <span className="text-sm">Click me (uncontrolled)</span>
      </label>
    </div>
  )
}

/**
 * Binding example showing state synchronization (controlled mode)
 */
export function CheckboxBindingDemo() {
  const [checked, setChecked] = createSignal(false)

  return (
    <div className="space-y-2">
      <Checkbox
        checked={checked()}
        onCheckedChange={setChecked}
      />
      <p className="text-sm text-muted-foreground">
        Status: <span className="checked-status font-medium">{checked() ? 'Checked' : 'Unchecked'}</span>
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
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
        <span className="text-sm">Accept terms and conditions</span>
      </label>
      <p className="text-sm text-muted-foreground">
        Terms: <span className="terms-status font-medium">{accepted() ? 'Accepted' : 'Not accepted'}</span>
      </p>
    </div>
  )
}
