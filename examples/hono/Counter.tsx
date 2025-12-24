/**
 * Counter Component
 *
 * From this file, the compiler generates:
 * - Server component (Hono JSX)
 * - Client JS (for interactivity)
 */

import { createSignal } from '@barefootjs/dom'

function Counter() {
  const [count, setCount] = createSignal(0)

  return (
    <>
      <p class="counter">{count()}</p>
      <p class="doubled">doubled: {count() * 2}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
      <button onClick={() => setCount(n => n - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </>
  )
}

export default Counter
