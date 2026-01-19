'use client'

/**
 * Counter Component (Shared)
 *
 * This component is shared across all adapter examples.
 * Used to verify consistent behavior across different backends.
 */

import { createSignal, createMemo } from '@barefootjs/dom'

interface CounterProps {
  initial?: number
}

export function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = createSignal(initial)
  const doubled = createMemo(() => count() * 2)

  return (
    <div class="counter-container">
      <p class="counter-value">{count()}</p>
      <p class="counter-doubled">doubled: {doubled()}</p>
      <div class="counter-buttons">
        <button class="btn btn-increment" onClick={() => setCount(n => n + 1)}>+1</button>
        <button class="btn btn-decrement" onClick={() => setCount(n => n - 1)}>-1</button>
        <button class="btn btn-reset" onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  )
}

export default Counter
