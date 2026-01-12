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

/**
 * Issue #174: Module functions missing in SSR output
 *
 * Module-level helper functions should be included in the Marked JSX output
 * for SSR, not just in client JS. Without this, functions called at render
 * time cause ReferenceError on the server.
 */
describe('Module Functions - SSR Output (Issue #174)', () => {
  it('includes module functions in marked JSX for SSR', async () => {
    const source = `
      "use client"

      function isComplexDefinition(def) {
        return typeof def === 'object' && 'elements' in def
      }

      function Component() {
        const def = { elements: [] }
        if (isComplexDefinition(def)) {
          return <div>Complex</div>
        }
        return <div>Simple</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Module function should be included in BOTH client JS and marked JSX
    expect(file.clientJs).toContain('function isComplexDefinition(def)')
    expect(file.markedJsx).toContain('function isComplexDefinition(def)')
  })

  it('includes multiple module functions in marked JSX', async () => {
    const source = `
      "use client"

      function helperOne(x) {
        return x + 1
      }

      function helperTwo(y) {
        return y * 2
      }

      const helperThree = (z) => z - 1

      function Component() {
        return <div>{helperOne(1) + helperTwo(2) + helperThree(3)}</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // All module functions should be in marked JSX
    expect(file.markedJsx).toContain('function helperOne(x)')
    expect(file.markedJsx).toContain('function helperTwo(y)')
    expect(file.markedJsx).toContain('const helperThree = (z) => z - 1')
  })

  it('includes module functions used in conditional rendering', async () => {
    const source = `
      "use client"

      function shouldRender(flag) {
        return flag === true
      }

      function Component({ show }) {
        if (shouldRender(show)) {
          return <span>Visible</span>
        }
        return null
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Module function used in conditional should be in SSR output
    expect(file.markedJsx).toContain('function shouldRender(flag)')
  })

  it('includes type guard functions in marked JSX', async () => {
    const source = `
      "use client"

      type IconDefinition = { elements: string[] }
      type IconPath = string

      function isIconDefinition(def: IconPath | IconDefinition): def is IconDefinition {
        return typeof def === 'object' && 'elements' in def
      }

      function renderIcon(def: IconPath | IconDefinition) {
        if (isIconDefinition(def)) {
          return def.elements.join('')
        }
        return def
      }

      function Icon({ definition }: { definition: IconPath | IconDefinition }) {
        return <svg>{renderIcon(definition)}</svg>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Type guard and helper functions should be in SSR output
    expect(file.markedJsx).toContain('function isIconDefinition(def)')
    expect(file.markedJsx).toContain('function renderIcon(def)')
  })
})

/**
 * Issue #176: Helper function JSX not compiled correctly in 'use client' files
 *
 * Module-level helper functions that return JSX are SSR-only:
 * - For Marked JSX (SSR): JSX is preserved as-is
 * - For Client JS: JSX-containing functions are NOT included (SSR-only by design)
 *
 * This is because BarefootJS updates DOM directly without re-rendering JSX on the client.
 * Helper functions with JSX are only needed at SSR time to generate the initial HTML.
 */
describe('Module Functions - JSX Transformation (Issue #176)', () => {
  it('preserves JSX in helper functions for SSR (Marked JSX)', async () => {
    const source = `
      "use client"

      function renderPath(d: string) {
        return <path d={d} />
      }

      function Component() {
        return <svg>{renderPath('M0 0')}</svg>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Marked JSX should preserve JSX syntax (not jsx() calls)
    // Note: TypeScript's JSX Preserve mode may remove spaces before />
    expect(file.markedJsx).toContain('<path d={d}')
    expect(file.markedJsx).not.toContain('jsx("path"')
  })

  it('does not include JSX-containing helper functions in Client JS (SSR-only)', async () => {
    const source = `
      "use client"

      function renderPath(d: string) {
        return <path d={d} />
      }

      function Component() {
        return <svg>{renderPath('M0 0')}</svg>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // JSX-containing helper functions are SSR-only, not in Client JS
    expect(file.clientJs).not.toContain('renderPath')
    expect(file.clientJs).not.toContain('jsx("path"')
    expect(file.clientJs).not.toContain('<path')
  })

  it('does not import hono/jsx/dom (no JSX runtime needed)', async () => {
    const source = `
      "use client"

      function renderItem(text: string) {
        return <span>{text}</span>
      }

      function Component() {
        return <div>{renderItem('test')}</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // No JSX runtime import needed - JSX helpers are SSR-only
    expect(file.clientJs).not.toContain("import { jsx")
    expect(file.clientJs).not.toContain("from 'hono/jsx/dom'")
  })

  it('handles complex JSX patterns (Issue #176 reproduction)', async () => {
    const source = `
      "use client"

      type IconElement = { type: 'path', d: string } | { type: 'circle', cx: number, cy: number, r: number }

      function renderElements(elements: IconElement[]) {
        return elements.map((el) => {
          if (el.type === 'path') {
            return <path d={el.d} />
          }
          if (el.type === 'circle') {
            return <circle cx={el.cx} cy={el.cy} r={el.r} />
          }
          return null
        })
      }

      function Icon({ elements }: { elements: IconElement[] }) {
        return <svg>{renderElements(elements)}</svg>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Marked JSX should preserve JSX
    // Note: TypeScript's JSX Preserve mode may remove spaces before />
    expect(file.markedJsx).toContain('<path d={el.d}')
    expect(file.markedJsx).toContain('<circle cx={el.cx}')

    // Client JS should NOT contain JSX-related code (SSR-only)
    expect(file.clientJs).not.toContain('renderElements')
    expect(file.clientJs).not.toContain('jsx("path"')
  })

  it('handles arrow functions with JSX', async () => {
    const source = `
      "use client"

      const renderLabel = (text: string) => <label>{text}</label>

      function Component() {
        return <div>{renderLabel('Name')}</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Marked JSX should preserve JSX
    expect(file.markedJsx).toContain('<label>{text}</label>')

    // Client JS should NOT contain JSX-related code (SSR-only)
    expect(file.clientJs).not.toContain('renderLabel')
  })

  it('handles nested JSX in helper functions', async () => {
    const source = `
      "use client"

      function renderCard(title: string, content: string) {
        return (
          <div class="card">
            <h2>{title}</h2>
            <p>{content}</p>
          </div>
        )
      }

      function Component() {
        return <section>{renderCard('Hello', 'World')}</section>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Marked JSX should preserve JSX structure
    expect(file.markedJsx).toContain('<div class="card">')
    expect(file.markedJsx).toContain('<h2>{title}</h2>')
    expect(file.markedJsx).toContain('<p>{content}</p>')

    // Client JS should NOT contain JSX-related code (SSR-only)
    expect(file.clientJs).not.toContain('renderCard')
  })

  it('includes non-JSX helper functions in both SSR and Client JS', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'

      function formatValue(x: number) {
        return 'Value: ' + x
      }

      function Component() {
        const [count, setCount] = createSignal(0)
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

    // Non-JSX helper functions should be in both outputs
    expect(file.markedJsx).toContain('function formatValue(x)')
    expect(file.clientJs).toContain('function formatValue(x)')

    // Should NOT import jsx/jsxs/Fragment
    expect(file.clientJs).not.toContain("import { jsx")
    expect(file.clientJs).not.toContain("from 'hono/jsx/dom'")
  })
})
