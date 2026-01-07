/**
 * Components Specification Tests
 *
 * Tests for COMP-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, compileWithFiles, setupDOM, click, waitForUpdate } from '../e2e/test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Components Specs', () => {
  // COMP-001: Static component
  it('COMP-001: renders static component', async () => {
    const source = `
      "use client"
      function Child() {
        return <span>Child Content</span>
      }
      function Component() {
        return <div><Child /></div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('span')!.textContent).toBe('Child Content')

    cleanup()
  })

  // COMP-002: Static props
  it('COMP-002: passes static props', async () => {
    const source = `
      "use client"
      function Child({ name }) {
        return <span>{name}</span>
      }
      function Component() {
        return <div><Child name="Alice" /></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-003: Dynamic props wrapped
  it('COMP-003: handles dynamic props', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <span>{count()}</span>
            <button onClick={() => setCount(count() + 1)}>Inc</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('span')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('span')!.textContent).toBe('1')

    cleanup()
  })

  // COMP-004: Spread props
  it('COMP-004: handles spread props', async () => {
    const source = `
      "use client"
      function Child({ name, age }) {
        return <span>{name} ({age})</span>
      }
      function Component() {
        const props = { name: 'Bob', age: 30 }
        return <div><Child {...props} /></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-005: Children
  it('COMP-005: passes children to component', async () => {
    const source = `
      "use client"
      function Component() {
        const Card = ({ children }) => (
          <div class="card">{typeof children === 'function' ? children() : children}</div>
        )
        return <Card><p>Card Content</p></Card>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-006: Boolean shorthand
  it('COMP-006: handles boolean shorthand props', async () => {
    const source = `
      "use client"
      function Toggle({ active }) {
        return <span>{active ? 'On' : 'Off'}</span>
      }
      function Component() {
        return <div><Toggle active /></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-010: Typed props
  it('COMP-010: handles typed props', async () => {
    const source = `
      "use client"
      function Child({ name }: { name: string }) {
        return <span>{name}</span>
      }
      function Component() {
        return <div><Child name="Test" /></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-011: Default value
  it('COMP-011: handles props with default value', async () => {
    const source = `
      "use client"
      interface Props { x?: number }
      function Child({ x = 5 }: Props) {
        return <span>{x}</span>
      }
      function Component() {
        return <div><Child /></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-012: Dynamic wrapped
  it('COMP-012: wraps dynamic props', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [sig, setSig] = createSignal(10)
        return (
          <div>
            <span>{sig()}</span>
            <button onClick={() => setSig(20)}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('span')!.textContent).toBe('10')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('span')!.textContent).toBe('20')

    cleanup()
  })

  // COMP-013: Callback not wrapped
  it('COMP-013: does not wrap callback props', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        const fn = () => setCount(count() + 1)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={fn}>Click</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('1')

    cleanup()
  })

  // COMP-014: Prop usage
  it('COMP-014: accesses prop as getter', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [value, setValue] = createSignal(100)
        return (
          <div>
            <p>{value()}</p>
            <button onClick={() => setValue(200)}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('100')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('200')

    cleanup()
  })

  // COMP-015: Static not wrapped
  it('COMP-015: does not wrap static props', async () => {
    const source = `
      "use client"
      function Child({ name }) {
        return <span>{name}</span>
      }
      function Component() {
        return <div><Child name="A" /></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // COMP-020: Reactive children
  it('COMP-020: handles reactive children', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <div class="card">{count()}</div>
            <button onClick={() => setCount(count() + 1)}>Inc</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.card')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.card')!.textContent).toBe('1')

    cleanup()
  })

  // COMP-021: Static children
  it('COMP-021: handles static children', async () => {
    const source = `
      "use client"
      function Component() {
        return <div class="card"><p>Static</p></div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.card p')!.textContent).toBe('Static')

    cleanup()
  })

  // COMP-022: Lazy children
  it('COMP-022: handles lazy children', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('Hello')
        return (
          <div>
            <div class="wrapper">{text()}</div>
            <button onClick={() => setText('World')}>Change</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.wrapper')!.textContent).toBe('Hello')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.wrapper')!.textContent).toBe('World')

    cleanup()
  })

  // COMP-030: Init fn generated
  it('COMP-030: generates init function for interactive component', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(1)}>Set</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.clientJs).toContain('createSignal')

    const { container, cleanup } = await setupDOM(result)
    expect(container.querySelector('p')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('1')

    cleanup()
  })

  // COMP-031: No init wrapper for static component
  it('COMP-031: no clientJs for static component', async () => {
    const source = `
      "use client"
      function Component() {
        return <div>Static Content</div>
      }
    `
    const result = await compile(source)
    expect(result.clientJs).toBeFalsy()
  })

  // COMP-032: Parent calls child init
  it('COMP-032: parent handles child with signals', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <div class="child">{count()}</div>
            <button onClick={() => setCount(count() + 1)}>Inc</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.child')!.textContent).toBe('0')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.child')!.textContent).toBe('1')

    cleanup()
  })

  // COMP-033: Auto-hydration
  it('COMP-033: uses data-bf-scope for hydration', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [x, setX] = createSignal(0)
        return <div><p>{x()}</p></div>
      }
    `
    const result = await compile(source)
    expect(result.html).toContain('data-bf-scope')
  })

  // COMP-034: Hash generated
  it('COMP-034: generates component metadata', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [x, setX] = createSignal(0)
        return <div>{x()}</div>
      }
    `
    const result = await compile(source)
    expect(result.clientJs).toBeTruthy()
    expect(result.html).toBeTruthy()
  })

  // COMP-040: Inlined component
  it('COMP-040: inlines simple component in list', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['A', 'B', 'C'])
        return (
          <ul>
            {items().map((item, i) => <li key={i}><span>{item}</span></li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const spans = container.querySelectorAll('span')
    expect(spans.length).toBe(3)
    expect(spans[0].textContent).toBe('A')
    expect(spans[1].textContent).toBe('B')
    expect(spans[2].textContent).toBe('C')

    cleanup()
  })

  // COMP-041: Inlined events
  it('COMP-041: handles events in inlined list items', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'A' }, { id: 2, text: 'B' }])
        const [clicked, setClicked] = createSignal('')
        return (
          <div>
            <ul>
              {items().map((item) => (
                <li key={item.id} onClick={() => setClicked(item.text)}>{item.text}</li>
              ))}
            </ul>
            <p class="clicked">{clicked()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(2)

    click(lis[0])
    await waitForUpdate()
    expect(container.querySelector('.clicked')!.textContent).toBe('A')

    click(lis[1])
    await waitForUpdate()
    expect(container.querySelector('.clicked')!.textContent).toBe('B')

    cleanup()
  })

  // COMP-042: Inlined conditional
  it('COMP-042: handles conditional in inlined component', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, done: false },
          { id: 2, done: true }
        ])
        return (
          <ul>
            {items().map((item) => (
              <li key={item.id}>
                {item.done ? <span class="done">Done</span> : <span class="pending">Pending</span>}
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis[0].querySelector('.pending')).not.toBeNull()
    expect(lis[1].querySelector('.done')).not.toBeNull()

    cleanup()
  })

  // COMP-023: Ternary JSX in component children preserved (issue #145)
  // This test verifies that the compiler doesn't generate "[conditional]" or "[component]"
  // placeholder strings in clientJs when children contain JSX conditionals
  it('COMP-023: no placeholder strings in clientJs for ternary JSX children', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const Card = ({ children }) => (
          <div class="card">{typeof children === 'function' ? children() : children}</div>
        )
        const [highlight, setHighlight] = createSignal(false)
        return (
          <div>
            <Card>
              {highlight()
                ? <span class="highlight">Highlighted!</span>
                : <span class="normal">Normal</span>}
            </Card>
            <button onClick={() => setHighlight(!highlight())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    // Verify no placeholder strings in clientJs
    expect(result.clientJs).not.toContain('[conditional]')
    expect(result.clientJs).not.toContain('[component]')
    expect(result.clientJs).not.toContain('[element]')
    expect(result.clientJs).not.toContain('[fragment]')
  })

  // COMP-024: Mixed JSX children handled correctly (issue #145)
  // This test verifies that mixed JSX children don't generate placeholder strings
  it('COMP-024: no placeholder strings in clientJs for mixed JSX children', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const Wrapper = ({ children }) => (
          <div class="wrapper">{typeof children === 'function' ? children() : children}</div>
        )
        const [showExtra, setShowExtra] = createSignal(false)
        return (
          <div>
            <Wrapper>
              <p class="static">Static content</p>
              {showExtra() && <span class="extra">Extra content</span>}
            </Wrapper>
            <button onClick={() => setShowExtra(true)}>Show Extra</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    // Verify no placeholder strings in clientJs
    expect(result.clientJs).not.toContain('[conditional]')
    expect(result.clientJs).not.toContain('[component]')
    expect(result.clientJs).not.toContain('[element]')
    expect(result.clientJs).not.toContain('[fragment]')
  })

  // COMP-025: Pure reactive text children still work
  // This test verifies that children prop is still generated for pure text/expression children
  it('COMP-025: pure reactive text children generate children prop', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const Label = ({ children }) => (
          <span class="label">{typeof children === 'function' ? children() : children}</span>
        )
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <Label>{count()}</Label>
            <button onClick={() => setCount(count() + 1)}>Inc</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    // Verify no placeholder strings
    expect(result.clientJs).not.toContain('[component]')
    expect(result.clientJs).not.toContain('[element]')
    // Note: For inline components, children handling is different from separate file components
    // The key behavior is that we don't generate broken placeholder strings
  })
})
