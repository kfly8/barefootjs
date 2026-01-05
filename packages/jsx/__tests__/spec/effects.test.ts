/**
 * E2E Tests for User-Written createEffect Blocks
 *
 * Tests that createEffect blocks without DOM bindings are preserved
 * in the compiled output and execute correctly.
 *
 * Related: Issue #117
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate } from '../e2e/test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})

describe('Effects Specs', () => {
  // EXPR-050: User-written effect preserved
  describe('EXPR-050: createEffect without DOM bindings', () => {
    it('preserves effect in client output and runs on hydration', async () => {
      const source = `
        "use client"
        import { createSignal, createEffect } from '@barefootjs/dom'
        function Component() {
          const [count, setCount] = createSignal(0)
          createEffect(() => {
            localStorage.setItem('count', String(count()))
          })
          return (
            <div>
              <p data-testid="count">{count()}</p>
              <button onClick={() => setCount(count() + 1)}>Inc</button>
            </div>
          )
        }
      `
      const result = await compile(source)

      // Verify clientJs contains the effect
      expect(result.clientJs).toContain('createEffect')
      expect(result.clientJs).toContain('localStorage.setItem')

      const { container, cleanup } = await setupDOM(result)

      // Effect should have run and set localStorage
      expect(localStorage.getItem('count')).toBe('0')

      click(container.querySelector('button')!)
      await waitForUpdate()

      // Effect should have re-run
      expect(localStorage.getItem('count')).toBe('1')

      cleanup()
    })
  })

  // EXPR-051: Effect that reads from localStorage on hydration
  describe('EXPR-051: effect reads localStorage on hydration', () => {
    it('runs effect to read from localStorage', async () => {
      // Pre-set localStorage value
      localStorage.setItem('stored', 'from-storage')

      const source = `
        "use client"
        import { createSignal, createEffect } from '@barefootjs/dom'
        function Component() {
          const [value, setValue] = createSignal('')
          createEffect(() => {
            const stored = localStorage.getItem('stored')
            if (stored) {
              setValue(stored)
            }
          })
          return (
            <div>
              <p data-testid="value">{value()}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      await waitForUpdate()

      // Effect should have read from localStorage and set signal
      expect(container.querySelector('[data-testid="value"]')!.textContent).toBe('from-storage')

      cleanup()
    })
  })

  // EXPR-052: Effect updates document.body (DOM outside component)
  describe('EXPR-052: effect updates external DOM', () => {
    it('runs effect that modifies document attributes', async () => {
      const source = `
        "use client"
        import { createSignal, createEffect } from '@barefootjs/dom'
        function Component() {
          const [theme, setTheme] = createSignal('light')
          createEffect(() => {
            document.body.setAttribute('data-theme', theme())
          })
          return (
            <div>
              <button class="dark" onClick={() => setTheme('dark')}>Dark</button>
              <button class="light" onClick={() => setTheme('light')}>Light</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      // Effect should have set initial theme
      expect(document.body.getAttribute('data-theme')).toBe('light')

      click(container.querySelector('.dark')!)
      await waitForUpdate()

      expect(document.body.getAttribute('data-theme')).toBe('dark')

      cleanup()
    })
  })

  // EXPR-053: Multiple effects without DOM bindings
  describe('EXPR-053: multiple effects', () => {
    it('preserves multiple effects in order', async () => {
      const source = `
        "use client"
        import { createSignal, createEffect } from '@barefootjs/dom'
        function Component() {
          const [count, setCount] = createSignal(0)
          createEffect(() => {
            localStorage.setItem('effect1', 'ran')
          })
          createEffect(() => {
            localStorage.setItem('effect2', String(count()))
          })
          return (
            <div>
              <button onClick={() => setCount(count() + 1)}>Inc</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      // Both effects should have run
      expect(localStorage.getItem('effect1')).toBe('ran')
      expect(localStorage.getItem('effect2')).toBe('0')

      click(container.querySelector('button')!)
      await waitForUpdate()

      // Second effect should have re-run with new count
      expect(localStorage.getItem('effect2')).toBe('1')

      cleanup()
    })
  })

  // EXPR-054: Effect-only component (no DOM bindings at all)
  describe('EXPR-054: effect-only component', () => {
    it('generates client JS for component with only effects and signals', async () => {
      const source = `
        "use client"
        import { createSignal, createEffect } from '@barefootjs/dom'
        function Component() {
          const [initialized, setInitialized] = createSignal(false)
          createEffect(() => {
            localStorage.setItem('initialized', String(initialized()))
          })
          return (
            <div>Static content</div>
          )
        }
      `
      const result = await compile(source)

      // Should have client JS even though there's no DOM binding
      expect(result.clientJs.length).toBeGreaterThan(0)
      expect(result.clientJs).toContain('createEffect')

      const { container, cleanup } = await setupDOM(result)

      // Effect should have run
      expect(localStorage.getItem('initialized')).toBe('false')

      cleanup()
    })
  })
})
