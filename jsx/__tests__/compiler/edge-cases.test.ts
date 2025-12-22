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
    const component = result.components[0]

    // Dynamic element should have an ID
    expect(component.serverComponent).toContain('id="__d0"')
    // createEffect should be generated for the dynamic content
    expect(component.clientJs).toContain('createEffect')
    expect(component.clientJs).toContain('__d0.textContent = count()')
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
    const component = result.components[0]

    // All three dynamic elements should have IDs
    expect(component.serverComponent).toContain('id="__d0"')
    expect(component.serverComponent).toContain('id="__d1"')
    expect(component.serverComponent).toContain('id="__d2"')

    // Three createEffect calls
    expect(component.clientJs).toContain('__d0.textContent = a()')
    expect(component.clientJs).toContain('__d1.textContent = b()')
    expect(component.clientJs).toContain('__d2.textContent = c()')
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
    const component = result.components[0]

    // All three buttons should have IDs
    expect(component.serverComponent).toContain('id="__b0"')
    expect(component.serverComponent).toContain('id="__b1"')
    expect(component.serverComponent).toContain('id="__b2"')

    // Event handlers should be set
    expect(component.clientJs).toContain('__b0.onclick')
    expect(component.clientJs).toContain('__b1.onclick')
    expect(component.clientJs).toContain('__b2.onclick')
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
    const component = result.components[0]

    // List should have ID
    expect(component.serverComponent).toContain('id="__l0"')
    // Nested ternary should be in template
    expect(component.clientJs).toContain("item.type === 'a' ? 'first' : item.type === 'b' ? 'second' : 'third'")
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
    const component = result.components[0]

    // Should handle destructured params (parentheses may be omitted)
    expect(component.clientJs).toContain('{ id, name }')
    expect(component.clientJs).toContain('${name}')
    expect(component.clientJs).toContain('${id}')
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
    const component = result.components[0]

    // Should preserve string with special characters
    expect(component.clientJs).toContain("e.key === \"'\"")
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
    const component = result.components[0]

    // Ternary should be preserved in template or evaluated
    expect(component.serverComponent).toBeDefined()
    expect(component.clientJs).toContain('createEffect')
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
    const component = result.components[0]

    // Both signals should be in the effect
    expect(component.clientJs).toContain('firstName()')
    expect(component.clientJs).toContain('lastName()')
  })
})
