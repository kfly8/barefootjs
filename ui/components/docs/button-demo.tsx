"use client"
/**
 * ButtonDemo Component
 *
 * Interactive demo for Button component.
 * Used in button documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Button } from '../ui/button'

export function ButtonDemo() {
  const [count, setCount] = createSignal(0)
  return (
    <Button onClick={() => setCount(n => n + 1)}>
      Clicked {count()} times
    </Button>
  )
}
