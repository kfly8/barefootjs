/**
 * Module Functions Tests
 *
 * ## Overview
 * Verifies that module-level helper functions (defined outside components)
 * are correctly filtered and included in client JS only when needed.
 *
 * ## Issue #152: Helper functions not properly filtered
 * - Functions used only in SSR should NOT be included in client JS
 * - Functions used in event handlers SHOULD be included
 * - Functions used in dynamic expressions SHOULD be included
 *
 * ## Filtering Logic
 * Module functions are included if referenced in:
 * - Event handlers
 * - Dynamic expressions (client-side rendered text)
 * - Memo computations
 * - Signal initializers
 * - Effect bodies
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Module Functions - Filtering', () => {
  it('includes module functions used in event handlers', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function validateInput(value) {
        return value.length > 0
      }

      function Component() {
        const [value, setValue] = createSignal('')
        return (
          <input onInput={(e) => {
            if (validateInput(e.target.value)) {
              setValue(e.target.value)
            }
          }} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Module function SHOULD be included since it's used in event handler
    expect(file.clientJs).toContain('function validateInput(value)')
  })

  it('includes module functions used in dynamic expressions', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function formatValue(x) {
        return 'Value: ' + x
      }

      function Component() {
        const [count, setCount] = createSignal(10)
        return (
          <div>
            <p>{formatValue(count())}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Module function SHOULD be included since it's used in dynamic expression
    expect(file.clientJs).toContain('function formatValue(x)')
  })

  it('excludes module functions only used in SSR attributes', async () => {
    const source = `
      "use client"

      function getDefaultValue() {
        return 'default'
      }

      function Component() {
        return <input value={getDefaultValue()} />
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Module function should NOT be included since it's only used in SSR
    expect(file.clientJs).not.toContain('function getDefaultValue')
  })

  it('excludes module functions only used in static JSX attributes', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function hasActiveItem(items, currentPath) {
        return items.some(item => item.href === currentPath)
      }

      function Component() {
        const items = [{ href: '/home' }]
        return <details defaultOpen={hasActiveItem(items, '/home')}>Content</details>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // hasActiveItem is only used for SSR attribute, not client code
    expect(file.clientJs).not.toContain('function hasActiveItem')
  })

  it('excludes module functions used only in local variable initialization', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function computeInitialValue() {
        return 42
      }

      function Component() {
        const initialValue = computeInitialValue()
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>Initial: {initialValue}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // computeInitialValue is only used in SSR (local variable init)
    expect(file.clientJs).not.toContain('function computeInitialValue')
  })
})

describe('Module Functions - Arrow Functions', () => {
  it('includes arrow function module helpers used in client code', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      const double = (n) => n * 2

      function Component() {
        const [count, setCount] = createSignal(1)
        return (
          <div>
            <p>{double(count())}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Arrow function module helper should be included
    expect(file.clientJs).toContain('double')
  })
})
