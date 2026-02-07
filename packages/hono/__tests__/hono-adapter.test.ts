/**
 * Hono Adapter Tests
 *
 * Tests for the HonoAdapter's template generation,
 * focusing on correct handling of component metadata.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '@barefootjs/jsx'
import { HonoAdapter } from '../src/adapter'

const adapter = new HonoAdapter({ injectScriptCollection: false })

describe('HonoAdapter', () => {
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
      // The helper function should be included in the output
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
