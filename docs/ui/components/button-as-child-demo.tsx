"use client"
/**
 * ButtonAsChildDemo Component
 *
 * Interactive demo for Button asChild pattern with reactive bindings.
 * Verifies that conditional JSX returns (if/else in Button) preserve
 * reactive attribute updates (aria-expanded) and event handlers.
 */

import { createSignal } from '@barefootjs/dom'
import { Button } from '@ui/components/ui/button'

/**
 * Toggle demo using Button with asChild.
 * The Button component uses if/else to switch between <Slot> and <button>.
 * This exercises the if-statement IR path in client JS generation.
 */
export function ButtonAsChildDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="flex items-center gap-4">
      <Button asChild>
        <a
          href="#"
          role="button"
          aria-expanded={open()}
          data-testid="as-child-link"
          onClick={() => setOpen(!open())}
        >
          {open() ? 'Expanded' : 'Collapsed'}
        </a>
      </Button>
      <span data-testid="as-child-state">{open() ? 'Open' : 'Closed'}</span>
    </div>
  )
}
