import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'nullish-coalescing-text',
  description: 'Nullish coalescing (??) in text content renders correctly',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
export function NullishCoalescingText(props: { label?: string; size?: number }) {
  const [count, setCount] = createSignal(props.size ?? 1)
  return <div><span>{props.label ?? 'Default'}</span><span>{count()}</span></div>
}
`,
  props: { label: 'Custom', size: 5 },
})
