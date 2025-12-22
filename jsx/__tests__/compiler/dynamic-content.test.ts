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

    // Dynamic elements get an ID
    expect(component.staticHtml).toContain('data-bf="d0"')

    // Updated in updateAll function
    expect(component.clientJs).toContain('d0.textContent = count()')
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

    expect(component.clientJs).toContain('d0.textContent = count() * 2')
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

    expect(component.clientJs).toContain("d0.textContent = on() ? 'ON' : 'OFF'")
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

    // String() wrapper is added for safe concatenation with text
    expect(component.clientJs).toContain('d0.textContent = "Count:" + String(count())')
  })

  it('correct initial rendering (boolean to string)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [on, setOn] = createSignal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Initial value is false, so OFF is displayed
    expect(component.staticHtml).toContain('>OFF<')
  })

  it('correct initial rendering (numeric operation)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(5)
        return <span>{count() * 2}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Initial value 5 * 2 = 10
    expect(component.staticHtml).toContain('>10<')
  })
})
