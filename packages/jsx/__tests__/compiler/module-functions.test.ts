/**
 * Module Functions Tests
 *
 * ## Overview
 * Verifies that module-level helper functions (defined outside components)
 * are correctly included in client JS for "use client" components.
 *
 * ## Issue #152: Helper functions not included
 * Module functions defined outside components should be included in client JS,
 * similar to how local variables are handled. This ensures they are available
 * at runtime regardless of where they are used in the component.
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Module Functions - Inclusion', () => {
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

    // Module function should be included
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

    // Module function should be included
    expect(file.clientJs).toContain('function formatValue(x)')
  })

  it('includes module functions used in SSR attributes', async () => {
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

    // Module function should be included even if only used in SSR
    // This matches behavior of local variables
    expect(file.clientJs).toContain('function getDefaultValue()')
  })

  it('includes module functions used in static JSX attributes', async () => {
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

    // Module function should be included
    expect(file.clientJs).toContain('function hasActiveItem(items, currentPath)')
  })

  it('includes module functions used in local variable initialization', async () => {
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

    // Module function should be included
    expect(file.clientJs).toContain('function computeInitialValue()')
  })
})

describe('Module Functions - Arrow Functions', () => {
  it('includes arrow function module helpers', async () => {
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
