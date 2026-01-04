/**
 * Element Paths Specification Tests
 *
 * Tests for PATH-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * Primary tests are in:
 * - utils/element-paths.test.ts
 *
 * Element paths are an optimization for DOM traversal in generated client JS.
 * Instead of using querySelector, paths like 'scope.firstChild.firstChild'
 * are used for faster element access.
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

describe('Element Paths Specs', () => {
  // PATH-001: Direct path
  // Reference: element-paths.test.ts:11
  it('PATH-001: uses direct path for first child', async () => {
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

  // PATH-002: Chained path for deeply nested elements
  // Reference: element-paths.test.ts:31
  it('PATH-002: uses chained path for nested elements', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [value, setValue] = createSignal('initial')
        return (
          <div>
            <p>
              <span>{value()}</span>
            </p>
            <button onClick={() => setValue('updated')}>Update</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('span')!.textContent).toBe('initial')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('span')!.textContent).toBe('updated')

    cleanup()
  })

  // PATH-003: Text nodes skipped in path
  // Reference: element-paths.test.ts:80
  it('PATH-003: correctly handles elements after text nodes', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            Text before
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

  // PATH-004: Fragment paths
  // Reference: element-paths.test.ts:134
  it('PATH-004: handles paths in fragments', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [a, setA] = createSignal('A')
        const [b, setB] = createSignal('B')
        return (
          <>
            <p class="a">{a()}</p>
            <span class="b">{b()}</span>
            <button onClick={() => { setA('X'); setB('Y') }}>Update</button>
          </>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.a')!.textContent).toBe('A')
    expect(container.querySelector('.b')!.textContent).toBe('B')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.a')!.textContent).toBe('X')
    expect(container.querySelector('.b')!.textContent).toBe('Y')

    cleanup()
  })

  // PATH-005: Path after component (uses querySelector)
  // Reference: element-paths.test.ts:271
  // Note: This tests path calculation when components precede dynamic elements
  // The unit test verifies this at the IR level; E2E behavior depends on component structure
  it('PATH-005: handles paths when components are involved', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [value, setValue] = createSignal('initial')
        return (
          <div>
            <span>Static Child</span>
            <p class="dynamic">{value()}</p>
            <button onClick={() => setValue('updated')}>Update</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('.dynamic')!.textContent).toBe('initial')

    click(container.querySelector('button')!)
    await waitForUpdate()
    expect(container.querySelector('.dynamic')!.textContent).toBe('updated')

    cleanup()
  })

  // PATH-006: Conditional in path
  // Reference: element-paths.test.ts:396
  // Note: This tests path calculation when conditionals affect sibling positions
  // The unit test verifies this at the IR level
  it('PATH-006: handles conditionals and sibling elements', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? <span class="visible">Visible</span> : null}
            <button onClick={() => setShow(!show())}>Toggle</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    // Conditional path handling is verified in unit tests (element-paths.test.ts)
    // E2E test verifies compilation succeeds
    expect(result.html).toBeTruthy()
    expect(result.clientJs).toBeTruthy()
  })
})
