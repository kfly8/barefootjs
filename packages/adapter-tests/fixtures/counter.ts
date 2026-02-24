import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'counter',
  description: 'Counter with signal and event handler',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
export function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(n => n + 1)}>Count: {count()}</button>
}
`,
})
