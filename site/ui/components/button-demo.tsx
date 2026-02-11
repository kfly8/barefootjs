"use client"
/**
 * ButtonDemo Component
 *
 * Interactive demo for Button component with click counter.
 * Used in button documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Button } from '@ui/components/ui/button'

/**
 * Interactive counter button demo
 */
export function ButtonDemo() {
  const [count, setCount] = createSignal(0)

  return (
    <Button onClick={() => setCount(n => n + 1)}>
      Clicked {count()} times
    </Button>
  )
}
