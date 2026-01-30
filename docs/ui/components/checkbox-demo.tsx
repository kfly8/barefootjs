"use client"
/**
 * CheckboxDemo Components
 *
 * Interactive demos for Checkbox component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Checkbox } from '@ui/components/ui/checkbox'

/**
 * Disabled checkbox example
 * Shows disabled state
 */
export function CheckboxDisabledDemo() {
  return (
    <div className="flex items-center space-x-2 opacity-50">
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
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={mobile()}
              onCheckedChange={setMobile}
            />
            <span className="text-sm font-medium leading-none">Mobile</span>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={desktop()}
              onCheckedChange={setDesktop}
            />
            <span className="text-sm font-medium leading-none">Desktop</span>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={email()}
              onCheckedChange={setEmail}
            />
            <span className="text-sm font-medium leading-none">Email notifications</span>
          </div>
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

  // Handle label click to toggle checkbox
  const handleLabelClick = () => {
    setAccepted(!accepted())
  }

  return (
    <div className="space-y-4">
      <div className="items-top flex space-x-2">
        <Checkbox
          checked={accepted()}
          onCheckedChange={setAccepted}
        />
        <div
          className="grid gap-1.5 leading-none cursor-pointer select-none"
          onClick={handleLabelClick}
        >
          <span className="text-sm font-medium leading-none">
            I agree to the terms and conditions
          </span>
          <p className="text-sm text-muted-foreground">
            By checking this box, you agree to our Terms of Service.
          </p>
        </div>
      </div>
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        disabled={!accepted()}
      >
        Continue
      </button>
    </div>
  )
}

/**
 * Email list with bulk selection
 * Gmail-like pattern for selecting items in a list
 */
export function CheckboxEmailListDemo() {
  const [email1, setEmail1] = createSignal(false)
  const [email2, setEmail2] = createSignal(false)
  const [email3, setEmail3] = createSignal(false)

  const selectedCount = createMemo(() => [email1(), email2(), email3()].filter(Boolean).length)
  const isAllSelected = createMemo(() => selectedCount() === 3)
  const selectionLabel = createMemo(() =>
    selectedCount() > 0 ? `${selectedCount()} selected` : 'Select all'
  )

  const toggleAll = (checked: boolean) => {
    setEmail1(checked)
    setEmail2(checked)
    setEmail3(checked)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected()}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectionLabel()}
          </span>
        </div>
        {selectedCount() > 0 && (
          <span className="text-sm text-primary cursor-pointer hover:underline">
            Mark as read
          </span>
        )}
      </div>
      <div className="divide-y border-x border-b rounded-b-md">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
          <Checkbox checked={email1()} onCheckedChange={setEmail1} />
          <span className="text-sm font-medium w-32 truncate">John Smith</span>
          <span className="text-sm truncate flex-1">Meeting tomorrow - Let's discuss the Q4 planning</span>
          <span className="text-xs text-muted-foreground shrink-0">10:30 AM</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
          <Checkbox checked={email2()} onCheckedChange={setEmail2} />
          <span className="text-sm w-32 truncate">Dev Team</span>
          <span className="text-sm text-muted-foreground truncate flex-1">Project update - Sprint review notes attached</span>
          <span className="text-xs text-muted-foreground shrink-0">9:15 AM</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
          <Checkbox checked={email3()} onCheckedChange={setEmail3} />
          <span className="text-sm font-medium w-32 truncate">Billing Dept</span>
          <span className="text-sm truncate flex-1">Invoice #1234 - Payment due in 30 days</span>
          <span className="text-xs text-muted-foreground shrink-0">Yesterday</span>
        </div>
      </div>
    </div>
  )
}
