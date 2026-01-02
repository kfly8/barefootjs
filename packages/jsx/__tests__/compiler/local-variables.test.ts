/**
 * Tests for local variables in JSX attribute expressions
 *
 * ## Overview
 * Verifies that local variable declarations within component functions
 * are correctly extracted and included in both Marked JSX and Client JS.
 *
 * ## Supported patterns
 * - Object property access: `const placementClass = styles[placement]`
 * - Function call results: `const formatted = formatValue(value)`
 * - Template literals with local variables: `class={\`container ${typeClass}\`}`
 * - Multiple local variables in expressions
 *
 * ## Related
 * - Issue #69: Support local variables and function calls in JSX attribute expressions
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Local variables in dynamic attributes', () => {
  it('extracts local variable used in class attribute', async () => {
    const source = `
      "use client"
      const placementStyles = {
        top: 'bottom-full mb-2',
        right: 'left-full ml-2',
      }
      function Component({ placement = 'top' }) {
        const placementClass = placementStyles[placement]
        return <div class={\`absolute \${placementClass}\`}>Content</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Local variable declaration should be in client JS
    // Note: props are converted to function calls (placement -> placement())
    expect(file.clientJs).toContain('const placementClass = placementStyles[placement()]')
  })

  it('extracts multiple local variables', async () => {
    const source = `
      "use client"
      const placementStyles = { top: 'top-class', bottom: 'bottom-class' }
      const sizeStyles = { sm: 'small', lg: 'large' }
      function Component({ placement = 'top', size = 'sm' }) {
        const placementClass = placementStyles[placement]
        const sizeClass = sizeStyles[size]
        return <div class={\`\${placementClass} \${sizeClass}\`}>Content</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Both local variables should be in client JS
    // Note: props are converted to function calls
    expect(file.clientJs).toContain('const placementClass = placementStyles[placement()]')
    expect(file.clientJs).toContain('const sizeClass = sizeStyles[size()]')
  })

  it('extracts local variable from function call', async () => {
    const source = `
      "use client"
      function getPlacementClass(placement) {
        return placement === 'top' ? 'top-class' : 'other-class'
      }
      function Component({ placement = 'top' }) {
        const placementClass = getPlacementClass(placement)
        return <div class={placementClass}>Content</div>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Local variable from function call should be in client JS
    // Note: props are converted to function calls
    expect(file.clientJs).toContain('const placementClass = getPlacementClass(placement())')
  })

  it('does not extract signal declarations as local variables', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        const doubled = count() * 2
        return <span data-value={doubled}>{count()}</span>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Signal declaration should not be in local variables section
    // (it's handled separately by signal extraction)
    expect(file.clientJs).toContain('const [count, setCount] = createSignal(0)')
    // But derived value should be extracted as local variable
    expect(file.clientJs).toContain('const doubled = count() * 2')
  })

  it('does not extract arrow function as local variable', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        const increment = () => setCount(c => c + 1)
        const doubled = count() * 2
        return (
          <div>
            <span data-value={doubled}>{count()}</span>
            <button onClick={increment}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Arrow function should be in local functions, not local variables
    // (local functions are handled separately)
    expect(file.clientJs).toContain('const increment = () =>')
    // Derived value should be in local variables
    expect(file.clientJs).toContain('const doubled = count() * 2')
  })
})

describe('Local variables in Marked JSX', () => {
  it('includes local variables in generated Marked JSX', async () => {
    const source = `
      "use client"
      const styles = { primary: 'btn-primary', secondary: 'btn-secondary' }
      function Component({ variant = 'primary' }) {
        const variantClass = styles[variant]
        return <button class={variantClass}>Click</button>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Marked JSX should include the local variable declaration
    // so it can be evaluated at server render time
    expect(file.markedJsx).toContain('const variantClass = styles[variant]')
  })
})
