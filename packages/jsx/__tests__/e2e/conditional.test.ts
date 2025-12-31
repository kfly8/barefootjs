/**
 * Conditional Rendering E2E Test
 *
 * Tests conditional rendering patterns:
 * 1. Text conditionals: {on() ? 'ON' : 'OFF'} ✅ Supported
 * 2. Element conditionals: {show() ? <span>A</span> : <span>B</span>} ⚠️ Initial render only
 * 3. Logical AND: {flag && <Component />} ⚠️ Initial render only
 * 4. Nested conditionals (text) ✅ Supported
 *
 * Note: JSX element switching (dynamic DOM manipulation) is currently NOT supported.
 * Only text-based conditionals update reactively.
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

describe('Conditional Rendering E2E', () => {
  describe('Text Conditionals (Supported)', () => {
    it('renders initial text based on signal value', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Toggle() {
          const [on, setOn] = createSignal(false)
          return <span>{on() ? 'ON' : 'OFF'}</span>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      expect(container.querySelector('span')?.textContent).toBe('OFF')

      cleanup()
    })

    it('updates text when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Toggle() {
          const [on, setOn] = createSignal(false)
          return (
            <div>
              <span class="status">{on() ? 'ON' : 'OFF'}</span>
              <button onClick={() => setOn(!on())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const status = container.querySelector('.status')!
      const button = container.querySelector('button')!

      // Initial state
      expect(status.textContent).toBe('OFF')

      // Toggle on
      click(button)
      await waitForUpdate()
      expect(status.textContent).toBe('ON')

      // Toggle off
      click(button)
      await waitForUpdate()
      expect(status.textContent).toBe('OFF')

      cleanup()
    })

    it('handles nested ternary operators for text', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Nested() {
          const [level, setLevel] = createSignal(0)
          return (
            <div>
              <span class="display">
                {level() === 0 ? 'Zero' : level() === 1 ? 'One' : 'Many'}
              </span>
              <button onClick={() => setLevel(n => n + 1)}>+1</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const display = container.querySelector('.display')!
      const button = container.querySelector('button')!

      expect(display.textContent).toBe('Zero')

      click(button)
      await waitForUpdate()
      expect(display.textContent).toBe('One')

      click(button)
      await waitForUpdate()
      expect(display.textContent).toBe('Many')

      cleanup()
    })

    it('handles text with multiple conditions', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Status() {
          const [status, setStatus] = createSignal('idle')
          return (
            <div>
              <span class="display">
                {status() === 'loading' ? 'Loading...' : status() === 'error' ? 'Error!' : 'Ready'}
              </span>
              <button class="load" onClick={() => setStatus('loading')}>Load</button>
              <button class="error" onClick={() => setStatus('error')}>Error</button>
              <button class="reset" onClick={() => setStatus('idle')}>Reset</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const display = container.querySelector('.display')!

      // Initial state
      expect(display.textContent).toBe('Ready')

      // Click load
      click(container.querySelector('.load')!)
      await waitForUpdate()
      expect(display.textContent).toBe('Loading...')

      // Click error
      click(container.querySelector('.error')!)
      await waitForUpdate()
      expect(display.textContent).toBe('Error!')

      // Click reset
      click(container.querySelector('.reset')!)
      await waitForUpdate()
      expect(display.textContent).toBe('Ready')

      cleanup()
    })
  })

  describe('Element Conditionals (Initial Render Only)', () => {
    it('renders initial element based on signal value (true)', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Toggle() {
          const [show, setShow] = createSignal(true)
          return (
            <div class="container">
              {show() ? <span class="visible">Visible</span> : <span class="hidden">Hidden</span>}
            </div>
          )
        }
      `
      const result = await compile(source)

      // Check initial HTML is correctly generated
      expect(result.html).toContain('class="visible"')
      expect(result.html).toContain('Visible')
      expect(result.html).not.toContain('class="hidden"')
    })

    it('renders initial element based on signal value (false)', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Toggle() {
          const [show, setShow] = createSignal(false)
          return (
            <div class="container">
              {show() ? <span class="visible">Visible</span> : <span class="hidden">Hidden</span>}
            </div>
          )
        }
      `
      const result = await compile(source)

      // Check initial HTML is correctly generated
      expect(result.html).toContain('class="hidden"')
      expect(result.html).toContain('Hidden')
      expect(result.html).not.toContain('class="visible"')
    })

    it('switches elements when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Toggle() {
          const [show, setShow] = createSignal(true)
          return (
            <div>
              <div class="container">
                {show() ? <span class="visible">Visible</span> : <span class="hidden">Hidden</span>}
              </div>
              <button onClick={() => setShow(!show())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const containerDiv = container.querySelector('.container')!
      const button = container.querySelector('button')!

      // Initial state
      expect(containerDiv.querySelector('.visible')?.textContent).toBe('Visible')
      expect(containerDiv.querySelector('.hidden')).toBeNull()

      // Toggle to show hidden
      click(button)
      await waitForUpdate()
      expect(containerDiv.querySelector('.visible')).toBeNull()
      expect(containerDiv.querySelector('.hidden')?.textContent).toBe('Hidden')

      cleanup()
    })
  })

  describe('Logical AND (Initial Render Only)', () => {
    it('renders element when condition is true', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Show() {
          const [visible, setVisible] = createSignal(true)
          return (
            <div class="container">
              {visible() && <span class="content">Content</span>}
            </div>
          )
        }
      `
      const result = await compile(source)

      // Check initial HTML
      expect(result.html).toContain('class="content"')
      expect(result.html).toContain('Content')
    })

    it('does not render element when condition is false', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Show() {
          const [visible, setVisible] = createSignal(false)
          return (
            <div class="container">
              {visible() && <span class="content">Content</span>}
            </div>
          )
        }
      `
      const result = await compile(source)

      // Check initial HTML - should not contain the content
      expect(result.html).not.toContain('class="content"')
    })

    it('toggles element visibility with &&', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Show() {
          const [visible, setVisible] = createSignal(false)
          return (
            <div>
              <div class="container">
                {visible() && <span class="content">Content</span>}
              </div>
              <button onClick={() => setVisible(!visible())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const containerDiv = container.querySelector('.container')!
      const button = container.querySelector('button')!

      // Initial state - hidden
      expect(containerDiv.querySelector('.content')).toBeNull()

      // Show
      click(button)
      await waitForUpdate()
      expect(containerDiv.querySelector('.content')?.textContent).toBe('Content')

      cleanup()
    })
  })

  describe('Null/Undefined Handling (Initial Render Only)', () => {
    it('handles null in ternary (initial render)', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Show() {
          const [show, setShow] = createSignal(false)
          return (
            <div class="container">
              {show() ? <span class="content">Content</span> : null}
            </div>
          )
        }
      `
      const result = await compile(source)

      // Initial HTML should be empty inside container
      expect(result.html).toContain('class="container"')
      expect(result.html).not.toContain('class="content"')
    })

    it('transitions between element and null', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Show() {
          const [show, setShow] = createSignal(false)
          return (
            <div>
              <div class="container">
                {show() ? <span class="content">Content</span> : null}
              </div>
              <button onClick={() => setShow(!show())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const containerDiv = container.querySelector('.container')!
      const button = container.querySelector('button')!

      // Initial - null
      expect(containerDiv.querySelector('.content')).toBeNull()

      // Show element
      click(button)
      await waitForUpdate()
      expect(containerDiv.querySelector('.content')?.textContent).toBe('Content')

      cleanup()
    })
  })

  describe('Fragment in Conditionals (Initial Render Only)', () => {
    it('renders fragment in conditional branch (initial render)', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function FragmentConditional() {
          const [show, setShow] = createSignal(true)
          return (
            <div>
              <div class="container">
                {show() ? (
                  <>
                    <span class="first">First</span>
                    <span class="second">Second</span>
                  </>
                ) : (
                  <span class="single">Single</span>
                )}
              </div>
              <button onClick={() => setShow(!show())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)

      // Initial HTML should contain both spans from the fragment
      expect(result.html).toContain('class="first"')
      expect(result.html).toContain('First')
      expect(result.html).toContain('class="second"')
      expect(result.html).toContain('Second')
      expect(result.html).not.toContain('class="single"')
    })

    it('handles fragment in conditional branch (dynamic)', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function FragmentConditional() {
          const [show, setShow] = createSignal(true)
          return (
            <div>
              <div class="container">
                {show() ? (
                  <>
                    <span class="first">First</span>
                    <span class="second">Second</span>
                  </>
                ) : (
                  <span class="single">Single</span>
                )}
              </div>
              <button onClick={() => setShow(!show())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const containerDiv = container.querySelector('.container')!
      const button = container.querySelector('button')!

      // Initial - fragment with two spans
      expect(containerDiv.querySelector('.first')?.textContent).toBe('First')
      expect(containerDiv.querySelector('.second')?.textContent).toBe('Second')
      expect(containerDiv.querySelector('.single')).toBeNull()

      // Toggle to single span
      click(button)
      await waitForUpdate()
      expect(containerDiv.querySelector('.first')).toBeNull()
      expect(containerDiv.querySelector('.second')).toBeNull()
      expect(containerDiv.querySelector('.single')?.textContent).toBe('Single')

      cleanup()
    })
  })
})
