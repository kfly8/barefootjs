"use client"
/**
 * CounterDemo Components
 *
 * Interactive demos for Counter component.
 * Used in counter documentation page.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Counter } from '../ui/counter'

/**
 * Basic interactive counter
 */
export function CounterInteractiveDemo() {
  const [count, setCount] = createSignal(0)
  return (
    <Counter
      value={count()}
      disabled={false}
      onIncrement={() => setCount(n => n + 1)}
      onDecrement={() => setCount(n => n - 1)}
    />
  )
}

/**
 * Counter with derived state (memo) example
 */
export function CounterDerivedDemo() {
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)
  const isEven = createMemo(() => count() % 2 === 0)

  return (
    <div class="space-y-2">
      <Counter
        value={count()}
        disabled={false}
        onIncrement={() => setCount(n => n + 1)}
        onDecrement={() => setCount(n => n - 1)}
      />
      <p class="text-foreground">Doubled: <span class="font-mono">{doubled()}</span></p>
      <p class="text-foreground">Is even: <span class="font-mono">{isEven() ? 'Yes' : 'No'}</span></p>
    </div>
  )
}
