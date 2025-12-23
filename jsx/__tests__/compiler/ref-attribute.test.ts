/**
 * Ref Attribute Support Test
 *
 * ## Overview
 * Tests for JSX ref attribute support.
 * Ref allows getting a reference to the DOM element.
 *
 * ## Supported Patterns
 * - ref callback: ref={(el) => inputRef = el}
 * - ref with signal setter: ref={setInputRef}
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Ref Attribute Support', () => {
  it('ref callback sets element reference', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        let inputRef
        const [value, setValue] = createSignal('')
        return (
          <div>
            <input ref={(el) => inputRef = el} value={value()} />
            <button onClick={() => inputRef?.focus()}>Focus</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Client JS should include ref callback execution
    expect(component.clientJs).toContain('inputRef = el')
    // Server JSX should NOT contain ref attribute
    expect(component.serverJsx).not.toContain('ref=')
  })

  it('ref is not output in server JSX', async () => {
    const source = `
      function Component() {
        let divRef
        return (
          <div ref={(el) => divRef = el} className="container">
            Content
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Server JSX should have className but not ref
    expect(component.serverJsx).toContain('className="container"')
    expect(component.serverJsx).not.toContain('ref=')
  })

  it('ref on element with event handler', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        let buttonRef
        const [count, setCount] = createSignal(0)
        return (
          <button
            ref={(el) => buttonRef = el}
            onClick={() => setCount(count() + 1)}
          >
            Count: {count()}
          </button>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Root elements use path-based navigation, no data-bf needed
    expect(component.serverJsx).not.toContain('data-bf=')
    // Client JS should have both ref and click handler
    expect(component.clientJs).toContain('buttonRef = el')
    expect(component.clientJs).toContain('onclick')
  })

  it('ref on element with dynamic content', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        let spanRef
        const [text, setText] = createSignal('Hello')
        return (
          <span ref={(el) => spanRef = el}>{text()}</span>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Client JS should have ref callback
    expect(component.clientJs).toContain('spanRef = el')
    // Should also have createEffect for dynamic content
    expect(component.clientJs).toContain('createEffect')
  })

  it('multiple refs on different elements', async () => {
    const source = `
      function Component() {
        let input1Ref
        let input2Ref
        return (
          <div>
            <input ref={(el) => input1Ref = el} placeholder="First" />
            <input ref={(el) => input2Ref = el} placeholder="Second" />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Both refs should be in client JS
    expect(component.clientJs).toContain('input1Ref = el')
    expect(component.clientJs).toContain('input2Ref = el')
  })
})
