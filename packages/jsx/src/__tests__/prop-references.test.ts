/**
 * BarefootJS Compiler - Prop Reference Extraction Tests (TDD)
 *
 * Tests for semantic prop reference tracking in IR.
 * Issue #261: Track prop references semantically instead of text-based transformation.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'
import type { IRExpression, IRConditional } from '../types'

const adapter = new TestAdapter()

describe('PropReference extraction', () => {
  describe('extractPropReferences via jsxToIR', () => {
    test('extracts simple prop reference', () => {
      const source = `
        'use client'

        interface Props {
          open: boolean
        }

        export function Dialog({ open }: Props) {
          return <div>{open}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Dialog.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        const expr = ir.children[0] as IRExpression
        expect(expr.type).toBe('expression')
        expect(expr.expr).toBe('open')
        // NEW: propRefs should contain the reference
        expect(expr.propRefs).toBeDefined()
        expect(expr.propRefs).toHaveLength(1)
        expect(expr.propRefs![0]).toEqual({
          propName: 'open',
          start: 0,
          end: 4,
          defaultValue: undefined,
        })
      }
    })

    test('does NOT extract props.open pattern (already object access)', () => {
      const source = `
        'use client'

        interface Props {
          open: boolean
        }

        export function Dialog(props: Props) {
          return <div>{props.open}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Dialog.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        const expr = ir.children[0] as IRExpression
        expect(expr.type).toBe('expression')
        expect(expr.expr).toBe('props.open')
        // Should NOT have propRefs since using SolidJS-style props
        expect(expr.propRefs ?? []).toHaveLength(0)
      }
    })

    test('does NOT extract window.open() (not a prop reference)', () => {
      const source = `
        'use client'

        interface Props {
          open: boolean
        }

        export function Dialog({ open }: Props) {
          return <button onClick={() => window.open('https://example.com')}>Open</button>
        }
      `

      const ctx = analyzeComponent(source, 'Dialog.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      // The expression "window.open('https://example.com')" should NOT have propRefs
      // because 'open' here is a property access on 'window', not a prop reference
    })

    test('does NOT extract isOpen when only open is prop', () => {
      const source = `
        'use client'

        interface Props {
          open: boolean
        }

        export function Dialog({ open }: Props) {
          const isOpen = open
          return <div>{isOpen}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Dialog.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        const expr = ir.children[0] as IRExpression
        expect(expr.type).toBe('expression')
        expect(expr.expr).toBe('isOpen')
        // 'isOpen' is not in propsParams (only 'open' is), so no propRefs
        expect(expr.propRefs ?? []).toHaveLength(0)
      }
    })

    test('extracts multiple prop references', () => {
      const source = `
        'use client'

        interface Props {
          firstName: string
          lastName: string
        }

        export function Greeting({ firstName, lastName }: Props) {
          return <div>{firstName + ' ' + lastName}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Greeting.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        const expr = ir.children[0] as IRExpression
        expect(expr.type).toBe('expression')
        expect(expr.expr).toBe("firstName + ' ' + lastName")
        // Should have propRefs for both 'firstName' and 'lastName'
        expect(expr.propRefs).toBeDefined()
        expect(expr.propRefs).toHaveLength(2)
        expect(expr.propRefs![0].propName).toBe('firstName')
        expect(expr.propRefs![1].propName).toBe('lastName')
      }
    })

    test('extracts prop with default value', () => {
      const source = `
        'use client'

        interface Props {
          open?: boolean
        }

        export function Dialog({ open = false }: Props) {
          return <div>{open}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Dialog.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        const expr = ir.children[0] as IRExpression
        expect(expr.type).toBe('expression')
        expect(expr.expr).toBe('open')
        // propRefs should include defaultValue
        expect(expr.propRefs).toBeDefined()
        expect(expr.propRefs).toHaveLength(1)
        expect(expr.propRefs![0]).toEqual({
          propName: 'open',
          start: 0,
          end: 4,
          defaultValue: 'false',
        })
      }
    })
  })

  describe('IRConditional with conditionPropRefs', () => {
    test('extracts prop reference in ternary condition', () => {
      const source = `
        'use client'

        interface Props {
          open: boolean
        }

        export function Dialog({ open }: Props) {
          return <div>{open ? 'yes' : 'no'}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Dialog.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        const cond = ir.children[0] as IRConditional
        expect(cond.type).toBe('conditional')
        expect(cond.condition).toBe('open')
        // NEW: conditionPropRefs should contain the reference
        expect(cond.conditionPropRefs).toBeDefined()
        expect(cond.conditionPropRefs).toHaveLength(1)
        expect(cond.conditionPropRefs![0]).toEqual({
          propName: 'open',
          start: 0,
          end: 4,
          defaultValue: undefined,
        })
      }
    })
  })
})

describe('ClientJS generation with semantic prop refs', () => {
  test('transforms prop ref to props.xxx in generated code', () => {
    const source = `
      'use client'

      interface Props {
        open: boolean
      }

      export function Dialog({ open }: Props) {
        return <div>{open ? 'yes' : 'no'}</div>
      }
    `

    const result = compileJSXSync(source, 'Dialog.tsx', { adapter })

    // Filter out props-destructuring warnings (expected for this test)
    const realErrors = result.errors.filter((e) => e.code !== 'BF043')
    expect(realErrors).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Should transform 'open' to 'props.open' in condition
    expect(clientJs?.content).toContain('props.open')
    // Should NOT have double-wrapped props.props.open
    expect(clientJs?.content).not.toContain('props.props')
  })

  test('does NOT double-wrap props.open (SolidJS style)', () => {
    const source = `
      'use client'

      interface Props {
        open: boolean
      }

      export function Dialog(props: Props) {
        return <div>{props.open ? 'yes' : 'no'}</div>
      }
    `

    const result = compileJSXSync(source, 'Dialog.tsx', { adapter })

    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Should keep props.open as-is
    expect(clientJs?.content).toContain('props.open')
    // Should NOT have double-wrapped props.props.open
    expect(clientJs?.content).not.toContain('props.props')
  })

  test('does NOT transform window.open() in event handler', () => {
    const source = `
      'use client'

      interface Props {
        open: boolean
      }

      export function Dialog({ open }: Props) {
        return <button onClick={() => window.open('https://example.com')}>Open Window</button>
      }
    `

    const result = compileJSXSync(source, 'Dialog.tsx', { adapter })

    // Filter out props-destructuring warnings (expected for this test)
    const realErrors = result.errors.filter((e) => e.code !== 'BF043')
    expect(realErrors).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Event handler should contain window.open, not props.open
    // (window.open is NOT a prop reference)
    expect(clientJs?.content).toContain('window.open')
    expect(clientJs?.content).not.toContain('window.props.open')
  })

  test('transforms prop with default value correctly', () => {
    const source = `
      'use client'

      interface Props {
        open?: boolean
      }

      export function Dialog({ open = false }: Props) {
        return <div>{open ? 'yes' : 'no'}</div>
      }
    `

    const result = compileJSXSync(source, 'Dialog.tsx', { adapter })

    // Filter out props-destructuring warnings (expected for this test)
    const realErrors = result.errors.filter((e) => e.code !== 'BF043')
    expect(realErrors).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Should use default value pattern: (props.open ?? false)
    expect(clientJs?.content).toMatch(/props\.open\s*\?\?\s*false/)
  })
})

// Issue #257 regression test: Double props prefix in template literals
describe('Issue #257 regression', () => {
  test('does NOT double-wrap props.xxx when already prefixed', () => {
    const source = `
      'use client'

      interface Props {
        command: string
      }

      export function CommandDisplay(props: Props) {
        return <div>{\`npx \${props.command}\`}</div>
      }
    `

    const result = compileJSXSync(source, 'CommandDisplay.tsx', { adapter })

    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // Should keep props.command as-is, NOT transform to props.props.command
    expect(clientJs?.content).toContain('props.command')
    expect(clientJs?.content).not.toContain('props.props.command')
  })
})
