import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'reactive-prop-binding',
  description: 'Child component receives reactive prop via signal getter',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
import { Display } from './display'
export function Controller() {
  const [count, setCount] = createSignal(0)
  return <div><Display count={count()} /><button onClick={() => setCount(n => n + 1)}>+</button></div>
}
`,
  components: {
    './display.tsx': `
export function Display({ count }: { count: number }) {
  return <span>Count: {count}</span>
}
`,
  },
  expectedHtml: `
    <div bf-s="test">
      <span bf-s="test_s0" bf="s1">Count: <!--bf:s0-->0<!--/--></span>
      <button bf="s1">+</button>
    </div>
  `,
})
