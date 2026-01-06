/**
 * Issue #138: Shorthand Property Syntax Bug Fix Tests
 *
 * Tests that shorthand object property syntax with reactive props generates
 * valid JavaScript. The compiler should convert { propName } to { propName: propName() }
 * not { propName() } (which is method definition syntax and causes SyntaxError).
 *
 * @see https://github.com/kfly8/barefootjs/issues/138
 */

import { describe, it, expect } from 'bun:test'
import { compileWithFiles } from './test-helpers'
import { replacePropsWithGetterCallsAST } from '../../src/extractors/expression'

describe('Issue #138: Shorthand property syntax in prop replacement', () => {
  it('expands shorthand property in function call', async () => {
    const files = {
      '/test/Button.tsx': `
        "use client"

        function buttonVariants({ variant, size }) {
          return \`btn-\${variant}-\${size}\`
        }

        function Button({ variant, size }) {
          const buttonClass = buttonVariants({ variant, size })
          return <button class={buttonClass}>Click</button>
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

    // Should generate { variant: variant(), size: size() }
    expect(button!.clientJs).toContain('variant: variant()')
    expect(button!.clientJs).toContain('size: size()')
  })

  it('handles single shorthand property', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn({ value }) {
          return value * 2
        }
        function Component({ value }) {
          const result = helperFn({ value })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('value: value()')
    expect(comp!.clientJs).not.toContain('{ value() }')
  })

  it('handles multiple shorthand properties', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn({ a, b, c }) {
          return a + b + c
        }
        function Component({ a, b, c }) {
          const result = helperFn({ a, b, c })
          return <div data-result={result}>{result}</div>
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

  it('handles mixed explicit and shorthand properties', async () => {
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

    expect(comp!.clientJs).toContain('variant: variant()')
    expect(comp!.clientJs).toContain('size: size()')
    expect(comp!.clientJs).toContain('explicit: "value"')
  })

  it('preserves already explicit property syntax', async () => {
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

    // Should be value: value(), not value: value: value()
    expect(comp!.clientJs).toContain('value: value()')
    expect(comp!.clientJs).not.toContain('value: value: value()')
  })

  it('handles nested objects with shorthand', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn(options) {
          return JSON.stringify(options)
        }
        function Component({ variant }) {
          const result = helperFn({ outer: { variant } })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('variant: variant()')
  })

  it('does not affect non-object-literal usage', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function Component({ value }) {
          const result = value + 1
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    // value should become value() in expression
    expect(comp!.clientJs).toContain('value() + 1')
  })

  it('handles shorthand at start of object', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn(options) {
          return JSON.stringify(options)
        }
        function Component({ first }) {
          const result = helperFn({ first, other: 123 })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('first: first()')
  })

  it('handles shorthand at end of object', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn(options) {
          return JSON.stringify(options)
        }
        function Component({ last }) {
          const result = helperFn({ other: 123, last })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('last: last()')
  })

  it('handles shorthand with spread operator', async () => {
    const files = {
      '/test/Component.tsx': `
        "use client"
        function helperFn(options) {
          return JSON.stringify(options)
        }
        function Component({ variant }) {
          const base = { a: 1 }
          const result = helperFn({ ...base, variant })
          return <div data-result={result}>{result}</div>
        }
        export default Component
      `,
    }
    const result = await compileWithFiles('/test/Component.tsx', files)
    const comp = result.files.find(f => f.componentNames.includes('Component'))

    expect(comp!.clientJs).toContain('variant: variant()')
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
