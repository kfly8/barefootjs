import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'conditional-class',
  description: 'Conditional className via ternary expression',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
export function ConditionalClass() {
  const [active, setActive] = createSignal(false)
  return <div className={active() ? 'on' : 'off'}>Toggle</div>
}
`,
})
