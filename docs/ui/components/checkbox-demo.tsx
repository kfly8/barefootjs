"use client"
/**
 * CheckboxDemo Components
 *
 * Interactive demos for Checkbox component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal } from '@barefootjs/dom'
import { Checkbox } from '@ui/components/ui/checkbox'

/**
 * Basic checkbox with text label and description
 * Shows how to pair checkbox with descriptive text
 */
export function CheckboxWithTextDemo() {
  return (
    <label className="items-top flex space-x-2 cursor-pointer">
      <Checkbox />
      <div className="grid gap-1.5 leading-none">
        <span className="text-sm font-medium leading-none">
          Accept terms and conditions
        </span>
        <p className="text-sm text-muted-foreground">
          You agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </label>
  )
}

/**
 * Disabled checkbox example
 * Shows disabled state with label
 */
export function CheckboxDisabledDemo() {
  return (
    <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
      <Checkbox disabled />
      <span className="text-sm font-medium leading-none">
        Accept terms and conditions
      </span>
    </div>
  )
}

/**
 * Form example with multiple checkboxes
 * Practical sidebar/notification settings pattern
 */
export function CheckboxFormDemo() {
  const [mobile, setMobile] = createSignal(false)
  const [desktop, setDesktop] = createSignal(true)
  const [email, setEmail] = createSignal(false)

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h4 className="text-sm font-medium leading-none">Sidebar</h4>
        <p className="text-sm text-muted-foreground">
          Select the items you want to display in the sidebar.
        </p>
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={mobile()}
              onCheckedChange={setMobile}
            />
            <span className="text-sm font-medium leading-none">Mobile</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={desktop()}
              onCheckedChange={setDesktop}
            />
            <span className="text-sm font-medium leading-none">Desktop</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={email()}
              onCheckedChange={setEmail}
            />
            <span className="text-sm font-medium leading-none">Email notifications</span>
          </label>
        </div>
      </div>
      <div className="text-sm text-muted-foreground pt-2 border-t">
        Selected: {[mobile() && 'Mobile', desktop() && 'Desktop', email() && 'Email'].filter(Boolean).join(', ') || 'None'}
      </div>
    </div>
  )
}

/**
 * Terms acceptance example
 * Common form pattern with controlled state and submit button
 */
export function CheckboxTermsDemo() {
  const [accepted, setAccepted] = createSignal(false)

  return (
    <div className="space-y-4">
      <label className="items-top flex space-x-2 cursor-pointer">
        <Checkbox
          checked={accepted()}
          onCheckedChange={setAccepted}
        />
        <div className="grid gap-1.5 leading-none">
          <span className="text-sm font-medium leading-none">
            I agree to the terms and conditions
          </span>
          <p className="text-sm text-muted-foreground">
            By checking this box, you agree to our Terms of Service.
          </p>
        </div>
      </label>
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        disabled={!accepted()}
      >
        Continue
      </button>
    </div>
  )
}
