/**
 * Counter E2E Test
 *
 * Tests the complete flow from JSX compilation to DOM interaction:
 * 1. Compile JSX to HTML + clientJs
 * 2. Render HTML to DOM
 * 3. Execute clientJs (hydration)
 * 4. Simulate user interactions
 * 5. Verify DOM updates correctly
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate } from './test-helpers'

beforeAll(() => {
  // Only register if not already registered
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Counter E2E', () => {
  it('renders initial count', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    expect(container.querySelector('p')?.textContent).toBe('0')

    cleanup()
  })

  it('increments count on button click', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    // Initial state
    expect(container.querySelector('p')?.textContent).toBe('0')

    // Click button
    const button = container.querySelector('button')!
    click(button)
    await waitForUpdate()

    // Count should be incremented
    expect(container.querySelector('p')?.textContent).toBe('1')

    // Click again
    click(button)
    await waitForUpdate()

    expect(container.querySelector('p')?.textContent).toBe('2')

    cleanup()
  })

  it('handles multiple buttons with different actions', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p class="count">{count()}</p>
            <button class="inc" onClick={() => setCount(n => n + 1)}>+1</button>
            <button class="dec" onClick={() => setCount(n => n - 1)}>-1</button>
            <button class="reset" onClick={() => setCount(0)}>Reset</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const countEl = container.querySelector('.count')!
    const incBtn = container.querySelector('.inc')!
    const decBtn = container.querySelector('.dec')!
    const resetBtn = container.querySelector('.reset')!

    // Initial
    expect(countEl.textContent).toBe('0')

    // Increment
    click(incBtn)
    await waitForUpdate()
    expect(countEl.textContent).toBe('1')

    click(incBtn)
    await waitForUpdate()
    expect(countEl.textContent).toBe('2')

    // Decrement
    click(decBtn)
    await waitForUpdate()
    expect(countEl.textContent).toBe('1')

    // Reset
    click(resetBtn)
    await waitForUpdate()
    expect(countEl.textContent).toBe('0')

    cleanup()
  })

  it('updates multiple elements from same signal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p class="count">{count()}</p>
            <p class="doubled">doubled: {count() * 2}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const countEl = container.querySelector('.count')!
    const doubledEl = container.querySelector('.doubled')!
    const button = container.querySelector('button')!

    // Initial
    expect(countEl.textContent).toBe('0')
    expect(doubledEl.textContent).toBe('doubled: 0')

    // Click
    click(button)
    await waitForUpdate()

    expect(countEl.textContent).toBe('1')
    expect(doubledEl.textContent).toBe('doubled: 2')

    // Click again
    click(button)
    await waitForUpdate()

    expect(countEl.textContent).toBe('2')
    expect(doubledEl.textContent).toBe('doubled: 4')

    cleanup()
  })

  it('handles fragment root element', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return (
          <>
            <p class="counter">{count()}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const countEl = container.querySelector('.counter')!
    const button = container.querySelector('button')!

    expect(countEl.textContent).toBe('0')

    click(button)
    await waitForUpdate()

    expect(countEl.textContent).toBe('1')

    cleanup()
  })
})
