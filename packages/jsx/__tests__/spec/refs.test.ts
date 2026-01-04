/**
 * Refs Specification Tests
 *
 * Tests for REF-XXX spec items.
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

describe('Refs Specs', () => {
  // REF-001: Ref callback
  it('REF-001: executes ref callback', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        let inputRef
        const [value, setValue] = createSignal('')
        const focus = () => {
          if (inputRef) inputRef.focus()
        }
        return (
          <div>
            <input ref={(el) => inputRef = el} value={value()} onInput={(e) => setValue(e.target.value)} />
            <button onClick={focus}>Focus</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const input = container.querySelector('input')!
    expect(input).not.toBeNull()

    cleanup()
  })

  // REF-002: Ref excluded from server
  it('REF-002: excludes ref from server HTML', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        let ref
        return <div ref={(el) => ref = el}>Content</div>
      }
    `
    const result = await compile(source)
    // ref should not appear in HTML
    expect(result.html).not.toContain('ref=')
  })

  // REF-003: Ref + event
  it('REF-003: handles ref with event handler', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        let inputRef
        const [clicked, setClicked] = createSignal(false)
        return (
          <div>
            <button ref={(el) => inputRef = el} onClick={() => setClicked(true)}>
              Click Me
            </button>
            <p class="status">{clicked() ? 'Clicked' : 'Not clicked'}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.status')!.textContent).toBe('Not clicked')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.status')!.textContent).toBe('Clicked')

    cleanup()
  })

  // REF-004: Ref + dynamic attribute
  it('REF-004: handles ref with dynamic attribute', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        let inputRef
        const [text, setText] = createSignal('initial')
        return (
          <div>
            <input
              ref={(el) => inputRef = el}
              value={text()}
              onInput={(e) => setText(e.target.value)}
            />
            <p class="display">{text()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const input = container.querySelector('input')! as HTMLInputElement
    expect(input.value).toBe('initial')
    expect(container.querySelector('.display')!.textContent).toBe('initial')

    cleanup()
  })

  // REF-005: Multiple refs
  it('REF-005: handles multiple refs', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        let ref1, ref2
        const [status, setStatus] = createSignal('none')
        return (
          <div>
            <input ref={(el) => ref1 = el} class="first" />
            <input ref={(el) => ref2 = el} class="second" />
            <button onClick={() => setStatus(ref1 && ref2 ? 'both set' : 'missing')}>Check Refs</button>
            <p class="status">{status()}</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.status')!.textContent).toBe('both set')

    cleanup()
  })
})
