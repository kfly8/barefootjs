/**
 * Signal declaration tests
 *
 * ## Overview
 * Verify the declaration of `signal`, the basic unit of state management
 * in BarefootJS, and its output to client JS.
 *
 * ## Supported patterns
 * - Primitive types: numbers, booleans, strings
 * - Reference types: objects, arrays
 * - Multiple simultaneous signal declarations
 *
 * ## Generated code
 * ```typescript
 * // Input
 * const [count, setCount] = createSignal(0)
 *
 * // Output (clientJs)
 * import { createSignal } from './barefoot.js'
 * const [count, setCount] = createSignal(0)
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Signal declarations', () => {
  // EXPR-001: Number signal
  it('EXPR-001: Number signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    expect(file.clientJs).toContain('const [count, setCount] = createSignal(0)')
  })

  // EXPR-002: Boolean signal
  it('EXPR-002: Boolean signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [on, setOn] = createSignal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    expect(file.clientJs).toContain('const [on, setOn] = createSignal(false)')
  })

  // EXPR-003: String signal
  it('EXPR-003: String signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hello')
        return <p>{text()}</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    expect(file.clientJs).toContain("const [text, setText] = createSignal('hello')")
  })

  // EXPR-004: Multiple signals
  it('EXPR-004: Multiple signals', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        const [name, setName] = createSignal('Alice')
        return <p>{name()}: {count()}</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    expect(file.clientJs).toContain('const [count, setCount] = createSignal(0)')
    expect(file.clientJs).toContain("const [name, setName] = createSignal('Alice')")
  })

  // EXPR-005: Object state
  it('EXPR-005: Object signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [user, setUser] = createSignal({ name: 'Alice', age: 20 })
        return <p>{user().name}</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    expect(file.clientJs).toContain("const [user, setUser] = createSignal({ name: 'Alice', age: 20 })")
  })

  // EXPR-006: Array state
  it('EXPR-006: Array signal', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([])
        return <p>{items().length}</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    expect(file.clientJs).toContain('const [items, setItems] = createSignal([])')
  })
})
