"use client"
/**
 * BadgeAsChildDemo Component
 *
 * Interactive demo for Badge asChild pattern with reactive bindings.
 * Verifies that conditional JSX returns (if/else in Badge) preserve
 * reactive attribute updates and event handlers.
 */

import { createSignal } from '@barefootjs/dom'
import { Badge } from '@ui/components/ui/badge'

/**
 * Badge asChild demo with reactive click counter.
 * The Badge component uses if/else to switch between <Slot> and <span>.
 */
export function BadgeAsChildDemo() {
  const [count, setCount] = createSignal(0)

  return (
    <div className="flex items-center gap-4">
      <Badge asChild>
        <a
          href="#"
          data-testid="badge-aschild-link"
          onClick={(e: Event) => { e.preventDefault(); setCount(count() + 1) }}
        >
          Clicked {count()} times
        </a>
      </Badge>
      <Badge variant="outline" asChild>
        <a
          href="#"
          data-testid="badge-aschild-outline"
          onClick={(e: Event) => e.preventDefault()}
        >
          Outline Link
        </a>
      </Badge>
    </div>
  )
}
