/**
 * Code snippets for Hero section demo
 * Embedded as module to avoid fetch() in Workers environment
 */

export const SOURCE_CODE = `"use client"

import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  )
}`

export const HONO_OUTPUT = `// Hono JSX Template
export function Counter({ count = 0 }) {
  return (
    <button data-bf-scope="Counter" data-bf="slot_1">
      Count: <span data-bf="slot_0">{count}</span>
    </button>
  )
}`

export const ECHO_OUTPUT = `{{/* Go Template */}}
<button data-bf-scope="Counter" data-bf="slot_1">
  Count: <span data-bf="slot_0">{{ .Count }}</span>
</button>`

export const CLIENT_CODE = `// Counter.client.js
import { createSignal, createEffect, findScope, find, hydrate, registerComponent } from '@barefootjs/dom'

export function initCounter(__instanceIndex, __parentScope, props = {}) {
  const __scope = findScope('Counter', __instanceIndex, __parentScope)
  if (!__scope) return

  const [count, setCount] = createSignal(props.count ?? 0)

  const _slot_0 = find(__scope, '[data-bf="slot_0"]')
  const _slot_1 = find(__scope, '[data-bf="slot_1"]')

  createEffect(() => {
    if (_slot_0) _slot_0.textContent = String(count())
  })

  if (_slot_1) _slot_1.onclick = () => setCount(c => c + 1)
}

registerComponent('Counter', initCounter)
hydrate('Counter', (props, idx, scope) => initCounter(idx, scope, props))`
