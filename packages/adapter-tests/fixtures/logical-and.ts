import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'logical-and',
  description: 'Logical AND conditional rendering',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
export function LogicalAndDemo() {
  const [show, setShow] = createSignal(false)
  return <div>{show() && <span>Shown</span>}</div>
}
`,
})
