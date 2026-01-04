/**
 * Expressions Specification Tests
 *
 * Tests for EXPR-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * This file focuses on E2E tests for partial status items:
 * - EXPR-011: createMemo with block body
 * - EXPR-012: chained memos
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate, input } from '../e2e/test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Expressions Specs', () => {
  // EXPR-011: const memo = createMemo(() => { return x }) - memo with block body
  describe('EXPR-011: createMemo with block body', () => {
    it('evaluates memo with block body containing simple return', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [count, setCount] = createSignal(5)
          const doubled = createMemo(() => {
            return count() * 2
          })
          return (
            <div>
              <p class="result">{doubled()}</p>
              <button onClick={() => setCount(count() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const p = container.querySelector('.result')!
      expect(p.textContent).toBe('10')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(p.textContent).toBe('12')

      cleanup()
    })

    it('evaluates memo with block body containing conditional logic', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [touched, setTouched] = createSignal(false)
          const [name, setName] = createSignal('')
          const error = createMemo(() => {
            if (!touched()) return ''
            return name().trim() === '' ? 'Name is required' : ''
          })
          return (
            <div>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              <p class="error">{error()}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      const errorEl = container.querySelector('.error')!

      // Initially not touched, no error
      expect(errorEl.textContent).toBe('')

      // Blur without entering name - should show error
      inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()
      expect(errorEl.textContent).toBe('Name is required')

      // Enter name - error should clear
      input(inputEl, 'John')
      await waitForUpdate()
      expect(errorEl.textContent).toBe('')

      cleanup()
    })

    it('evaluates memo with block body containing multiple statements', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [items, setItems] = createSignal([1, 2, 3, 4, 5])
          const stats = createMemo(() => {
            const arr = items()
            const sum = arr.reduce((a, b) => a + b, 0)
            const avg = sum / arr.length
            return \`Sum: \${sum}, Avg: \${avg}\`
          })
          return (
            <div>
              <p class="stats">{stats()}</p>
              <button onClick={() => setItems([...items(), 10])}>Add 10</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const statsEl = container.querySelector('.stats')!
      expect(statsEl.textContent).toBe('Sum: 15, Avg: 3')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(statsEl.textContent).toBe('Sum: 25, Avg: 4.166666666666667')

      cleanup()
    })
  })

  // EXPR-012: const a = createMemo(...); const b = createMemo(() => a()) - chained memos
  describe('EXPR-012: chained memos', () => {
    it('evaluates chained memos with dependencies', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [base, setBase] = createSignal(2)
          const doubled = createMemo(() => base() * 2)
          const quadrupled = createMemo(() => doubled() * 2)
          return (
            <div>
              <p class="base">Base: {base()}</p>
              <p class="doubled">Doubled: {doubled()}</p>
              <p class="quadrupled">Quadrupled: {quadrupled()}</p>
              <button onClick={() => setBase(base() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('.base')!.textContent).toBe('Base: 2')
      expect(container.querySelector('.doubled')!.textContent).toBe('Doubled: 4')
      expect(container.querySelector('.quadrupled')!.textContent).toBe('Quadrupled: 8')

      click(container.querySelector('button')!)
      await waitForUpdate()

      expect(container.querySelector('.base')!.textContent).toBe('Base: 3')
      expect(container.querySelector('.doubled')!.textContent).toBe('Doubled: 6')
      expect(container.querySelector('.quadrupled')!.textContent).toBe('Quadrupled: 12')

      cleanup()
    })

    it('handles multiple signal sources in chained memos', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [a, setA] = createSignal(1)
          const [b, setB] = createSignal(10)
          const sumAB = createMemo(() => a() + b())
          const multiplied = createMemo(() => sumAB() * 2)
          return (
            <div>
              <p class="sum">Sum: {sumAB()}</p>
              <p class="multiplied">Multiplied: {multiplied()}</p>
              <button class="inc-a" onClick={() => setA(a() + 1)}>Inc A</button>
              <button class="inc-b" onClick={() => setB(b() + 10)}>Inc B</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('.sum')!.textContent).toBe('Sum: 11')
      expect(container.querySelector('.multiplied')!.textContent).toBe('Multiplied: 22')

      click(container.querySelector('.inc-a')!)
      await waitForUpdate()
      expect(container.querySelector('.sum')!.textContent).toBe('Sum: 12')
      expect(container.querySelector('.multiplied')!.textContent).toBe('Multiplied: 24')

      click(container.querySelector('.inc-b')!)
      await waitForUpdate()
      expect(container.querySelector('.sum')!.textContent).toBe('Sum: 22')
      expect(container.querySelector('.multiplied')!.textContent).toBe('Multiplied: 44')

      cleanup()
    })

    it('handles three-level memo chain', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'
        function Component() {
          const [value, setValue] = createSignal(1)
          const level1 = createMemo(() => value() + 1)
          const level2 = createMemo(() => level1() * 2)
          const level3 = createMemo(() => level2() + 10)
          return (
            <div>
              <p class="result">{level3()}</p>
              <button onClick={() => setValue(value() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      // value=1, level1=2, level2=4, level3=14
      expect(container.querySelector('.result')!.textContent).toBe('14')

      click(container.querySelector('button')!)
      await waitForUpdate()
      // value=2, level1=3, level2=6, level3=16
      expect(container.querySelector('.result')!.textContent).toBe('16')

      cleanup()
    })
  })

  // Additional expression specs with existing coverage (references)
  // EXPR-001 ~ EXPR-006: See signal.test.ts
  // EXPR-010: See compilation-flow.test.ts:306
  // EXPR-020 ~ EXPR-026: See jsx-to-ir.test.ts, dynamic-content.test.ts
  // EXPR-030 ~ EXPR-034: See constants.test.ts, local-variables.test.ts, local-functions.test.ts
})
