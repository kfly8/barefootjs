/**
 * Attributes Specification Tests
 *
 * Tests for ATTR-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * This file focuses on E2E tests for partial status items:
 * - ATTR-012: style string attribute
 * - ATTR-017: data-* attribute
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
})

describe('Attributes Specs', () => {
  // ATTR-012: <p style={styleStr}>X</p> - style string attribute
  describe('ATTR-012: style string attribute', () => {
    it('renders initial style string', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [color, setColor] = createSignal('red')
          return <p style={\`color: \${color()}\`}>Styled Text</p>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const p = container.querySelector('p')! as HTMLElement
      expect(p.style.color).toBe('red')

      cleanup()
    })

    it('updates style string when signal changes', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [color, setColor] = createSignal('red')
          return (
            <div>
              <p style={\`color: \${color()}\`}>Styled Text</p>
              <button onClick={() => setColor('blue')}>Change Color</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const p = container.querySelector('p')! as HTMLElement
      const button = container.querySelector('button')!

      expect(p.style.color).toBe('red')

      click(button)
      await waitForUpdate()
      expect(p.style.color).toBe('blue')

      cleanup()
    })

    it('handles multiple style properties in string', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [size, setSize] = createSignal('16px')
          return (
            <div>
              <p style={\`font-size: \${size()}; font-weight: bold\`}>Styled</p>
              <button onClick={() => setSize('24px')}>Enlarge</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const p = container.querySelector('p')! as HTMLElement
      const button = container.querySelector('button')!

      expect(p.style.fontSize).toBe('16px')
      expect(p.style.fontWeight).toBe('bold')

      click(button)
      await waitForUpdate()
      expect(p.style.fontSize).toBe('24px')

      cleanup()
    })
  })

  // ATTR-017: <div data-id={id()}>X</div> - data attribute
  describe('ATTR-017: data-* attribute', () => {
    it('renders initial data attribute', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [id, setId] = createSignal('item-1')
          return <div data-id={id()}>Content</div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')!
      expect(div.getAttribute('data-id')).toBe('item-1')

      cleanup()
    })

    it('updates data attribute when signal changes', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [id, setId] = createSignal('item-1')
          return (
            <div>
              <span data-id={id()}>Content</span>
              <button onClick={() => setId('item-2')}>Change ID</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const span = container.querySelector('span')!
      const button = container.querySelector('button')!

      expect(span.getAttribute('data-id')).toBe('item-1')

      click(button)
      await waitForUpdate()
      expect(span.getAttribute('data-id')).toBe('item-2')

      cleanup()
    })

    it('handles multiple data attributes', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [type, setType] = createSignal('primary')
          const [index, setIndex] = createSignal(0)
          return (
            <div>
              <div class="target" data-type={type()} data-index={index()}>Content</div>
              <button class="change-type" onClick={() => setType('secondary')}>Change Type</button>
              <button class="increment" onClick={() => setIndex(index() + 1)}>Increment</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const target = container.querySelector('.target')!
      const changeTypeBtn = container.querySelector('.change-type')!
      const incrementBtn = container.querySelector('.increment')!

      expect(target.getAttribute('data-type')).toBe('primary')
      expect(target.getAttribute('data-index')).toBe('0')

      click(changeTypeBtn)
      await waitForUpdate()
      expect(target.getAttribute('data-type')).toBe('secondary')

      click(incrementBtn)
      await waitForUpdate()
      expect(target.getAttribute('data-index')).toBe('1')

      cleanup()
    })
  })

  // Additional attribute specs with existing coverage (references)
  // ATTR-001 ~ ATTR-005: See jsx-to-ir.test.ts
  // ATTR-010: See attributes.test.ts:40
  // ATTR-011: See attributes.test.ts:58
  // ATTR-013 ~ ATTR-016: See attributes.test.ts, dynamic-attributes.test.ts
  // ATTR-018: See dynamic-attributes.test.ts:80
  // ATTR-020 ~ ATTR-023: See spread-attributes.test.ts
})
