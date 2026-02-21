/**
 * Class Attribute Error Tests
 *
 * Tests for BF050: Emit compile error when `class=` is used in JSX attributes.
 * JSX requires `className` instead of the HTML `class` attribute.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { compileJSXSync } from '../compiler'
import { ErrorCodes } from '../errors'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

/**
 * Helper: analyze and transform to IR, returning errors from ctx.
 */
function compileToIR(source: string) {
  const ctx = analyzeComponent(source, 'Test.tsx')
  const ir = jsxToIR(ctx)
  return { ctx, ir, errors: ctx.errors }
}

describe('Class Attribute (BF050)', () => {
  describe('positive cases — should emit BF050', () => {
    test('class= on native element', () => {
      const source = `
        export function Button() {
          return <div class="foo" />
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(1)
      expect(bf050[0].severity).toBe('error')
    })

    test('class= on custom component', () => {
      const source = `
        import { Button } from './Button'

        export function App() {
          return <Button class="mt-4">Click me</Button>
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(1)
      expect(bf050[0].severity).toBe('error')
    })

    test('error suggestion points to className', () => {
      const source = `
        export function Button() {
          return <div class="foo" />
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.find(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toBeDefined()
      expect(bf050!.suggestion).toBeDefined()
      expect(bf050!.suggestion!.replacement).toBe('className')
    })

    test('multiple class= attributes each emit BF050', () => {
      const source = `
        export function Layout() {
          return (
            <div class="wrapper">
              <span class="label">hello</span>
            </div>
          )
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(2)
    })
  })

  describe('negative cases — should NOT emit BF050', () => {
    test('className= on native element', () => {
      const source = `
        export function Button() {
          return <div className="foo" />
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(0)
    })

    test('className= on custom component', () => {
      const source = `
        import { Button } from './Button'

        export function App() {
          return <Button className="mt-4">Click me</Button>
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(0)
    })

    test('className with dynamic value', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function Toggle() {
          const [active, setActive] = createSignal(false)
          return <div className={active() ? 'on' : 'off'} />
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(0)
    })

    test('"class" as a string literal in JSX children is not flagged', () => {
      const source = `
        export function Label() {
          return <span>{"class"}</span>
        }
      `

      const { errors } = compileToIR(source)
      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(0)
    })
  })

  describe('integration', () => {
    test('IR is still produced despite BF050 error', () => {
      const source = `
        export function Button() {
          return <div class="foo" />
        }
      `

      const { ir, errors } = compileToIR(source)

      const bf050 = errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)
      expect(bf050).toHaveLength(1)

      expect(ir).not.toBeNull()
      expect(ir!.type).toBe('element')
    })

    test('compileJSXSync includes BF050 in result errors', () => {
      const source = `
        export function Button() {
          return <div class="foo" />
        }
      `

      const result = compileJSXSync(source, 'Button.tsx', { adapter })
      const bf050 = result.errors.filter(e => e.code === ErrorCodes.CLASS_ATTRIBUTE)

      expect(bf050).toHaveLength(1)
      expect(bf050[0].severity).toBe('error')
    })
  })
})
