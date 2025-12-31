/**
 * Edge Cases Tests
 *
 * ## Overview
 * Tests for edge cases that may cause issues in the compiler:
 * - Deeply nested JSX structures
 * - Recursive component patterns
 * - Complex expressions
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Deeply Nested JSX', () => {
  it('handles 5 levels of nesting', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <span>{count()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // createEffect should be generated for the dynamic content with String() wrapper
    // Expression is evaluated before element check to ensure signal dependencies are tracked
    expect(file.clientJs).toContain('createEffect')
    expect(file.clientJs).toContain('const __textValue = count()')
    expect(file.clientJs).toContain('_0.textContent = String(__textValue)')
  })

  it('handles nested elements with multiple dynamic values', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [a, setA] = createSignal(1)
        const [b, setB] = createSignal(2)
        const [c, setC] = createSignal(3)
        return (
          <div>
            <p>{a()}</p>
            <div>
              <p>{b()}</p>
              <div>
                <p>{c()}</p>
              </div>
            </div>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Three createEffect calls (sequential slot IDs) with String() wrapper
    // Expression is evaluated before element check to ensure signal dependencies are tracked
    expect(file.clientJs).toContain('const __textValue = a()')
    expect(file.clientJs).toContain('const __textValue = b()')
    expect(file.clientJs).toContain('const __textValue = c()')
    expect(file.clientJs).toContain('_0.textContent = String(__textValue)')
    expect(file.clientJs).toContain('_1.textContent = String(__textValue)')
    expect(file.clientJs).toContain('_2.textContent = String(__textValue)')
  })

  it('handles nested elements with events at different levels', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return (
          <div>
            <button onClick={() => setCount(n => n + 1)}>Outer</button>
            <div>
              <button onClick={() => setCount(n => n - 1)}>Inner</button>
              <div>
                <button onClick={() => setCount(0)}>Reset</button>
              </div>
            </div>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Event handlers should be set (sequential slot IDs)
    expect(file.clientJs).toContain('_0.onclick')
    expect(file.clientJs).toContain('_1.onclick')
    expect(file.clientJs).toContain('_2.onclick')
  })
})

describe('Complex Expressions', () => {
  it('handles nested ternary in map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { value: 1, type: 'a' },
          { value: 2, type: 'b' },
          { value: 3, type: 'c' }
        ])
        return (
          <ul>
            {items().map(item => (
              <li class={item.type === 'a' ? 'first' : item.type === 'b' ? 'second' : 'third'}>
                {item.value}
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Nested ternary should be in template
    expect(file.clientJs).toContain("item.type === 'a' ? 'first' : item.type === 'b' ? 'second' : 'third'")
  })

  it('handles arrow function with object destructuring in params', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, name: 'test' }])
        return (
          <ul>
            {items().map(({ id, name }) => (
              <li>{name} (ID: {id})</li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Should handle destructured params (parentheses may be omitted)
    expect(file.clientJs).toContain('{ id, name }')
    expect(file.clientJs).toContain('${name}')
    expect(file.clientJs).toContain('${id}')
  })

  it('handles string literals with special characters in conditions', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const handleKeyDown = (e) => {
          if (e.key === "'" && e.shiftKey) {
            console.log('quote')
          }
        }
        return <input onKeyDown={handleKeyDown} />
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Should preserve string with special characters
    expect(file.clientJs).toContain("e.key === \"'\"")
  })
})

describe('Component Composition', () => {
  it('handles ternary with JSX elements', async () => {
    const source = `
      import { createSignal } from 'barefoot'

      function Component() {
        const [show, setShow] = createSignal(true)
        return (
          <div>
            {show() ? <span>Visible</span> : <span>Hidden</span>}
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Ternary should be preserved in template or evaluated
    expect(file.clientJs).toContain('createEffect')
  })

  it('handles multiple signal dependencies', async () => {
    const source = `
      import { createSignal } from 'barefoot'

      function Component() {
        const [firstName, setFirstName] = createSignal('John')
        const [lastName, setLastName] = createSignal('Doe')
        return (
          <div>
            <span>{firstName()} {lastName()}</span>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Both signals should be in the effect
    expect(file.clientJs).toContain('firstName()')
    expect(file.clientJs).toContain('lastName()')
  })
})

describe('Whitespace Handling', () => {
  it('preserves trailing whitespace in text before elements', async () => {
    // JSX parser preserves whitespace within text nodes
    const source = `
      function Component() {
        return (
          <p>Done: <span>5</span></p>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // The "Done: " text (including trailing space) should be preserved
    expect(file.serverJsx).toContain('Done: <span>')
  })

  it('preserves leading text in whitespace after closing element', async () => {
    // Note: JSX drops pure whitespace between sibling elements at parser level
    // To preserve whitespace between elements, use {' '} or include text
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [done, setDone] = createSignal(5)
        const [total, setTotal] = createSignal(10)
        return (
          <p>Done: <span>{done()}</span>/ <span>{total()}</span></p>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // The "/ " text (including leading slash and trailing space) should be preserved
    expect(file.serverJsx).toContain('/ <span')
  })

  it('removes indentation whitespace between block elements', async () => {
    const source = `
      function Component() {
        return (
          <div>
            <p>First</p>
            <p>Second</p>
          </div>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // No extra whitespace between p elements (indentation stripped)
    expect(file.serverJsx).toContain('<p>First</p><p>Second</p>')
  })

  it('preserves explicit space expression between elements', async () => {
    // Use {' '} to explicitly add whitespace between sibling elements
    const source = `
      function Component() {
        return (
          <p><span>A</span>{' '}<span>B</span></p>
        )
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // The explicit space expression should be in the output
    expect(file.serverJsx).toContain('<span>A</span>{')
    expect(file.serverJsx).toContain('}<span>B</span>')
  })
})
