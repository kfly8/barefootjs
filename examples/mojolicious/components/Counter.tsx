"use client"

/**
 * Counter Component
 *
 * From this file, the compiler generates:
 * - Server component (Hono JSX)
 * - Client JS (for interactivity)
 */

import { createSignal, createMemo } from '@barefootjs/dom'

function Counter() {
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)

  return (
    <>
      <p class="counter">{count()}</p>
      <p class="doubled">doubled: {doubled()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
      <button onClick={() => setCount(n => n - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  )
}

export default Counter
