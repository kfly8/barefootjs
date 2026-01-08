/**
 * Tests for local variables in JSX attribute expressions
 *
 * ## Overview
 * Local variables are SSR-only - they are evaluated once at server render time
 * and are NOT included in Client JS. For reactive computations, developers
 * should use createSignal/createMemo.
 *
 * ## Design Decision (Discussion #148)
 * - localVariables are SSR-only, NOT included in Client JS
 * - Attributes that only reference local variables don't need createEffect
 * - For reactive updates, use createSignal/createMemo
 *
 * ## Related
 * - Issue #69: Support local variables and function calls in JSX attribute expressions
 * - Discussion #148: Two-Value Classification design
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Local variables are SSR-only', () => {
  it('local variables are NOT included in client JS', async () => {
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

    // Local variable declaration should NOT be in client JS (SSR-only)
    expect(file.clientJs).not.toContain('const placementClass')
    // Attributes using local variables should NOT have createEffect
    expect(file.clientJs).not.toContain('placementClass')
  })

  it('attributes using local variables do not generate createEffect', async () => {
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

    // Local variables should NOT be in client JS (SSR-only)
    expect(file.clientJs).not.toContain('const placementClass')
    expect(file.clientJs).not.toContain('const sizeClass')
    // No createEffect call for class attribute that uses local variables
    // Note: createEffect may be imported but not called
    expect(file.clientJs).not.toContain('createEffect(() =>')
  })

  it('local variables in Marked JSX are preserved for SSR', async () => {
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

    // Local variable should be in Marked JSX for SSR evaluation
    expect(file.markedJsx).toContain('const placementClass = getPlacementClass(placement)')
    // But NOT in client JS
    expect(file.clientJs).not.toContain('const placementClass')
  })

  it('signal declarations are still included in client JS', async () => {
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

    // Signal declaration should be in client JS (reactive)
    expect(file.clientJs).toContain('const [count, setCount] = createSignal(0)')
    // But derived value (local variable) should NOT be in client JS
    // For reactive derived values, use createMemo instead
    expect(file.clientJs).not.toContain('const doubled = count() * 2')
  })

  it('arrow functions used in event handlers are included in client JS', async () => {
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

    // Arrow function used in event handler should be in client JS
    expect(file.clientJs).toContain('const increment = () =>')
    // But derived value (local variable) should NOT be in client JS
    expect(file.clientJs).not.toContain('const doubled = count() * 2')
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
