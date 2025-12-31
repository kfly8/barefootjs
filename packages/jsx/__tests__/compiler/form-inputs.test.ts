/**
 * Form Input Tests
 *
 * ## Overview
 * Verifies that form input elements (input, textarea, select, checkbox)
 * are correctly compiled with dynamic value binding and event handlers.
 *
 * ## Patterns Tested
 * - input with dynamic value attribute
 * - textarea with dynamic value
 * - select with dynamic value
 * - checkbox/radio with checked attribute
 * - onBlur event handler
 * - Combined input + onInput for two-way binding
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Form Inputs - Input Element', () => {
  it('input with dynamic value binding', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hello')
        return (
          <div>
            <input type="text" value={text()} onInput={(e) => setText(e.target.value)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic value is updated with createEffect
    // Includes undefined check to preserve server-rendered defaults
    expect(file.clientJs).toContain('createEffect(')
    expect(file.clientJs).toContain('.value = __val')
    expect(file.clientJs).toContain('if (__val !== undefined)')

    // Input handler is set
    expect(file.clientJs).toContain('.oninput = (e) =>')
    expect(file.clientJs).toContain('setText(e.target.value)')
  })

  it('input with onBlur event', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [touched, setTouched] = createSignal(false)
        return (
          <input type="text" onBlur={() => setTouched(true)} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // onblur handler is set
    expect(file.clientJs).toContain('.onblur = () =>')
    expect(file.clientJs).toContain('setTouched(true)')
  })

  it('input with onFocus event', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [focused, setFocused] = createSignal(false)
        return (
          <input type="text" onFocus={() => setFocused(true)} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // onfocus handler is set
    expect(file.clientJs).toContain('.onfocus = () =>')
    expect(file.clientJs).toContain('setFocused(true)')
  })

  it('input type="number" with dynamic value', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [num, setNum] = createSignal(0)
        return (
          <input type="number" value={num()} onInput={(e) => setNum(Number(e.target.value))} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic value is updated with undefined check
    expect(file.clientJs).toContain('.value = __val')
    expect(file.clientJs).toContain('if (__val !== undefined)')
    expect(file.clientJs).toContain('setNum(Number(e.target.value))')
  })
})

describe('Form Inputs - Textarea', () => {
  it('textarea with dynamic value binding', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [content, setContent] = createSignal('')
        return (
          <textarea value={content()} onInput={(e) => setContent(e.target.value)} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic value is updated with createEffect and undefined check
    expect(file.clientJs).toContain('createEffect(')
    expect(file.clientJs).toContain('.value = __val')
    expect(file.clientJs).toContain('if (__val !== undefined)')

    // Input handler is set
    expect(file.clientJs).toContain('.oninput = (e) =>')
  })
})

describe('Form Inputs - Select', () => {
  it('select with dynamic value binding', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [selected, setSelected] = createSignal('a')
        return (
          <select value={selected()} onChange={(e) => setSelected(e.target.value)}>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
            <option value="c">Option C</option>
          </select>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic value is updated with createEffect and undefined check
    expect(file.clientJs).toContain('createEffect(')
    expect(file.clientJs).toContain('.value = __val')
    expect(file.clientJs).toContain('if (__val !== undefined)')

    // Change handler is set
    expect(file.clientJs).toContain('.onchange = (e) =>')
    expect(file.clientJs).toContain('setSelected(e.target.value)')
  })
})

describe('Form Inputs - Checkbox', () => {
  it('checkbox with dynamic checked binding', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [checked, setChecked] = createSignal(false)
        return (
          <input type="checkbox" checked={checked()} onChange={() => setChecked(v => !v)} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic checked is updated with createEffect
    expect(file.clientJs).toContain('createEffect(')
    expect(file.clientJs).toContain('.checked = checked()')

    // Change handler is set
    expect(file.clientJs).toContain('.onchange = () =>')
    expect(file.clientJs).toContain('setChecked(v => !v)')
  })

  it('checkbox onChange with event target', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [checked, setChecked] = createSignal(false)
        return (
          <input type="checkbox" checked={checked()} onChange={(e) => setChecked(e.target.checked)} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Change handler preserves event argument
    expect(file.clientJs).toContain('.onchange = (e) =>')
    expect(file.clientJs).toContain('setChecked(e.target.checked)')
  })
})

describe('Form Inputs - Radio', () => {
  it('radio buttons with checked binding', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [selected, setSelected] = createSignal('a')
        return (
          <div>
            <input type="radio" name="option" value="a" checked={selected() === 'a'} onChange={() => setSelected('a')} />
            <input type="radio" name="option" value="b" checked={selected() === 'b'} onChange={() => setSelected('b')} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic checked for radio buttons
    expect(file.clientJs).toContain(".checked = selected() === 'a'")
    expect(file.clientJs).toContain(".checked = selected() === 'b'")
  })
})

describe('Form Inputs - Combined Patterns', () => {
  it('form with multiple controlled inputs', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [name, setName] = createSignal('')
        const [email, setEmail] = createSignal('')
        const [agreed, setAgreed] = createSignal(false)

        return (
          <form>
            <input type="text" value={name()} onInput={(e) => setName(e.target.value)} />
            <input type="email" value={email()} onInput={(e) => setEmail(e.target.value)} />
            <input type="checkbox" checked={agreed()} onChange={(e) => setAgreed(e.target.checked)} />
            <button type="submit">Submit</button>
          </form>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // All three inputs have dynamic bindings with undefined checks for value
    expect(file.clientJs).toContain('.value = __val')
    expect(file.clientJs).toContain('if (__val !== undefined)')
    expect(file.clientJs).toContain('.checked = agreed()')

    // All three inputs have event handlers
    expect(file.clientJs).toContain('setName(e.target.value)')
    expect(file.clientJs).toContain('setEmail(e.target.value)')
    expect(file.clientJs).toContain('setAgreed(e.target.checked)')
  })

  it('input with dynamic placeholder', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [placeholder, setPlaceholder] = createSignal('Enter text...')
        return (
          <input type="text" placeholder={placeholder()} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic placeholder is updated with createEffect using setAttribute
    // Includes undefined check to preserve server-rendered defaults
    expect(file.clientJs).toContain('createEffect(')
    expect(file.clientJs).toContain("setAttribute('placeholder', __val)")
    expect(file.clientJs).toContain('if (__val !== undefined)')
  })

  it('input with dynamic disabled state', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [disabled, setDisabled] = createSignal(false)
        return (
          <input type="text" disabled={disabled()} />
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Dynamic disabled is updated with createEffect
    expect(file.clientJs).toContain('createEffect(')
    expect(file.clientJs).toContain('disabled = disabled()')
  })
})
