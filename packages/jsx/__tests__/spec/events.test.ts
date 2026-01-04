/**
 * Events Specification Tests
 *
 * Tests for EVT-XXX spec items.
 * Each test has 1:1 correspondence with spec/spec.tsv entries.
 *
 * This file focuses on E2E tests for partial status items:
 * - EVT-007: onBlur with capture
 * - EVT-008: onFocus with capture
 * - EVT-012: onFocus in list
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
  // EVT-007: <input onBlur={() => validate()}/> - blur event handling
  describe('EVT-007: onBlur event', () => {
    it('fires blur handler when input loses focus', async () => {
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
      const statusEl = container.querySelector('.status')!

      expect(statusEl.textContent).toBe('Not blurred')

      // Trigger blur event
      inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()

      expect(statusEl.textContent).toBe('Blurred')

      cleanup()
    })

    it('validates input on blur', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [value, setValue] = createSignal('')
          const [error, setError] = createSignal('')
          const validate = () => {
            if (value().trim() === '') {
              setError('Required')
            } else {
              setError('')
            }
          }
          return (
            <div>
              <input
                type="text"
                value={value()}
                onInput={(e) => setValue(e.target.value)}
                onBlur={validate}
              />
              <p class="error">{error()}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')! as HTMLInputElement
      const errorEl = container.querySelector('.error')!

      expect(errorEl.textContent).toBe('')

      // Blur with empty value - should show error
      inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()
      expect(errorEl.textContent).toBe('Required')

      // Enter value and blur - error should clear
      input(inputEl, 'test')
      inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()
      expect(errorEl.textContent).toBe('')

      cleanup()
    })
  })

  // EVT-008: <input onFocus={() => highlight()}/> - focus event handling
  describe('EVT-008: onFocus event', () => {
    it('fires focus handler when input receives focus', async () => {
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
      const statusEl = container.querySelector('.status')!

      expect(statusEl.textContent).toBe('Not focused')

      // Trigger focus event
      inputEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await waitForUpdate()

      expect(statusEl.textContent).toBe('Focused')

      cleanup()
    })

    it('tracks focus and blur together', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [active, setActive] = createSignal(false)
          return (
            <div>
              <input
                type="text"
                class={active() ? 'focused' : ''}
                onFocus={() => setActive(true)}
                onBlur={() => setActive(false)}
              />
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputEl = container.querySelector('input')!

      expect(inputEl.className).toBe('')

      // Focus
      inputEl.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await waitForUpdate()
      expect(inputEl.className).toBe('focused')

      // Blur
      inputEl.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()
      expect(inputEl.className).toBe('')

      cleanup()
    })
  })

  // EVT-012: <li onFocus={...}> in list - focus event in list items
  describe('EVT-012: onFocus in list', () => {
    it('fires focus handler in list items', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [items, setItems] = createSignal([
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' }
          ])
          const [focusedId, setFocusedId] = createSignal(null)
          return (
            <div>
              <ul>
                {items().map(item => (
                  <li key={item.id}>
                    <input
                      type="text"
                      value={item.name}
                      onFocus={() => setFocusedId(item.id)}
                    />
                  </li>
                ))}
              </ul>
              <p class="focused-id">Focused: {focusedId() ?? 'none'}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const inputs = container.querySelectorAll('input')
      const focusedIdEl = container.querySelector('.focused-id')!

      expect(focusedIdEl.textContent).toBe('Focused: none')

      // Focus second input
      inputs[1].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await waitForUpdate()
      expect(focusedIdEl.textContent).toBe('Focused: 2')

      // Focus first input
      inputs[0].dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      await waitForUpdate()
      expect(focusedIdEl.textContent).toBe('Focused: 1')

      cleanup()
    })

    it('handles blur in list items (re-renders list)', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'
        function Component() {
          const [items, setItems] = createSignal([
            { id: 1, name: 'Item 1', touched: false },
            { id: 2, name: 'Item 2', touched: false }
          ])
          const markTouched = (id) => {
            setItems(items().map(item =>
              item.id === id ? { ...item, touched: true } : item
            ))
          }
          return (
            <ul>
              {items().map(item => (
                <li key={item.id} class={item.touched ? 'touched' : ''}>
                  <input type="text" onBlur={() => markTouched(item.id)} />
                </li>
              ))}
            </ul>
          )
        }
      `
      const result = await compile(source)
      const { container, cleanup } = await setupDOM(result)

      const listItems = container.querySelectorAll('li')
      expect(listItems[0].className).toBe('')
      expect(listItems[1].className).toBe('')

      // Blur first input - list will re-render
      const inputs = container.querySelectorAll('input')
      inputs[0].dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      await waitForUpdate()

      // After list re-render, query fresh elements
      const updatedListItems = container.querySelectorAll('li')
      expect(updatedListItems[0].className).toBe('touched')
      expect(updatedListItems[1].className).toBe('')

      cleanup()
    })
  })

  // Additional event specs with existing coverage (references)
  // EVT-001: See event-handlers.test.ts:49
  // EVT-002: See event-handlers.test.ts:77
  // EVT-003: See event-handlers.test.ts:103
  // EVT-004: See event-handlers.test.ts:127
  // EVT-005: See event-handlers.test.ts:149
  // EVT-006: See event-handlers.test.ts:176
  // EVT-010: See list-rendering.test.ts:89
  // EVT-011: See list-rendering.test.ts:114
  // EVT-020, EVT-021: See list-rendering.test.ts:224, 245
})
