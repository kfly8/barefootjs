/**
 * Issue #138: Shorthand Property Syntax Bug Fix Tests
 *
 * Tests that shorthand object property syntax with props generates valid JavaScript.
 * With SolidJS-style props access, the compiler should convert { propName } to
 * { propName: __props.propName } for proper object access.
 *
 * NOTE: Local variables are SSR-only (Discussion #148), so these tests verify
 * the shorthand expansion in contexts where it's used in Client JS:
 * - Event handlers
 * - Child component props
 * - Dynamic text content
 *
 * @see https://github.com/kfly8/barefootjs/issues/138
 */

import { describe, it, expect } from 'bun:test'
import { compileWithFiles } from './test-helpers'
import { replacePropsWithObjectAccess } from '../../src/extractors/expression'

describe('Issue #138: Shorthand property in event handlers (Client JS)', () => {
  it('expands shorthand property in event handler function call', async () => {
    const files = {
      '/test/Button.tsx': `
        "use client"

        function logAction({ variant, size }) {
          console.log(\`Action: \${variant} \${size}\`)
        }

        function Button({ variant, size }) {
          return <button onClick={() => logAction({ variant, size })}>Click</button>
        }
        export default Button
      `,
    }
    const result = await compileWithFiles('/test/Button.tsx', files)
    const button = result.files.find(f => f.componentNames.includes('Button'))

    // Should NOT generate { variant(), size() } (method syntax - SyntaxError)
    expect(button!.clientJs).not.toContain('{ variant(), size() }')
    expect(button!.clientJs).not.toContain('{ variant()')
    expect(button!.clientJs).not.toContain(', size() }')

    // Should generate { variant: unwrap(__props.variant), size: unwrap(__props.size) } in event handler
    expect(button!.clientJs).toContain('variant: unwrap(__props.variant)')
    expect(button!.clientJs).toContain('size: unwrap(__props.size)')
  })

  it('handles single shorthand property in event handler', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn({ value }) {
          console.log(value * 2)
        }
        function Component({ value }) {
          return <button onClick={() => helperFn({ value })}>Click</button>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('value: unwrap(__props.value)')
    expect(comp!.clientJs).not.toContain('{ value() }')
  })

  it('handles multiple shorthand properties in event handler', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn({ a, b, c }) {
          console.log(a + b + c)
        }
        function Component({ a, b, c }) {
          return <button onClick={() => helperFn({ a, b, c })}>Click</button>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('a: unwrap(__props.a)')
    expect(comp!.clientJs).toContain('b: unwrap(__props.b)')
    expect(comp!.clientJs).toContain('c: unwrap(__props.c)')
  })
})

describe('Local variables are SSR-only - shorthand not in Client JS', () => {
  it('local variables with shorthand are NOT included in client JS', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn(options) {
          return JSON.stringify(options)
        }
        function Component({ variant, size }) {
          const result = helperFn({ variant, explicit: "value", size })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    // Local variable should NOT be in client JS (SSR-only)
    expect(comp!.clientJs).not.toContain('const result = helperFn')
  })

  it('attributes using local variables do not need shorthand expansion', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn({ value }) {
          return value * 2
        }
        function Component({ value }) {
          const result = helperFn({ value: value })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    // Local variable should NOT be in client JS (SSR-only)
    expect(comp!.clientJs).not.toContain('const result = helperFn')
  })
})

describe('replacePropsWithObjectAccess unit tests', () => {
  it('replaces simple identifier', () => {
    const result = replacePropsWithObjectAccess('const x = value + 1', ['value'])
    expect(result).toBe('const x = unwrap(__props.value) + 1')
  })

  it('replaces shorthand property', () => {
    const result = replacePropsWithObjectAccess('fn({ value })', ['value'])
    expect(result).toBe('fn({ value: unwrap(__props.value) })')
  })

  it('replaces multiple shorthand properties', () => {
    const result = replacePropsWithObjectAccess('fn({ a, b, c })', ['a', 'b', 'c'])
    expect(result).toBe('fn({ a: unwrap(__props.a), b: unwrap(__props.b), c: unwrap(__props.c) })')
  })

  it('handles mixed shorthand and explicit properties', () => {
    const result = replacePropsWithObjectAccess('fn({ a, x: 1, b })', ['a', 'b'])
    expect(result).toBe('fn({ a: unwrap(__props.a), x: 1, b: unwrap(__props.b) })')
  })

  it('skips property access right side', () => {
    const result = replacePropsWithObjectAccess('obj.value', ['value'])
    expect(result).toBe('obj.value')
  })

  it('skips property definition key', () => {
    // Use assignment to ensure it's parsed as object literal, not labeled statement
    const result = replacePropsWithObjectAccess('const x = { value: 123 }', ['value'])
    expect(result).toBe('const x = { value: 123 }')
  })

  it('keeps function call as is (not a prop)', () => {
    const result = replacePropsWithObjectAccess('value()', ['value'])
    // Function calls are kept as-is - caller might be calling a local function
    expect(result).toBe('unwrap(__props.value)()')
  })

  it('skips function parameter', () => {
    const result = replacePropsWithObjectAccess('(value) => value * 2', ['value'])
    // Only the usage should be replaced, not the parameter
    expect(result).toBe('(value) => unwrap(__props.value) * 2')
  })

  it('skips variable declaration left side', () => {
    const result = replacePropsWithObjectAccess('const value = 1', ['value'])
    expect(result).toBe('const value = 1')
  })

  it('skips destructuring binding', () => {
    const result = replacePropsWithObjectAccess('const { value } = obj', ['value'])
    expect(result).toBe('const { value } = obj')
  })

  it('handles template literals', () => {
    const result = replacePropsWithObjectAccess('`Hello ${value}`', ['value'])
    expect(result).toBe('`Hello ${unwrap(__props.value)}`')
  })

  it('preserves string literals', () => {
    const result = replacePropsWithObjectAccess('"value"', ['value'])
    expect(result).toBe('"value"')
  })

  it('handles complex expression', () => {
    const result = replacePropsWithObjectAccess(
      'fn({ variant, size }) + variant + obj.variant',
      ['variant', 'size']
    )
    expect(result).toBe('fn({ variant: unwrap(__props.variant), size: unwrap(__props.size) }) + unwrap(__props.variant) + obj.variant')
  })

  it('returns empty string unchanged', () => {
    const result = replacePropsWithObjectAccess('', ['value'])
    expect(result).toBe('')
  })

  it('returns code unchanged when no props', () => {
    const result = replacePropsWithObjectAccess('const x = value', [])
    expect(result).toBe('const x = value')
  })

  it('uses custom props object name', () => {
    const result = replacePropsWithObjectAccess('const x = value', ['value'], 'props')
    expect(result).toBe('const x = unwrap(props.value)')
  })
})
