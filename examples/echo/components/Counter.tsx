'use client'
import { createSignal } from '@barefootjs/dom'

interface CounterProps {
  initial?: number
}

export function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = createSignal(initial)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
      <button onClick={() => setCount(n => n - 1)}>-1</button>
    </div>
  )
}

export default Counter
