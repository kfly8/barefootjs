/**
 * HTML Attributes Tests
 *
 * ## Overview
 * Verifies that HTML attributes (static and dynamic) on JSX elements are processed correctly.
 *
 * ## Supported Patterns
 * - Static attributes: `class="counter"`, `style="color: red"`
 * - Dynamic class: `class={isActive() ? 'active' : ''}`
 * - Dynamic style: `style={{ color: isRed() ? 'red' : 'blue' }}`
 * - Dynamic disabled: `disabled={isLoading()}`
 * - Dynamic value: `value={text()}`
 *
 * ## Generated Code
 * ```typescript
 * // Input
 * <p class={isActive() ? 'active' : ''}>Hello</p>
 *
 * // Output (HTML) - evaluated with initial value
 * <p data-bf="a0" class="">Hello</p>  // when isActive() = false
 *
 * // Output (clientJs)
 * const __a0 = document.getElementById('__a0')
 * function updateAll() {
 *   a0.className = isActive() ? 'active' : ''
 * }
 * ```
 *
 * ## Notes
 * - Static HTML uses standard `class` attribute (not `className`)
 * - Boolean attributes (like disabled) are only output when `true`
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'


describe('HTML Attributes - Dynamic class', () => {
  it('dynamic class attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [isActive, setIsActive] = createSignal(false)
        return <p class={isActive() ? 'active' : ''}>Hello</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // class is updated via setAttribute in client JS (for SVG compatibility)
    expect(file.clientJs).toContain("_0.setAttribute('class', isActive() ? 'active' : '')")
  })
})

describe('HTML Attributes - Dynamic style', () => {
  it('dynamic style attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [isRed, setIsRed] = createSignal(true)
        return <p style={{ color: isRed() ? 'red' : 'blue' }}>Hello</p>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Style is updated in client JS (with existence check)
    expect(file.clientJs).toContain("Object.assign(_0.style, { color: isRed() ? 'red' : 'blue' })")
  })
})

describe('HTML Attributes - Boolean attributes', () => {
  it('dynamic disabled attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [isLoading, setIsLoading] = createSignal(false)
        return <button disabled={isLoading()}>Submit</button>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Disabled is updated in client JS (with existence check)
    expect(file.clientJs).toContain('_0.disabled = isLoading()')
  })
})

describe('HTML Attributes - Form related', () => {
  it('dynamic value attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hello')
        return <input value={text()} />
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Value is updated in client JS (with undefined check)
    expect(file.clientJs).toContain('.value = __val')
    expect(file.clientJs).toContain('if (__val !== undefined)')
  })
})
