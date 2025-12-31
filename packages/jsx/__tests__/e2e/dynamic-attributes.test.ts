/**
 * Dynamic Attributes E2E Test
 *
 * Tests dynamic attribute patterns:
 * 1. className with signal: class={isActive() ? 'active' : ''}
 * 2. style with signal: style={color: isError() ? 'red' : 'black'}
 * 3. disabled with signal: disabled={isLoading()}
 * 4. value with signal: value={inputValue()}
 * 5. checked with signal: checked={isChecked()}
 * 6. hidden with signal: hidden={isHidden()}
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate, input } from './test-helpers'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Dynamic Attributes E2E', () => {
  describe('className', () => {
    it('renders initial className based on signal', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [active, setActive] = createSignal(false)
          return <div class={active() ? 'active' : 'inactive'}>Content</div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')!
      expect(div.className).toBe('inactive')

      cleanup()
    })

    it('updates className when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [active, setActive] = createSignal(false)
          return (
            <div>
              <span class={active() ? 'active' : 'inactive'}>Status</span>
              <button onClick={() => setActive(!active())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const span = container.querySelector('span')!
      const button = container.querySelector('button')!

      expect(span.className).toBe('inactive')

      click(button)
      await waitForUpdate()
      expect(span.className).toBe('active')

      click(button)
      await waitForUpdate()
      expect(span.className).toBe('inactive')

      cleanup()
    })

    it('handles multiple classes with ternary', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [state, setState] = createSignal('idle')
          return (
            <div>
              <span class={state() === 'loading' ? 'loading spin' : state() === 'error' ? 'error shake' : 'idle'}>
                Status
              </span>
              <button class="load" onClick={() => setState('loading')}>Load</button>
              <button class="error" onClick={() => setState('error')}>Error</button>
              <button class="reset" onClick={() => setState('idle')}>Reset</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const span = container.querySelector('span')!

      expect(span.className).toBe('idle')

      click(container.querySelector('.load')!)
      await waitForUpdate()
      expect(span.className).toBe('loading spin')

      click(container.querySelector('.error')!)
      await waitForUpdate()
      expect(span.className).toBe('error shake')

      click(container.querySelector('.reset')!)
      await waitForUpdate()
      expect(span.className).toBe('idle')

      cleanup()
    })
  })

  describe('disabled', () => {
    it('renders initial disabled state', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [loading, setLoading] = createSignal(true)
          return <button disabled={loading()}>Submit</button>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const button = container.querySelector('button')! as HTMLButtonElement
      expect(button.disabled).toBe(true)

      cleanup()
    })

    it('updates disabled when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [loading, setLoading] = createSignal(true)
          return (
            <div>
              <button class="submit" disabled={loading()}>Submit</button>
              <button class="toggle" onClick={() => setLoading(!loading())}>Toggle Loading</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const submitBtn = container.querySelector('.submit')! as HTMLButtonElement
      const toggleBtn = container.querySelector('.toggle')!

      expect(submitBtn.disabled).toBe(true)

      click(toggleBtn)
      await waitForUpdate()
      expect(submitBtn.disabled).toBe(false)

      click(toggleBtn)
      await waitForUpdate()
      expect(submitBtn.disabled).toBe(true)

      cleanup()
    })
  })

  describe('hidden', () => {
    it('renders initial hidden state', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isHidden, setIsHidden] = createSignal(true)
          return <div hidden={isHidden()}>Secret</div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')! as HTMLElement
      expect(div.hidden).toBe(true)

      cleanup()
    })

    it('updates hidden when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isHidden, setIsHidden] = createSignal(true)
          return (
            <div>
              <p class="secret" hidden={isHidden()}>Secret Content</p>
              <button onClick={() => setIsHidden(!isHidden())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const secret = container.querySelector('.secret')! as HTMLElement
      const button = container.querySelector('button')!

      expect(secret.hidden).toBe(true)

      click(button)
      await waitForUpdate()
      expect(secret.hidden).toBe(false)

      click(button)
      await waitForUpdate()
      expect(secret.hidden).toBe(true)

      cleanup()
    })
  })

  describe('checked', () => {
    it('renders initial checked state', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isChecked, setIsChecked] = createSignal(true)
          return <input type="checkbox" checked={isChecked()} />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const checkbox = container.querySelector('input')! as HTMLInputElement
      expect(checkbox.checked).toBe(true)

      cleanup()
    })

    it('updates checked when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isChecked, setIsChecked] = createSignal(false)
          return (
            <div>
              <input class="checkbox" type="checkbox" checked={isChecked()} />
              <button onClick={() => setIsChecked(!isChecked())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const checkbox = container.querySelector('.checkbox')! as HTMLInputElement
      const button = container.querySelector('button')!

      expect(checkbox.checked).toBe(false)

      click(button)
      await waitForUpdate()
      expect(checkbox.checked).toBe(true)

      click(button)
      await waitForUpdate()
      expect(checkbox.checked).toBe(false)

      cleanup()
    })
  })

  describe('value', () => {
    it('renders initial value', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [text, setText] = createSignal('initial')
          return <input value={text()} />
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      expect(inputEl.value).toBe('initial')

      cleanup()
    })

    it('updates value when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [text, setText] = createSignal('hello')
          return (
            <div>
              <input class="display" value={text()} />
              <button onClick={() => setText('world')}>Change</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('.display')! as HTMLInputElement
      const button = container.querySelector('button')!

      expect(inputEl.value).toBe('hello')

      click(button)
      await waitForUpdate()
      expect(inputEl.value).toBe('world')

      cleanup()
    })
  })

  describe('style', () => {
    it('renders initial style object', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isError, setIsError] = createSignal(false)
          return <div style={{ color: isError() ? 'red' : 'black' }}>Text</div>
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const div = container.querySelector('div')! as HTMLElement
      expect(div.style.color).toBe('black')

      cleanup()
    })

    it('updates style when signal changes', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [isError, setIsError] = createSignal(false)
          return (
            <div>
              <span style={{ color: isError() ? 'red' : 'green' }}>Status</span>
              <button onClick={() => setIsError(!isError())}>Toggle</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const span = container.querySelector('span')! as HTMLElement
      const button = container.querySelector('button')!

      expect(span.style.color).toBe('green')

      click(button)
      await waitForUpdate()
      expect(span.style.color).toBe('red')

      click(button)
      await waitForUpdate()
      expect(span.style.color).toBe('green')

      cleanup()
    })
  })

  describe('Multiple dynamic attributes', () => {
    it('handles multiple dynamic attributes on same element', async () => {
      const source = `
      "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [active, setActive] = createSignal(false)
          const [loading, setLoading] = createSignal(false)
          return (
            <div>
              <button
                class={active() ? 'btn-active' : 'btn-inactive'}
                disabled={loading()}
              >
                Submit
              </button>
              <button class="toggle-active" onClick={() => setActive(!active())}>Toggle Active</button>
              <button class="toggle-loading" onClick={() => setLoading(!loading())}>Toggle Loading</button>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const submitBtn = container.querySelector('button:not(.toggle-active):not(.toggle-loading)')! as HTMLButtonElement
      const toggleActive = container.querySelector('.toggle-active')!
      const toggleLoading = container.querySelector('.toggle-loading')!

      expect(submitBtn.className).toBe('btn-inactive')
      expect(submitBtn.disabled).toBe(false)

      click(toggleActive)
      await waitForUpdate()
      expect(submitBtn.className).toBe('btn-active')
      expect(submitBtn.disabled).toBe(false)

      click(toggleLoading)
      await waitForUpdate()
      expect(submitBtn.className).toBe('btn-active')
      expect(submitBtn.disabled).toBe(true)

      cleanup()
    })
  })
})
