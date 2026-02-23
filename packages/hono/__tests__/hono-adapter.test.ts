/**
 * Hono Adapter Tests
 *
 * Conformance tests (shared across adapters) + Hono-specific tests.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '@barefootjs/jsx'
import { HonoAdapter } from '../src/adapter'
import { runConformanceTests } from '@barefootjs/adapter-tests'

// =============================================================================
// Shared Conformance Tests (~50 cases)
// =============================================================================

runConformanceTests({
  createAdapter: () => new HonoAdapter({ injectScriptCollection: false }),
})

// =============================================================================
// Hono-Specific Tests
// =============================================================================

const adapter = new HonoAdapter({ injectScriptCollection: false })

describe('HonoAdapter - Adapter Specific', () => {
  test('parenthesizes object literal signal initializers in generated getters', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/dom'

      export function Example() {
        const [position, setPosition] = createSignal({ x: 0, y: 0 })
        return <div>{position().x}</div>
      }
    `

    const result = compileJSXSync(source, 'Example.tsx', { adapter })

    expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
    const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
    expect(markedTemplate).toBeDefined()
    expect(markedTemplate?.content).toContain('const position = () => ({ x: 0, y: 0 })')
  })

  describe('localFunctions', () => {
    test('includes helper functions in generated template', () => {
      const source = `
        'use client'

        function isValidElement(element: unknown): element is { tag: unknown } {
          return !!(element && typeof element === 'object' && 'tag' in element)
        }

        export function Slot({ children }: { children?: any }) {
          if (children && isValidElement(children)) {
            return <div>valid</div>
          }
          return <>{children}</>
        }
      `

      const result = compileJSXSync(source, 'Slot.tsx', { adapter })

      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

      const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
      expect(markedTemplate).toBeDefined()
      expect(markedTemplate?.content).toContain('function isValidElement(element)')
    })

    test('includes multiple helper functions', () => {
      const source = `
        'use client'

        function helperA(x: number): number {
          return x + 1
        }

        function helperB(s: string): boolean {
          return s.length > 0
        }

        export function MyComponent({ value }: { value?: number }) {
          const result = helperA(value || 0)
          const valid = helperB('test')
          return <div>{result}</div>
        }
      `

      const result = compileJSXSync(source, 'MyComponent.tsx', { adapter })

      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)

      const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
      expect(markedTemplate).toBeDefined()
      expect(markedTemplate?.content).toContain('function helperA(x)')
      expect(markedTemplate?.content).toContain('function helperB(s)')
    })
  })
})
