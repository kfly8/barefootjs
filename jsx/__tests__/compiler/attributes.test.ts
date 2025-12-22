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

describe('HTML Attributes - Static', () => {
  it('class attribute', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p class="counter">{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Static HTML uses standard class attribute
    expect(component.staticHtml).toContain('class="counter"')
  })

  it('style attribute (static)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p style="color: red">{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Static style attribute is output as-is
    expect(component.staticHtml).toContain('style="color: red"')
  })
})

describe('HTML Attributes - Dynamic class', () => {
  it('dynamic class attribute', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [isActive, setIsActive] = createSignal(false)
        return <p class={isActive() ? 'active' : ''}>Hello</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Elements with dynamic attributes get an ID
    expect(component.staticHtml).toContain('data-bf="a0"')

    // Initial value is false, so class is empty
    expect(component.staticHtml).not.toContain('class="active"')

    // className is updated in client JS
    expect(component.clientJs).toContain("a0.className = isActive() ? 'active' : ''")
  })

  it('dynamic class attribute (initial value is true)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [isActive, setIsActive] = createSignal(true)
        return <p class={isActive() ? 'active' : ''}>Hello</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Initial value is true, so class="active"
    expect(component.staticHtml).toContain('class="active"')
  })
})

describe('HTML Attributes - Dynamic style', () => {
  it('dynamic style attribute', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [isRed, setIsRed] = createSignal(true)
        return <p style={{ color: isRed() ? 'red' : 'blue' }}>Hello</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Elements with dynamic attributes get an ID
    expect(component.staticHtml).toContain('data-bf="a0"')

    // Initial value is true, so color: red
    expect(component.staticHtml).toContain('style="color: red"')

    // Style is updated in client JS
    expect(component.clientJs).toContain("Object.assign(a0.style, { color: isRed() ? 'red' : 'blue' })")
  })
})

describe('HTML Attributes - Boolean attributes', () => {
  it('dynamic disabled attribute', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [isLoading, setIsLoading] = createSignal(false)
        return <button disabled={isLoading()}>Submit</button>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Elements with dynamic attributes get an ID
    expect(component.staticHtml).toContain('data-bf="a0"')

    // Initial value is false, so disabled attribute is not present
    expect(component.staticHtml).not.toContain('disabled')

    // Disabled is updated in client JS
    expect(component.clientJs).toContain('a0.disabled = isLoading()')
  })

  it('dynamic disabled attribute (initial value is true)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [isLoading, setIsLoading] = createSignal(true)
        return <button disabled={isLoading()}>Submit</button>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Initial value is true, so disabled attribute is present
    expect(component.staticHtml).toContain('disabled')
  })
})

describe('HTML Attributes - Form related', () => {
  it('dynamic value attribute', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hello')
        return <input value={text()} />
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Elements with dynamic attributes get an ID
    expect(component.staticHtml).toContain('data-bf="a0"')

    // Initial value is output
    expect(component.staticHtml).toContain('value="hello"')

    // Value is updated in client JS
    expect(component.clientJs).toContain('a0.value = text()')
  })
})
