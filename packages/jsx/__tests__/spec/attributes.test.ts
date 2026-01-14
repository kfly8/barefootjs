/**
 * Attributes Specification Tests
 *
 * Tests for ATTR-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
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

  // ATTR-001: Static string attr preserved
  it('ATTR-001: preserves static string attribute', async () => {
    const source = `
      "use client"
      function Component() {
        return <div id="main">Content</div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('#main')!.textContent).toBe('Content')

    cleanup()
  })

  // ATTR-002: Boolean shorthand
  it('ATTR-002: handles boolean shorthand attribute', async () => {
    const source = `
      "use client"
      function Component() {
        return <input disabled />
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const input = container.querySelector('input')! as HTMLInputElement
    expect(input.disabled).toBe(true)

    cleanup()
  })

  // ATTR-003: class -> className
  it('ATTR-003: transforms class to className', async () => {
    const source = `
      "use client"
      function Component() {
        return <div class="foo">Content</div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.foo')!.textContent).toBe('Content')

    cleanup()
  })

  // ATTR-004: SVG gets xmlns
  it('ATTR-004: adds xmlns to SVG', async () => {
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

  // ATTR-005: camelCase preserved
  it('ATTR-005: preserves camelCase attributes', async () => {
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

  // ATTR-010: Dynamic class in effect
  it('ATTR-010: handles dynamic class attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [active, setActive] = createSignal(false)
        return (
          <div>
            <p class={active() ? 'on' : 'off'}>Status</p>
            <button onClick={() => setActive(true)}>Activate</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const p = container.querySelector('p')!
    expect(p.className).toBe('off')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(p.className).toBe('on')

    cleanup()
  })

  // ATTR-011: Style object assignment
  it('ATTR-011: handles style object', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [isRed, setIsRed] = createSignal(true)
        return (
          <div>
            <p style={{ color: isRed() ? 'red' : 'blue' }}>Styled</p>
            <button onClick={() => setIsRed(false)}>Blue</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const p = container.querySelector('p')! as HTMLElement
    expect(p.style.color).toBe('red')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(p.style.color).toBe('blue')

    cleanup()
  })

  // ATTR-013: Boolean property
  it('ATTR-013: handles boolean property binding', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [loading, setLoading] = createSignal(true)
        return (
          <div>
            <button disabled={loading()}>Submit</button>
            <button onClick={() => setLoading(false)}>Done</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const buttons = container.querySelectorAll('button')
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(true)

    click(buttons[1])
    await waitForUpdate()
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(false)

    cleanup()
  })

  // ATTR-014: Value with undefined check
  it('ATTR-014: handles input value with undefined check', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hello')
        return <input value={text()} onInput={(e) => setText(e.target.value)} />
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const input = container.querySelector('input')! as HTMLInputElement
    expect(input.value).toBe('hello')

    cleanup()
  })

  // ATTR-015: Hidden property
  it('ATTR-015: handles hidden property binding', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [isHidden, setIsHidden] = createSignal(true)
        return (
          <div>
            <div hidden={isHidden()}>Hidden Content</div>
            <button onClick={() => setIsHidden(false)}>Show</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const hiddenDiv = container.querySelectorAll('div')[1] as HTMLDivElement
    expect(hiddenDiv.hidden).toBe(true)

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(hiddenDiv.hidden).toBe(false)

    cleanup()
  })

  // ATTR-016: Checked property
  it('ATTR-016: handles checked property binding', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [isOn, setIsOn] = createSignal(false)
        return (
          <div>
            <input type="checkbox" checked={isOn()} onChange={() => setIsOn(!isOn())} />
            <button onClick={() => setIsOn(true)}>Check</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const checkbox = container.querySelector('input')! as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(checkbox.checked).toBe(true)

    cleanup()
  })

  // ATTR-018: Complex ternary in effect
  it('ATTR-018: handles complex ternary in class', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [a, setA] = createSignal(true)
        const b = () => 'yes'
        const c = () => 'no'
        return (
          <div>
            <p class={a() ? b() : c()}>Text</p>
            <button onClick={() => setA(false)}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const p = container.querySelector('p')!
    expect(p.className).toBe('yes')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(p.className).toBe('no')

    cleanup()
  })

  // ATTR-020: Spread preserved
  it('ATTR-020: preserves spread attributes', async () => {
    const source = `
      "use client"
      function Component() {
        const props = { id: 'test', title: 'Hello' }
        return <div {...props}>Content</div>
      }
    `
    const result = await compile(source)
    // Spread compiles successfully
    expect(result.html).toBeTruthy()
  })

  // ATTR-021: Multiple spreads
  it('ATTR-021: handles multiple spreads', async () => {
    const source = `
      "use client"
      function Component() {
        const a = { id: 'test' }
        const b = { title: 'Hello' }
        return <div {...a} {...b}>Content</div>
      }
    `
    const result = await compile(source)
    // Multiple spreads compile successfully
    expect(result.html).toBeTruthy()
  })

  // ATTR-022: Static + spread
  it('ATTR-022: handles static attr with spread', async () => {
    const source = `
      "use client"
      function Component() {
        const props = { title: 'Hello' }
        return <div id="x" {...props}>Content</div>
      }
    `
    const result = await compile(source)
    // Static attr preserved with spread
    expect(result.html).toContain('id="x"')
  })

  // ATTR-023: Spread on self-closing
  it('ATTR-023: handles spread on self-closing element', async () => {
    const source = `
      "use client"
      function Component() {
        const props = { type: 'text', placeholder: 'Enter name' }
        return <input {...props} />
      }
    `
    const result = await compile(source)
    // Spread on self-closing compiles successfully
    expect(result.html).toBeTruthy()
  })

  // ATTR-024: dangerouslySetInnerHTML - innerHTML assignment
  describe('ATTR-024: dangerouslySetInnerHTML static', () => {
    it('renders HTML content via innerHTML', async () => {
      const source = `
        "use client"
        function Component() {
          return <div dangerouslySetInnerHTML={{ __html: '<strong>Bold</strong>' }} />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')!
      expect(div.innerHTML).toBe('<strong>Bold</strong>')

      cleanup()
    })

    it('renders complex HTML content', async () => {
      const source = `
        "use client"
        function Component() {
          return <div dangerouslySetInnerHTML={{ __html: '<span class="highlight">Code</span>' }} />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')!
      expect(div.innerHTML).toBe('<span class="highlight">Code</span>')

      cleanup()
    })
  })

  // ATTR-025: dangerouslySetInnerHTML - dynamic innerHTML
  describe('ATTR-025: dangerouslySetInnerHTML dynamic', () => {
    it('updates innerHTML when signal changes', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [html, setHtml] = createSignal('<em>Initial</em>')
          return (
            <div>
              <div class="content" dangerouslySetInnerHTML={{ __html: html() }} />
              <button onClick={() => setHtml('<strong>Updated</strong>')}>Update</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const content = container.querySelector('.content')!
      expect(content.innerHTML).toBe('<em>Initial</em>')

      click(container.querySelector('button')!)
      await waitForUpdate()
      expect(content.innerHTML).toBe('<strong>Updated</strong>')

      cleanup()
    })
  })
})
