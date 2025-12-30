/**
 * Dynamic Content Tests
 *
 * ## Overview
 * Verifies that dynamic values in JSX (signal calls, expressions, conditionals)
 * are correctly converted to HTML and client JS.
 *
 * ## Supported Patterns
 * - Function calls: `{count()}`
 * - Binary operations: `{count() * 2}`
 * - Conditional expressions (ternary): `{on() ? 'ON' : 'OFF'}`
 * - Text + dynamic content: `Count: {count()}`
 *
 * ## Generated Code
 * ```typescript
 * // Input
 * <p>{count()}</p>
 *
 * // Output (HTML)
 * <p data-bf="d0">0</p>  // evaluated with initial value
 *
 * // Output (clientJs)
 * const __d0 = document.getElementById('__d0')
 * function updateAll() {
 *   d0.textContent = count()
 * }
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Dynamic Content', () => {
  it('function call', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Updated with createEffect, existence check, and String() wrapper
    // Expression is evaluated before element check to ensure signal dependencies are tracked
    expect(component.clientJs).toContain('const __textValue = count()')
    expect(component.clientJs).toContain('_0.textContent = String(__textValue)')
    expect(component.clientJs).toContain('if (_0)')
  })

  it('binary operation', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p>{count() * 2}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const __textValue = count() * 2')
    expect(component.clientJs).toContain('_0.textContent = String(__textValue)')
  })

  it('conditional expression (ternary operator)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [on, setOn] = createSignal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain("const __textValue = on() ? 'ON' : 'OFF'")
    expect(component.clientJs).toContain('_0.textContent = String(__textValue)')
  })

  it('text + dynamic content', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p>Count: {count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // String() wrapper is added for safe concatenation with text (now double-wrapped)
    // Note: whitespace after "Count:" is preserved
    // Expression is evaluated before element check to ensure signal dependencies are tracked
    expect(component.clientJs).toContain('const __textValue = "Count: " + String(count())')
    expect(component.clientJs).toContain('_0.textContent = String(__textValue)')
  })

})
