/**
 * Edge Cases Specification Tests
 *
 * Tests for EDGE-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
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

    // EDGE-002: Leading text
    it('EDGE-002: preserves text after closing tag', async () => {
      const source = `
        "use client"
        function Component() {
          return <div><span>A</span>B</div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('div')!.textContent).toBe('AB')

      cleanup()
    })

    // EDGE-003: Block indentation removed
    it('EDGE-003: removes block indentation', async () => {
      const source = `
        "use client"
        function Component() {
          return <div>
            <span>X</span>
          </div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('span')!.textContent).toBe('X')

      cleanup()
    })

    // EDGE-004: Explicit space preserved
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

    // EDGE-005: List whitespace
    it('EDGE-005: preserves spaces in list template', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [items, setItems] = createSignal(['A', 'B'])
          return (
            <ul>
              {items().map(i => <li key={i}> {i} </li>)}
            </ul>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const lis = container.querySelectorAll('li')
      expect(lis[0].textContent).toContain('A')

      cleanup()
    })
  })

  // Deep nesting (EDGE-010 ~ EDGE-013)
  describe('Deep Nesting', () => {
    // EDGE-010: Deep nesting processed correctly
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

      click(container.querySelector('span')!)
      await waitForUpdate()
      expect(container.querySelector('span')!.textContent).toBe('Inner: 1')
      expect(container.querySelector('p')!.textContent).toBe('Outer: 0')

      cleanup()
    })

    // EDGE-013: Ternary in map
    it('EDGE-013: handles ternary in map', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [items, setItems] = createSignal([{ x: true }, { x: false }])
          return (
            <ul>
              {items().map((i, idx) => <li key={idx}>{i.x ? 'Yes' : 'No'}</li>)}
            </ul>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const lis = container.querySelectorAll('li')
      expect(lis[0].textContent).toBe('Yes')
      expect(lis[1].textContent).toBe('No')

      cleanup()
    })
  })

  // Destructuring and operators (EDGE-020 ~ EDGE-024)
  describe('Operators and Special Cases', () => {
    // EDGE-020: Object destructuring
    it('EDGE-020: handles object destructuring', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [obj, setObj] = createSignal({ a: 1, b: 2 })
          return <p>{obj().a}</p>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('p')!.textContent).toBe('1')

      cleanup()
    })

    // EDGE-021: Special chars
    it('EDGE-021: escapes operators correctly', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [x, setX] = createSignal(true)
          const [y, setY] = createSignal(1)
          return (
            <div>
              {x() && y() > 0 && <span>Visible</span>}
            </div>
          )
        }
      `
      const result = await compile(source)
      expect(result.html).toBeTruthy()
    })

    // EDGE-022: Multiple deps
    it('EDGE-022: tracks all 3 signals', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [a, setA] = createSignal(1)
          const [b, setB] = createSignal(2)
          const [c, setC] = createSignal(3)
          return (
            <div>
              <p>{a() + b() + c()}</p>
              <button onClick={() => setA(a() + 1)}>Inc</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('p')!.textContent).toBe('6')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(container.querySelector('p')!.textContent).toBe('7')

      cleanup()
    })

    // EDGE-023: CSS pseudo-class
    it('EDGE-023: preserves CSS pseudo-class in style tag', async () => {
      const source = `
        "use client"
        function Component() {
          return <style>{'.foo:hover { color: red; }'}</style>
        }
      `
      const result = await compile(source)
      expect(result.html).toContain(':hover')
    })

    // EDGE-024: HTML attr name
    it('EDGE-024: preserves HTML attr names', async () => {
      const source = `
        "use client"
        function Component() {
          return <input type="checkbox" />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const input = container.querySelector('input')! as HTMLInputElement
      expect(input.type).toBe('checkbox')

      cleanup()
    })
  })

  // SVG handling (EDGE-030 ~ EDGE-035)
  describe('SVG', () => {
    // EDGE-030: SVG xmlns
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

    // EDGE-032: SVG stroke
    it('EDGE-032: preserves SVG stroke-width', async () => {
      const source = `
        "use client"
        function Component() {
          return <svg><path stroke-width="2" d="M0 0" /></svg>
        }
      `
      const result = await compile(source)
      expect(result.html).toContain('stroke-width')
    })

    // EDGE-033: Dynamic SVG attr
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

    // EDGE-035: Nested SVG
    it('EDGE-035: handles nested SVG groups', async () => {
      const source = `
        "use client"
        function Component() {
          return <svg><g><g><path d="M0 0" /></g></g></svg>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('path')).not.toBeNull()

      cleanup()
    })
  })

  // Form inputs (EDGE-040 ~ EDGE-048)
  describe('Form Inputs', () => {
    // EDGE-040: Input value binding
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

    // EDGE-041: Number input
    it('EDGE-041: handles number input', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [num, setNum] = createSignal(0)
          return <input type="number" value={num()} onInput={(e) => setNum(Number(e.target.value))} />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      expect(inputEl.type).toBe('number')

      cleanup()
    })

    // EDGE-042: Textarea
    it('EDGE-042: handles textarea value binding', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [text, setText] = createSignal('hello')
          return <textarea value={text()} onInput={(e) => setText(e.target.value)} />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const textarea = container.querySelector('textarea')! as HTMLTextAreaElement
      expect(textarea.value).toBe('hello')

      cleanup()
    })

    // EDGE-043: Select
    it('EDGE-043: handles select value binding', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [selected, setSelected] = createSignal('b')
          return (
            <select value={selected()} onChange={(e) => setSelected(e.target.value)}>
              <option value="a">A</option>
              <option value="b">B</option>
            </select>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const select = container.querySelector('select')! as HTMLSelectElement
      expect(select.value).toBe('b')

      cleanup()
    })

    // EDGE-044: Checkbox checked binding
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

    // EDGE-045: Radio
    it('EDGE-045: handles radio checked binding', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isA, setIsA] = createSignal(true)
          return (
            <div>
              <input type="radio" name="opt" checked={isA()} onChange={() => setIsA(true)} />
              <input type="radio" name="opt" checked={!isA()} onChange={() => setIsA(false)} />
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const radios = container.querySelectorAll('input') as NodeListOf<HTMLInputElement>
      expect(radios[0].checked).toBe(true)

      cleanup()
    })

    // EDGE-046: Multiple inputs
    it('EDGE-046: tracks multiple inputs', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [a, setA] = createSignal('A')
          const [b, setB] = createSignal('B')
          return (
            <div>
              <input class="a" value={a()} onInput={(e) => setA(e.target.value)} />
              <input class="b" value={b()} onInput={(e) => setB(e.target.value)} />
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputA = container.querySelector('.a')! as HTMLInputElement
      const inputB = container.querySelector('.b')! as HTMLInputElement
      expect(inputA.value).toBe('A')
      expect(inputB.value).toBe('B')

      cleanup()
    })

    // EDGE-047: Dynamic placeholder
    it('EDGE-047: handles dynamic placeholder', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [hint, setHint] = createSignal('Enter name')
          return (
            <div>
              <input placeholder={hint()} />
              <button onClick={() => setHint('Enter email')}>Change</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      expect(inputEl.placeholder).toBe('Enter name')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(inputEl.placeholder).toBe('Enter email')

      cleanup()
    })

    // EDGE-048: Dynamic disabled
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
})
