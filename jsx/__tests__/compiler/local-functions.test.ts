/**
 * Test for local functions in components
 *
 * ## Overview
 * Verify that local functions (handler functions) defined within
 * components are correctly output to client JS.
 *
 * ## Supported patterns
 * - Handlers defined as arrow functions
 * - Multiple handler functions
 * - Mixed with signal declarations
 * - Removal of TypeScript type annotations
 *
 * ## Generated code
 * ```typescript
 * // Input
 * const handleToggle = (id: number) => {
 *   setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))
 * }
 *
 * // Output (clientJs) - Type annotations are removed
 * const handleToggle = (id) => {
 *   setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))
 * }
 * ```
 *
 * ## Notes
 * - Only functions that include signal calls are extracted
 * - TypeScript type annotations are removed
 * - Default arguments are preserved
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('Local functions in components', () => {
  it('Handlers defined as arrow functions are output', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, done: false }])
        const handleToggle = (id) => {
          setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))
        }
        return (
          <ul>
            {items().map(item => (
              <li>
                <button onClick={() => handleToggle(item.id)}>Toggle</button>
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Handler function is defined
    expect(component.clientJs).toContain('const handleToggle = (id) =>')
    expect(component.clientJs).toContain('setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))')
  })

  it('Multiple handler functions are output', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([])
        const handleAdd = () => {
          setItems([...items(), { id: Date.now() }])
        }
        const handleDelete = (id) => {
          setItems(items().filter(t => t.id !== id))
        }
        return (
          <div>
            <button onClick={() => handleAdd()}>Add</button>
            <ul>
              {items().map(item => (
                <li>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Both handler functions are defined
    expect(component.clientJs).toContain('const handleAdd = () =>')
    expect(component.clientJs).toContain('const handleDelete = (id) =>')
  })

  it('Correctly extracted even when mixed with signal declarations', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        const [name, setName] = createSignal('')
        const increment = () => {
          setCount(count() + 1)
        }
        const reset = () => {
          setCount(0)
          setName('')
        }
        return (
          <div>
            <button onClick={() => increment()}>+1</button>
            <button onClick={() => reset()}>Reset</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Signal declarations are as usual
    expect(component.clientJs).toContain('const [count, setCount] = createSignal(0)')
    expect(component.clientJs).toContain("const [name, setName] = createSignal('')")
    // Handler functions are also output
    expect(component.clientJs).toContain('const increment = () =>')
    expect(component.clientJs).toContain('const reset = () =>')
  })

  it('TypeScript type annotations are removed', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal<{ id: number; done: boolean }[]>([])
        const handleToggle = (id: number) => {
          setItems(items().map((t: { id: number; done: boolean }) =>
            t.id === id ? { ...t, done: !t.done } : t
          ))
        }
        const handleAdd = (text: string, priority: number = 1) => {
          setItems([...items(), { id: Date.now(), done: false }])
        }
        return (
          <ul>
            {items().map(item => (
              <li>
                <button onClick={() => handleToggle(item.id)}>切替</button>
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Type annotations are removed
    expect(component.clientJs).not.toContain(': number')
    expect(component.clientJs).not.toContain(': string')
    expect(component.clientJs).not.toContain(': {')
    // Functions themselves are output
    expect(component.clientJs).toContain('const handleToggle = (id) =>')
    expect(component.clientJs).toContain('const handleAdd = (text, priority = 1) =>')
  })
})
