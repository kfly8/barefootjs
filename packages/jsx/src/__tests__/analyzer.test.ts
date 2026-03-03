/**
 * BarefootJS Compiler - analyzeComponent Tests
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'

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

  test('does not collect variables from nested function declarations', () => {
    const source = `
        'use client'

        export function FilterList() {
          const topLevelConst = 'visible'

          function getInitialFilter() {
            const hash = window.location.hash
            return hash ? hash.slice(1) : 'all'
          }

          return <div>{topLevelConst}</div>
        }
      `

    const ctx = analyzeComponent(source, 'FilterList.tsx')

    // Should collect top-level const
    expect(ctx.localConstants.some((c) => c.name === 'topLevelConst')).toBe(
      true
    )
    // Should NOT collect variables from nested function declaration
    expect(ctx.localConstants.some((c) => c.name === 'hash')).toBe(false)
  })
})
