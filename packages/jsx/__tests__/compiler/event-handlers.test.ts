/**
 * Event Handler Tests
 *
 * ## Overview
 * Verifies that event handlers on JSX elements (onClick, onChange, onInput, etc.)
 * are correctly converted to client JS.
 *
 * ## Supported Patterns
 * - onClick: button clicks, etc.
 * - onChange: input value changes
 * - onInput: real-time updates during input
 * - onSubmit: form submissions
 * - onKeyDown: keyboard events
 *
 * ## Generated Code (Slot Registry Pattern)
 * ```typescript
 * // Input
 * <button onClick={() => setCount(n => n + 1)}>+1</button>
 *
 * // Output (HTML)
 * <button data-bf="0">+1</button>
 *
 * // Output (clientJs) - with existence checks for reliable hydration
 * const _0 = document.querySelector('[data-bf="0"]')
 * if (_0) {
 *   _0.onclick = () => setCount(n => n + 1)
 * }
 *
 * // Dynamic elements are updated with createEffect
 * if (_1) {
 *   createEffect(() => {
 *     _1.textContent = count()
 *   })
 * }
 * ```
 *
 * ## Notes
 * - Dynamic content is auto-tracked with `createEffect()`
 * - Event argument `(e)` is preserved
 * - Slot IDs are sequential numbers (0, 1, 2...)
 * - Each element is checked for existence before processing
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Event Handlers - Basic', () => {
  it('onClick', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
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
    const component = result.components[0]

    // onclick handler is set (with existence check)
    expect(component.clientJs).toContain('_1.onclick')
    expect(component.clientJs).toContain('setCount(n => n + 1)')

    // Dynamic content is updated with createEffect
    expect(component.clientJs).toContain('createEffect(')

    // Existence checks are added
    expect(component.clientJs).toContain('if (_1)')
  })

  it('multiple onClick', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
            <button onClick={() => setCount(n => n - 1)}>-1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Multiple onclick handlers with sequential IDs
    expect(component.clientJs).toContain('_1.onclick')
    expect(component.clientJs).toContain('_2.onclick')
  })
})

describe('Event Handlers - Form', () => {
  it('onChange', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('')
        return (
          <div>
            <p>{text()}</p>
            <input onChange={(e) => setText(e.target.value)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // onchange handler is set (event argument is preserved)
    expect(component.clientJs).toContain('_1.onchange = (e) =>')
    expect(component.clientJs).toContain('setText(e.target.value)')

    // Dynamic content is updated with createEffect
    expect(component.clientJs).toContain('createEffect(')
  })

  it('onInput (with event argument)', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('')
        return (
          <div>
            <p>{text()}</p>
            <input onInput={(e) => setText(e.target.value)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // oninput handler is set (event argument is preserved)
    expect(component.clientJs).toContain('_1.oninput = (e) =>')
    expect(component.clientJs).toContain('setText(e.target.value)')
  })

  it('onSubmit', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [submitted, setSubmitted] = createSignal(false)
        return (
          <div>
            <p>{submitted() ? 'Done' : 'Not yet'}</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
              <button type="submit">Submit</button>
            </form>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // onsubmit handler is set
    expect(component.clientJs).toContain('_1.onsubmit')
    expect(component.clientJs).toContain('e.preventDefault()')
    expect(component.clientJs).toContain('setSubmitted(true)')
  })
})

describe('Event Handlers - Keyboard', () => {
  it('onKeyDown', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('')
        const [submitted, setSubmitted] = createSignal(false)
        return (
          <div>
            <p>{submitted() ? 'Submitted' : 'Type and press Enter'}</p>
            <input onKeyDown={(e) => e.key === 'Enter' && setSubmitted(true)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // onkeydown handler is set
    expect(component.clientJs).toContain('_1.onkeydown')
    expect(component.clientJs).toContain("e.key === 'Enter'")
    expect(component.clientJs).toContain('setSubmitted(true)')
  })
})
