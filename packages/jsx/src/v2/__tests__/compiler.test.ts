/**
 * BarefootJS Compiler v2 - Basic Tests
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'

describe('Compiler v2', () => {
  describe('analyzeComponent', () => {
    test('extracts signals', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div>{count()}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Counter.tsx')

      expect(ctx.componentName).toBe('Counter')
      expect(ctx.signals).toHaveLength(1)
      expect(ctx.signals[0].getter).toBe('count')
      expect(ctx.signals[0].setter).toBe('setCount')
      expect(ctx.signals[0].initialValue).toBe('0')
      expect(ctx.hasUseClientDirective).toBe(true)
    })

    test('extracts props', () => {
      const source = `
        'use client'

        interface CounterProps {
          initial?: number
        }

        export function Counter({ initial = 0 }: CounterProps) {
          return <div>{initial}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Counter.tsx')

      expect(ctx.componentName).toBe('Counter')
      expect(ctx.propsParams).toHaveLength(1)
      expect(ctx.propsParams[0].name).toBe('initial')
      expect(ctx.propsParams[0].defaultValue).toBe('0')
      expect(ctx.typeDefinitions).toHaveLength(1)
      expect(ctx.typeDefinitions[0].name).toBe('CounterProps')
    })

    test('extracts memos', () => {
      const source = `
        'use client'
        import { createSignal, createMemo } from '@barefootjs/dom'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          const doubled = createMemo(() => count() * 2)
          return <div>{doubled()}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Counter.tsx')

      expect(ctx.memos).toHaveLength(1)
      expect(ctx.memos[0].name).toBe('doubled')
      expect(ctx.memos[0].computation).toBe('() => count() * 2')
    })
  })

  describe('jsxToIR', () => {
    test('transforms simple element', () => {
      const source = `
        'use client'

        export function App() {
          return <div>Hello</div>
        }
      `

      const ctx = analyzeComponent(source, 'App.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.tag).toBe('div')
        expect(ir.children).toHaveLength(1)
        expect(ir.children[0].type).toBe('text')
      }
    })

    test('transforms element with event', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <button onClick={() => setCount(n => n + 1)}>Click</button>
        }
      `

      const ctx = analyzeComponent(source, 'Counter.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.tag).toBe('button')
        expect(ir.events).toHaveLength(1)
        expect(ir.events[0].name).toBe('click')
      }
    })

    test('transforms dynamic expression', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return <div>{count()}</div>
        }
      `

      const ctx = analyzeComponent(source, 'Counter.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        expect(ir.children).toHaveLength(1)
        expect(ir.children[0].type).toBe('expression')
        if (ir.children[0].type === 'expression') {
          expect(ir.children[0].reactive).toBe(true)
          expect(ir.children[0].slotId).not.toBeNull()
        }
      }
    })
  })

  describe('compileJSXSync', () => {
    test('compiles simple component', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        export function Counter() {
          const [count, setCount] = createSignal(0)
          return (
            <button onClick={() => setCount(n => n + 1)}>
              Count: {count()}
            </button>
          )
        }
      `

      const result = compileJSXSync(source, 'Counter.tsx')

      expect(result.errors).toHaveLength(0)
      expect(result.files).toHaveLength(2) // markedJsx + clientJs

      const markedJsx = result.files.find(f => f.type === 'markedJsx')
      expect(markedJsx).toBeDefined()
      expect(markedJsx?.content).toContain('export function Counter')

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      expect(clientJs?.content).toContain('initCounter')
    })

    test('outputs IR JSON when requested', () => {
      const source = `
        'use client'

        export function App() {
          return <div>Hello</div>
        }
      `

      const result = compileJSXSync(source, 'App.tsx', { outputIR: true })

      const ir = result.files.find(f => f.type === 'ir')
      expect(ir).toBeDefined()
      expect(ir?.content).toContain('"version": "2.0"')
    })
  })
})
