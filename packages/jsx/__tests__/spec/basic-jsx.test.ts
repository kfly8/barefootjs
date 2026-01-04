/**
 * Basic JSX Specification Tests
 *
 * Tests for JSX-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, waitForUpdate } from '../e2e/test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Basic JSX Specs', () => {
  // JSX-001: <div>Hello</div> - Plain text preserved
  it('JSX-001: preserves plain text content', async () => {
    const source = `
      "use client"
      function Component() {
        return <div>Hello</div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('div')!.textContent).toBe('Hello')

    cleanup()
  })

  // JSX-002: Indentation whitespace removed
  it('JSX-002: removes indentation whitespace', async () => {
    const source = `
      "use client"
      function Component() {
        return <div>
          Hello
        </div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('div')!.textContent?.trim()).toBe('Hello')

    cleanup()
  })

  // JSX-003: Explicit space preserved
  it('JSX-003: preserves explicit spaces', async () => {
    const source = `
      "use client"
      function Component() {
        return <div><span>A</span>{' '}<span>B</span></div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const div = container.querySelector('div')!
    expect(div.textContent).toBe('A B')

    cleanup()
  })

  // JSX-004: Nested elements preserved
  it('JSX-004: preserves nested elements', async () => {
    const source = `
      "use client"
      function Component() {
        return <div><p>A</p><span>B</span></div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const div = container.querySelector('div')!
    expect(div.querySelector('p')!.textContent).toBe('A')
    expect(div.querySelector('span')!.textContent).toBe('B')

    cleanup()
  })

  // JSX-005: Self-closing preserved
  it('JSX-005: preserves self-closing elements', async () => {
    const source = `
      "use client"
      function Component() {
        return <input type='text' />
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const input = container.querySelector('input')!
    expect(input.type).toBe('text')

    cleanup()
  })

  // JSX-006: Void element supported
  it('JSX-006: supports void elements', async () => {
    const source = `
      "use client"
      function Component() {
        return <div><br /></div>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('br')).not.toBeNull()

    cleanup()
  })

  // JSX-007: Attrs on void element
  it('JSX-007: supports attributes on void elements', async () => {
    const source = `
      "use client"
      function Component() {
        return <img src='x.png' alt='X' />
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('x.png')
    expect(img.getAttribute('alt')).toBe('X')

    cleanup()
  })

  // JSX-008: Empty fragment
  it('JSX-008: supports empty fragments', async () => {
    const source = `
      "use client"
      function Component() {
        return <></>
      }
    `
    const result = await compile(source)
    expect(result.html).toBe('')
  })

  // JSX-009: Fragment with children
  it('JSX-009: supports fragments with children', async () => {
    const source = `
      "use client"
      function Component() {
        return <><p>A</p><p>B</p></>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const ps = container.querySelectorAll('p')
    expect(ps.length).toBe(2)
    expect(ps[0].textContent).toBe('A')
    expect(ps[1].textContent).toBe('B')

    cleanup()
  })

  // JSX-010: First element gets scope marker
  it('JSX-010: first element gets scope marker in fragment', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [x, setX] = createSignal(0)
        return <><p>{x()}</p><span>B</span></>
      }
    `
    const result = await compile(source)
    expect(result.html).toContain('data-bf-scope')
  })

  // JSX-011: Nested fragments flattened
  it('JSX-011: flattens nested fragments', async () => {
    const source = `
      "use client"
      function Component() {
        return <><><span>A</span></><div>B</div></>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('span')!.textContent).toBe('A')
    expect(container.querySelector('div')!.textContent).toBe('B')

    cleanup()
  })

  // JSX-012: Mixed text and elements
  it('JSX-012: supports mixed text and elements in fragments', async () => {
    const source = `
      "use client"
      function Component() {
        return <>Hello<span>World</span>!</>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.textContent).toContain('Hello')
    expect(container.querySelector('span')!.textContent).toBe('World')
    expect(container.textContent).toContain('!')

    cleanup()
  })

  // JSX-013: Single child gets scope
  it('JSX-013: single child in fragment gets scope', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [x, setX] = createSignal(0)
        return <><p>{x()}</p></>
      }
    `
    const result = await compile(source)
    expect(result.html).toContain('data-bf-scope')
  })
})
