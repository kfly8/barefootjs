/**
 * Events Specification Tests
 *
 * Tests for EVT-XXX spec items.
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

describe('Events Specs', () => {
  // EVT-001: onClick handler
  it('EVT-001: handles onClick event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <button onClick={() => setCount(count() + 1)}>Click</button>
            <p>{count()}</p>
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

  // EVT-002: onInput handler
  it('EVT-002: handles onInput event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('')
        return (
          <div>
            <input onInput={(e) => setText(e.target.value)} />
            <p>{text()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const inputEl = container.querySelector('input')! as HTMLInputElement
    input(inputEl, 'hello')
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('hello')

    cleanup()
  })

  // EVT-003: onChange handler
  it('EVT-003: handles onChange event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [checked, setChecked] = createSignal(false)
        return (
          <div>
            <input type="checkbox" onChange={() => setChecked(!checked())} />
            <p>{checked() ? 'On' : 'Off'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const checkbox = container.querySelector('input')! as HTMLInputElement
    expect(container.querySelector('p')!.textContent).toBe('Off')

    checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('On')

    cleanup()
  })

  // EVT-004: onSubmit handler
  it('EVT-004: handles onSubmit event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [submitted, setSubmitted] = createSignal(false)
        return (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
              <button type="submit">Submit</button>
            </form>
            <p>{submitted() ? 'Submitted' : 'Not submitted'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Not submitted')

    const form = container.querySelector('form')!
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Submitted')

    cleanup()
  })

  // EVT-005: onKeyDown handler
  it('EVT-005: handles onKeyDown event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [key, setKey] = createSignal('')
        return (
          <div>
            <input onKeyDown={(e) => setKey(e.key)} />
            <p>{key()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const inputEl = container.querySelector('input')!
    inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Enter')

    cleanup()
  })

  // EVT-006: onMouseEnter handler
  it('EVT-006: handles onMouseEnter event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [hovered, setHovered] = createSignal(false)
        return (
          <div>
            <div class="target" onMouseEnter={() => setHovered(true)}>Hover me</div>
            <p>{hovered() ? 'Hovered' : 'Not hovered'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')!.textContent).toBe('Not hovered')

    const target = container.querySelector('.target')!
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await waitForUpdate()
    expect(container.querySelector('p')!.textContent).toBe('Hovered')

    cleanup()
  })

  // EVT-007: onBlur event
  it('EVT-007: handles onBlur event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [blurred, setBlurred] = createSignal(false)
        return (
          <div>
            <input type="text" onBlur={() => setBlurred(true)} />
            <p class="status">{blurred() ? 'Blurred' : 'Not blurred'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const inputEl = container.querySelector('input')!
    expect(container.querySelector('.status')!.textContent).toBe('Not blurred')

    inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    await waitForUpdate()
    expect(container.querySelector('.status')!.textContent).toBe('Blurred')

    cleanup()
  })

  // EVT-008: onFocus event
  it('EVT-008: handles onFocus event', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [focused, setFocused] = createSignal(false)
        return (
          <div>
            <input type="text" onFocus={() => setFocused(true)} />
            <p class="status">{focused() ? 'Focused' : 'Not focused'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const inputEl = container.querySelector('input')!
    expect(container.querySelector('.status')!.textContent).toBe('Not focused')

    inputEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    await waitForUpdate()
    expect(container.querySelector('.status')!.textContent).toBe('Focused')

    cleanup()
  })

  // EVT-010: onClick in list
  it('EVT-010: handles onClick in list items', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' }
        ])
        const [clicked, setClicked] = createSignal('')
        return (
          <div>
            <ul>
              {items().map(item => (
                <li key={item.id} onClick={() => setClicked(item.name)}>{item.name}</li>
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
    click(lis[1])
    await waitForUpdate()
    expect(container.querySelector('.clicked')!.textContent).toBe('B')

    cleanup()
  })

  // EVT-011: onInput in list
  it('EVT-011: handles onInput in list items', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, value: '' }])
        const [lastInput, setLastInput] = createSignal('')
        return (
          <div>
            <ul>
              {items().map(item => (
                <li key={item.id}>
                  <input onInput={(e) => setLastInput(e.target.value)} />
                </li>
              ))}
            </ul>
            <p class="last">{lastInput()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const inputEl = container.querySelector('input')! as HTMLInputElement
    input(inputEl, 'test')
    await waitForUpdate()
    expect(container.querySelector('.last')!.textContent).toBe('test')

    cleanup()
  })

  // EVT-012: onFocus in list
  it('EVT-012: handles onFocus in list items', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1 }, { id: 2 }])
        const [focusedId, setFocusedId] = createSignal(0)
        return (
          <div>
            <ul>
              {items().map(item => (
                <li key={item.id}>
                  <input onFocus={() => setFocusedId(item.id)} />
                </li>
              ))}
            </ul>
            <p class="focused">{focusedId()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const inputs = container.querySelectorAll('input')
    inputs[1].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    await waitForUpdate()
    expect(container.querySelector('.focused')!.textContent).toBe('2')

    cleanup()
  })

  // EVT-020: Event with closure
  it('EVT-020: handles event with closure', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([1, 2, 3])
        const [sum, setSum] = createSignal(0)
        return (
          <div>
            <ul>
              {items().map(num => (
                <li key={num}>
                  <button onClick={() => setSum(sum() + num)}>{num}</button>
                </li>
              ))}
            </ul>
            <p class="sum">{sum()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const buttons = container.querySelectorAll('button')
    click(buttons[0]) // Add 1
    await waitForUpdate()
    expect(container.querySelector('.sum')!.textContent).toBe('1')

    click(buttons[2]) // Add 3
    await waitForUpdate()
    expect(container.querySelector('.sum')!.textContent).toBe('4')

    cleanup()
  })

  // EVT-021: Event with item access
  it('EVT-021: handles event with item access', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, name: 'A' },
          { id: 2, name: 'B' }
        ])
        const [selected, setSelected] = createSignal(null)
        return (
          <div>
            <ul>
              {items().map(item => (
                <li key={item.id} onClick={() => setSelected(item)}>{item.name}</li>
              ))}
            </ul>
            <p class="selected">{selected()?.name || 'none'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const lis = container.querySelectorAll('li')
    expect(container.querySelector('.selected')!.textContent).toBe('none')

    click(lis[1])
    await waitForUpdate()
    expect(container.querySelector('.selected')!.textContent).toBe('B')

    cleanup()
  })
})
