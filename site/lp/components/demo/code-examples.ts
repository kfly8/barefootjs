/**
 * Code examples for the demo
 *
 * Stored in a separate file to avoid compiler transformation.
 */

export const COUNTER_SOURCE = `"use client"

import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)
  return (
    <div>
      <span>{count()}</span>
      <button onClick={() => setCount(n => n + 1)}>
        +1
      </button>
    </div>
  )
}`

export const HONO_OUTPUT = `// Hono JSX (Marked Template)

export function Counter() {
  return (
    <div data-bf-scope="Counter">
      <span data-bf="slot_0">0</span>
      <button data-bf="slot_1">+1</button>
    </div>
  )
}`

export const ECHO_OUTPUT = `{{/* Go Template (Marked Template) */}}

<div data-bf-scope="Counter">
  <span data-bf="slot_0">{{ .Count }}</span>
  <button data-bf="slot_1">+1</button>
</div>`
