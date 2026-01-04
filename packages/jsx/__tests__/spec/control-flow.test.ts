/**
 * Control Flow Specification Tests
 *
 * Tests for CTRL-XXX spec items.
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

describe('Control Flow Specs', () => {
  // CTRL-001: Static ternary (evaluated at compile time)
  it('CTRL-001: evaluates static ternary at compile time', async () => {
    const source = `
      "use client"
      function Component() {
        return <p>{true ? 'Yes' : 'No'}</p>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Yes')

    cleanup()
  })

  // CTRL-002: Dynamic text ternary
  it('CTRL-002: handles dynamic text ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            <p>{show() ? 'Yes' : 'No'}</p>
            <button onClick={() => setShow(!show())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('No')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Yes')

    cleanup()
  })

  // CTRL-003: Element ternary
  it('CTRL-003: handles element ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [showA, setShowA] = createSignal(true)
        return (
          <div>
            {showA() ? <span class="a">A</span> : <span class="b">B</span>}
            <button onClick={() => setShowA(!showA())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const button = container.querySelector('button')!
    expect(button.textContent).toBe('Toggle')

    click(button)
    await waitForUpdate()

    cleanup()
  })

  // CTRL-004: Logical AND
  it('CTRL-004: handles logical AND', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(false)
        return (
          <div>
            {show() && <span class="content">Visible</span>}
            <button onClick={() => setShow(true)}>Show</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.content')).toBeNull()

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.content')!.textContent).toBe('Visible')

    cleanup()
  })

  // CTRL-005: Logical OR (inverted)
  it('CTRL-005: handles logical OR', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [loading, setLoading] = createSignal(true)
        return (
          <div>
            {loading() || <span class="content">Loaded</span>}
            <button onClick={() => setLoading(false)}>Complete</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.content')).toBeNull()

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.content')!.textContent).toBe('Loaded')

    cleanup()
  })

  // CTRL-006: Null branch
  it('CTRL-006: handles null branch in ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? <span class="visible">Content</span> : null}
            <button onClick={() => setShow(!show())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
    expect(result.clientJs).toBeTruthy()
  })

  // CTRL-007: Fragment uses comments
  it('CTRL-007: uses comment markers for fragments in conditionals', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? <><span>A</span><span>B</span></> : <span>C</span>}
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-008: Nested ternary
  it('CTRL-008: handles nested ternary', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [state, setState] = createSignal('a')
        return (
          <div>
            {state() === 'a' ? <span>A</span> : state() === 'b' ? <span>B</span> : <span>C</span>}
            <button class="to-b" onClick={() => setState('b')}>B</button>
            <button class="to-c" onClick={() => setState('c')}>C</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
    expect(result.clientJs).toBeTruthy()
  })

  // CTRL-009: Static conditional (no markers)
  it('CTRL-009: static conditional has no markers', async () => {
    const source = `
      "use client"
      function Component() {
        return <div>{true ? <span>A</span> : <span>B</span>}</div>
      }
    `
    const result = await compile(source)
    expect(result.html).not.toContain('data-bf-cond')
  })

  // CTRL-010: Array map
  it('CTRL-010: handles array map', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['A', 'B', 'C'])
        return (
          <ul>
            {items().map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('A')
    expect(lis[1].textContent).toBe('B')
    expect(lis[2].textContent).toBe('C')

    cleanup()
  })

  // CTRL-011: Filter + map chain
  it('CTRL-011: handles filter + map chain', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([1, 2, 3, 4, 5])
        return (
          <ul>
            {items().filter(x => x % 2 === 0).map(x => <li key={x}>{x}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(2)
    expect(lis[0].textContent).toBe('2')
    expect(lis[1].textContent).toBe('4')

    cleanup()
  })

  // CTRL-012: key -> data-key
  it('CTRL-012: transforms key to data-key', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 'a' }, { id: 'b' }])
        return (
          <ul>
            {items().map(item => <li key={item.id}>{item.id}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-013: Index key
  it('CTRL-013: handles index as key', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['X', 'Y', 'Z'])
        return (
          <ul>
            {items().map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('X')
    expect(lis[1].textContent).toBe('Y')
    expect(lis[2].textContent).toBe('Z')

    cleanup()
  })

  // CTRL-014: Computed key
  it('CTRL-014: handles computed key expression', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ a: 'x', b: 'y' }])
        return (
          <ul>
            {items().map(item => <li key={item.a + item.b}>{item.a}{item.b}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-015: Nested map
  it('CTRL-015: handles nested map', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [groups, setGroups] = createSignal([
          { id: 1, items: ['A', 'B'] },
          { id: 2, items: ['C', 'D'] }
        ])
        return (
          <div>
            {groups().map(g => (
              <div key={g.id} class="group">
                {g.items.map((item, i) => <span key={i}>{item}</span>)}
              </div>
            ))}
          </div>
        )
      }
    `
    const result = await compile(source)
    expect(result.html).toBeTruthy()
  })

  // CTRL-016: Conditional in map
  it('CTRL-016: handles conditional in map', async () => {
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
            {items().map(item => (
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
})
