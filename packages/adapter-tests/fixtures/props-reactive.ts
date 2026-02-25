import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'props-reactive',
  description: 'Stateful component accessing props via props.xxx',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
export function PropsReactive(props: { label: string }) {
  const [count, setCount] = createSignal(0)
  return <div><span>{props.label}</span><span>{count()}</span></div>
}
`,
  props: { label: 'Hello' },
  expectedHtml: `<div bf-s="test"><span bf="s1"><span bf="s0">Hello</span></span><span bf="s3"><span bf="s2">0</span></span></div>`,
})
