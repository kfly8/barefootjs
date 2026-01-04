/**
 * Edge Cases Specification Tests
 *
 * Tests for EDGE-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * Primary tests are in:
 * - compiler/edge-cases.test.ts
 * - compiler/svg-elements.test.ts
 * - compiler/form-inputs.test.ts
 * - compiler/issue-27-fixes.test.ts
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

describe('Edge Cases Specs', () => {
  // Whitespace handling (EDGE-001 ~ EDGE-005)
  describe('Whitespace', () => {
    // EDGE-001: Trailing whitespace preserved
    // Reference: edge-cases.test.ts:230
    it('EDGE-001: preserves trailing whitespace', async () => {
      const source = `
        "use client"
        function Component() {
          return <div> <span>X</span></div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')!
      expect(div.textContent).toContain(' X')

      cleanup()
    })

    // EDGE-004: Explicit space preserved
    // Reference: edge-cases.test.ts:287
    it('EDGE-004: preserves explicit space expression', async () => {
      const source = `
        "use client"
        function Component() {
          return <span>{' '}</span>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('span')!.textContent).toBe(' ')

      cleanup()
    })
  })

  // Deep nesting (EDGE-010 ~ EDGE-013)
  describe('Deep Nesting', () => {
    // EDGE-010: Deep nesting processed correctly
    // Reference: edge-cases.test.ts:15
    it('EDGE-010: handles deeply nested elements', async () => {
      const source = `
        "use client"
        function Component() {
          return <a><b><c><d><e>X</e></d></c></b></a>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('e')!.textContent).toBe('X')

      cleanup()
    })

    // EDGE-011: Multiple dynamics tracked
    // Reference: edge-cases.test.ts:46
    it('EDGE-011: tracks multiple dynamic expressions', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [a, setA] = createSignal(1)
          const [b, setB] = createSignal(2)
          return (
            <div>
              <div><p class="a">{a()}</p><span class="b">{b()}</span></div>
              <button class="inc-a" onClick={() => setA(a() + 1)}>Inc A</button>
              <button class="inc-b" onClick={() => setB(b() + 1)}>Inc B</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('.a')!.textContent).toBe('1')
      expect(container.querySelector('.b')!.textContent).toBe('2')

      click(container.querySelector('.inc-a')!)
      await waitForUpdate()
      expect(container.querySelector('.a')!.textContent).toBe('2')

      click(container.querySelector('.inc-b')!)
      await waitForUpdate()
      expect(container.querySelector('.b')!.textContent).toBe('3')

      cleanup()
    })

    // EDGE-012: Nested events
    // Reference: edge-cases.test.ts:80
    it('EDGE-012: handles nested event handlers', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [outer, setOuter] = createSignal(0)
          const [inner, setInner] = createSignal(0)
          return (
            <div onClick={() => setOuter(outer() + 1)}>
              <span onClick={(e) => { e.stopPropagation(); setInner(inner() + 1) }}>
                Inner: {inner()}
              </span>
              <p>Outer: {outer()}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('span')!.textContent).toBe('Inner: 0')
      expect(container.querySelector('p')!.textContent).toBe('Outer: 0')

      // Click inner (with stopPropagation)
      click(container.querySelector('span')!)
      await waitForUpdate()
      expect(container.querySelector('span')!.textContent).toBe('Inner: 1')
      expect(container.querySelector('p')!.textContent).toBe('Outer: 0')

      cleanup()
    })
  })

  // SVG handling (EDGE-030 ~ EDGE-035)
  describe('SVG', () => {
    // EDGE-030: SVG xmlns
    // Reference: svg-elements.test.ts:18
    it('EDGE-030: adds xmlns to SVG', async () => {
      const source = `
        "use client"
        function Component() {
          return <svg><path d="M0 0" /></svg>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')

      cleanup()
    })

    // EDGE-031: SVG viewBox preserved
    // Reference: svg-elements.test.ts:39
    it('EDGE-031: preserves SVG viewBox', async () => {
      const source = `
        "use client"
        function Component() {
          return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')

      cleanup()
    })

    // EDGE-033: Dynamic SVG attr
    // Reference: svg-elements.test.ts:83
    it('EDGE-033: handles dynamic SVG attributes', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [color, setColor] = createSignal('red')
          return (
            <div>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill={color()} />
              </svg>
              <button onClick={() => setColor('blue')}>Blue</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const circle = container.querySelector('circle')!
      expect(circle.getAttribute('fill')).toBe('red')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(circle.getAttribute('fill')).toBe('blue')

      cleanup()
    })

    // EDGE-034: SVG event
    // Reference: svg-elements.test.ts:106
    it('EDGE-034: handles SVG events', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [clicked, setClicked] = createSignal(false)
          return (
            <div>
              <svg onClick={() => setClicked(true)} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <p class="status">{clicked() ? 'Clicked' : 'Not clicked'}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('.status')!.textContent).toBe('Not clicked')

      click(container.querySelector('svg')!)
      await waitForUpdate()
      expect(container.querySelector('.status')!.textContent).toBe('Clicked')

      cleanup()
    })
  })

  // Form inputs (EDGE-040 ~ EDGE-048)
  describe('Form Inputs', () => {
    // EDGE-040: Input value binding
    // Reference: form-inputs.test.ts:21
    it('EDGE-040: handles input value binding', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [text, setText] = createSignal('initial')
          return (
            <div>
              <input value={text()} onInput={(e) => setText(e.target.value)} />
              <p class="display">{text()}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      expect(inputEl.value).toBe('initial')

      input(inputEl, 'changed')
      await waitForUpdate()
      expect(container.querySelector('.display')!.textContent).toBe('changed')

      cleanup()
    })

    // EDGE-044: Checkbox checked binding
    // Reference: form-inputs.test.ts:163
    it('EDGE-044: handles checkbox checked binding', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isOn, setIsOn] = createSignal(false)
          return (
            <div>
              <input type="checkbox" checked={isOn()} onChange={() => setIsOn(!isOn())} />
              <p class="status">{isOn() ? 'On' : 'Off'}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const checkbox = container.querySelector('input')! as HTMLInputElement
      expect(checkbox.checked).toBe(false)
      expect(container.querySelector('.status')!.textContent).toBe('Off')

      checkbox.dispatchEvent(new Event('change', { bubbles: true }))
      await waitForUpdate()
      expect(container.querySelector('.status')!.textContent).toBe('On')

      cleanup()
    })

    // EDGE-048: Dynamic disabled
    // Reference: form-inputs.test.ts:285
    it('EDGE-048: handles dynamic disabled', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isDisabled, setIsDisabled] = createSignal(true)
          return (
            <div>
              <input disabled={isDisabled()} />
              <button onClick={() => setIsDisabled(!isDisabled())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      expect(inputEl.disabled).toBe(true)

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(inputEl.disabled).toBe(false)

      cleanup()
    })
  })

  // Additional edge cases references:
  // EDGE-002, EDGE-003, EDGE-005: See edge-cases.test.ts
  // EDGE-013: See edge-cases.test.ts:110
  // EDGE-020 ~ EDGE-024: See edge-cases.test.ts, issue-27-fixes.test.ts
  // EDGE-032, EDGE-035: See svg-elements.test.ts
  // EDGE-041 ~ EDGE-047: See form-inputs.test.ts
})
