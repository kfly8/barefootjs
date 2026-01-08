/**
 * Issue #138: Shorthand Property Syntax Bug Fix Tests
 *
 * Tests that shorthand object property syntax with reactive props generates
 * valid JavaScript. The compiler should convert { propName } to { propName: propName() }
 * not { propName() } (which is method definition syntax and causes SyntaxError).
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
import { replacePropsWithGetterCallsAST } from '../../src/extractors/expression'

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

    // Should generate { variant: variant(), size: size() } in event handler
    expect(button!.clientJs).toContain('variant: variant()')
    expect(button!.clientJs).toContain('size: size()')
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

    expect(comp!.clientJs).toContain('value: value()')
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

    expect(comp!.clientJs).toContain('a: a()')
    expect(comp!.clientJs).toContain('b: b()')
    expect(comp!.clientJs).toContain('c: c()')
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

describe('replacePropsWithGetterCallsAST unit tests', () => {
  it('replaces simple identifier', () => {
    const result = replacePropsWithGetterCallsAST('const x = value + 1', ['value'])
    expect(result).toBe('const x = value() + 1')
  })

  it('replaces shorthand property', () => {
    const result = replacePropsWithGetterCallsAST('fn({ value })', ['value'])
    expect(result).toBe('fn({ value: value() })')
  })

  it('replaces multiple shorthand properties', () => {
    const result = replacePropsWithGetterCallsAST('fn({ a, b, c })', ['a', 'b', 'c'])
    expect(result).toBe('fn({ a: a(), b: b(), c: c() })')
  })

  it('handles mixed shorthand and explicit properties', () => {
    const result = replacePropsWithGetterCallsAST('fn({ a, x: 1, b })', ['a', 'b'])
    expect(result).toBe('fn({ a: a(), x: 1, b: b() })')
  })

  it('skips property access right side', () => {
    const result = replacePropsWithGetterCallsAST('obj.value', ['value'])
    expect(result).toBe('obj.value')
  })

  it('skips property definition key', () => {
    // Use assignment to ensure it's parsed as object literal, not labeled statement
    const result = replacePropsWithGetterCallsAST('const x = { value: 123 }', ['value'])
    expect(result).toBe('const x = { value: 123 }')
  })

  it('skips already called function', () => {
    const result = replacePropsWithGetterCallsAST('value()', ['value'])
    expect(result).toBe('value()')
  })

  it('skips function parameter', () => {
    const result = replacePropsWithGetterCallsAST('(value) => value * 2', ['value'])
    // Only the usage should be replaced, not the parameter
    expect(result).toBe('(value) => value() * 2')
  })

  it('skips variable declaration left side', () => {
    const result = replacePropsWithGetterCallsAST('const value = 1', ['value'])
    expect(result).toBe('const value = 1')
  })

  it('skips destructuring binding', () => {
    const result = replacePropsWithGetterCallsAST('const { value } = obj', ['value'])
    expect(result).toBe('const { value } = obj')
  })

  it('handles template literals', () => {
    const result = replacePropsWithGetterCallsAST('`Hello ${value}`', ['value'])
    expect(result).toBe('`Hello ${value()}`')
  })

  it('preserves string literals', () => {
    const result = replacePropsWithGetterCallsAST('"value"', ['value'])
    expect(result).toBe('"value"')
  })

  it('handles complex expression', () => {
    const result = replacePropsWithGetterCallsAST(
      'fn({ variant, size }) + variant + obj.variant',
      ['variant', 'size']
    )
    expect(result).toBe('fn({ variant: variant(), size: size() }) + variant() + obj.variant')
  })

  it('returns empty string unchanged', () => {
    const result = replacePropsWithGetterCallsAST('', ['value'])
    expect(result).toBe('')
  })

  it('returns code unchanged when no props', () => {
    const result = replacePropsWithGetterCallsAST('const x = value', [])
    expect(result).toBe('const x = value')
  })
})
