/**
 * BarefootJS Compiler v2 - Basic Tests
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync, compileJSX } from '../compiler'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { resolve, dirname } from 'node:path'

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

    test('marks constant reference attributes as dynamic', () => {
      // Regression test for: JSX attribute values referencing constants should be
      // rendered as {expr} not "expr" string literals
      const source = `
        'use client'

        const paths = {
          'icon': 'M12 0L24 12',
        } as const

        export function Icon() {
          return <svg><path d={paths['icon']} /></svg>
        }
      `

      const ctx = analyzeComponent(source, 'Icon.tsx')
      const ir = jsxToIR(ctx)

      expect(ir).not.toBeNull()
      expect(ir?.type).toBe('element')
      if (ir?.type === 'element') {
        // svg element
        expect(ir.tag).toBe('svg')
        expect(ir.children).toHaveLength(1)

        const pathElement = ir.children[0]
        expect(pathElement.type).toBe('element')
        if (pathElement.type === 'element') {
          expect(pathElement.tag).toBe('path')
          // The 'd' attribute should be marked as dynamic
          const dAttr = pathElement.attrs.find(a => a.name === 'd')
          expect(dAttr).toBeDefined()
          expect(dAttr?.value).toBe("paths['icon']")
          expect(dAttr?.dynamic).toBe(true)
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

    test('extracts props-based event handlers in client JS', () => {
      // Regression test: event handlers passed as props should be extracted from props
      const source = `
        'use client'

        interface ButtonProps {
          onClick?: () => void
        }

        export function Button({ onClick }: ButtonProps) {
          return <button onClick={onClick}>Click</button>
        }
      `

      const result = compileJSXSync(source, 'Button.tsx')

      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // Should extract onClick from props
      expect(clientJs?.content).toContain('const onClick = props.onClick')
    })

    test('extracts props and props-dependent constants in client JS', () => {
      // Regression test: props used in template literals should be extracted,
      // and constants that depend on props should also be included
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        interface Props {
          command: string
        }

        export function CommandDisplay({ command }: Props) {
          const [show, setShow] = createSignal(true)
          const fullCommand = \`npx \${command}\`

          return (
            <div>
              <button onClick={() => setShow(!show())}>Toggle</button>
              <pre>{show() ? fullCommand : ''}</pre>
            </div>
          )
        }
      `

      const result = compileJSXSync(source, 'CommandDisplay.tsx')

      expect(result.errors).toHaveLength(0)

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      // Should extract command prop
      expect(clientJs?.content).toContain('const command = props.command')
      // Should include fullCommand constant that depends on command prop
      expect(clientJs?.content).toContain('const fullCommand = `npx ${command}`')
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

  describe('real components', () => {
    test('compiles ButtonDemo component', async () => {
      // Path to the actual button-demo component
      const docsUiPath = resolve(dirname(import.meta.path), '../../../../docs/ui')
      const buttonDemoPath = resolve(docsUiPath, 'components/button-demo.tsx')

      const result = await compileJSX(buttonDemoPath, async (path) => {
        const file = Bun.file(path)
        return await file.text()
      })

      // Should have no errors
      expect(result.errors).toHaveLength(0)

      // Should generate markedJsx and clientJs
      expect(result.files.length).toBeGreaterThanOrEqual(2)

      const markedJsx = result.files.find(f => f.type === 'markedJsx')
      expect(markedJsx).toBeDefined()
      expect(markedJsx?.content).toContain('export function ButtonDemo')

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      expect(clientJs?.content).toContain('initButtonDemo')
    })

    test('compiles component with props', () => {
      const source = `
        'use client'
        import { createSignal } from '@barefootjs/dom'

        interface CounterProps {
          initial?: number
          label: string
        }

        export function Counter({ initial = 0, label }: CounterProps) {
          const [count, setCount] = createSignal(initial)
          return (
            <button onClick={() => setCount(n => n + 1)}>
              {label}: {count()}
            </button>
          )
        }
      `

      const result = compileJSXSync(source, 'Counter.tsx')

      expect(result.errors).toHaveLength(0)

      const markedJsx = result.files.find(f => f.type === 'markedJsx')
      expect(markedJsx).toBeDefined()
      // Should preserve props in function signature
      expect(markedJsx?.content).toContain('initial')
      expect(markedJsx?.content).toContain('label')

      const clientJs = result.files.find(f => f.type === 'clientJs')
      expect(clientJs).toBeDefined()
      expect(clientJs?.content).toContain('createSignal')
    })
  })
})
