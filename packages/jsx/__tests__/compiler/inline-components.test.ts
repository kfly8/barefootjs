/**
 * Test for inline component expansion in map
 *
 * ## Overview
 * Verify that components used within `.map()` are expanded inline
 * into template literals.
 *
 * ## Why inline expansion is needed
 * Components in map are reconciled with `reconcileList` every time
 * the parent array is updated. Therefore, it is necessary to
 * expand components into template strings rather than treat them
 * as individual DOM nodes.
 *
 * ## Supported patterns
 * - Components with props
 * - Components with event handlers
 * - Components with conditional rendering
 * - Components with multiple event handlers
 *
 * ## Generated code
 * ```typescript
 * // Input
 * {items().map(item => <Item key={item.id} item={item} onDelete={() => remove(item.id)} />)}
 *
 * // Item component
 * function Item({ item, onDelete }) {
 *   return <li><span>{item.text}</span><button onClick={() => onDelete()}>Delete</button></li>
 * }
 *
 * // Output (clientJs) - Item is expanded inline with reconcileList
 * reconcileList(l0, items(), (item, __index) => String(item.id),
 *   (item, __index) => `<li data-key="${item.id}"><span>${item.text}</span><button data-index="${__index}" data-event-id="0">Delete</button></li>`)
 *
 * l0.addEventListener('click', (e) => {
 *   const target = e.target.closest('[data-event-id="0"]')
 *   if (target && target.dataset.eventId === '0') {
 *     const __key = target.dataset.key
 *     const __index = items().findIndex((item) => String(item.id) === __key)
 *     if (__index === -1) return
 *     const item = items()[__index]
 *     remove(item.id)  // onDelete() is expanded
 *   }
 * })
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compileWithFiles } from './test-helpers'

describe('Inline component expansion in map', () => {
  it('Inline expansion of components with props', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
          return (
            <ul>
              {items().map(item => (
                <Item key={item.id} item={item} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        type Props = { item: { id: number; text: string } }
        function Item({ item }: Props) {
          return <li>{item.text}</li>
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appFile = result.files.find(f => f.componentNames.includes('App'))

    // Item component is expanded inline with reconcileList
    expect(appFile!.clientJs).toContain('reconcileList')
    expect(appFile!.clientJs).toContain('${item.text}')
  })

  it('Inline expansion of components with event handlers', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
          const remove = (id) => setItems(items().filter(i => i.id !== id))
          return (
            <ul>
              {items().map(item => (
                <Item key={item.id} item={item} onDelete={() => remove(item.id)} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        "use client"
        type Props = {
          item: { id: number; text: string }
          onDelete: () => void
        }
        function Item({ item, onDelete }: Props) {
          return (
            <li>
              <span>{item.text}</span>
              <button onClick={() => onDelete()}>Delete</button>
            </li>
          )
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appFile = result.files.find(f => f.componentNames.includes('App'))

    // Event handlers are converted to data-index and data-event-id
    expect(appFile!.clientJs).toContain('data-index="${__index}"')
    expect(appFile!.clientJs).toContain('data-event-id="0"')
    // Event delegation is generated
    expect(appFile!.clientJs).toContain("addEventListener('click'")
    // Handler content is expanded inline (onDelete() → remove(item.id))
    expect(appFile!.clientJs).toContain('remove(item.id)')
  })

  it('Inline expansion of components with conditional rendering', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello', editing: false }])
          return (
            <ul>
              {items().map(item => (
                <Item key={item.id} item={item} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        type Props = { item: { id: number; text: string; editing: boolean } }
        function Item({ item }: Props) {
          return (
            <li>
              {item.editing ? (
                <input value={item.text} />
              ) : (
                <span>{item.text}</span>
              )}
            </li>
          )
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appFile = result.files.find(f => f.componentNames.includes('App'))

    // Conditional rendering is included in template
    expect(appFile!.clientJs).toContain('item.editing ?')
  })

  it('Components with multiple event handlers', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello', done: false }])
          const toggle = (id) => setItems(items().map(i => i.id === id ? {...i, done: !i.done} : i))
          const remove = (id) => setItems(items().filter(i => i.id !== id))
          return (
            <ul>
              {items().map(item => (
                <Item
                  key={item.id}
                  item={item}
                  onToggle={() => toggle(item.id)}
                  onDelete={() => remove(item.id)}
                />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        "use client"
        type Props = {
          item: { id: number; text: string; done: boolean }
          onToggle: () => void
          onDelete: () => void
        }
        function Item({ item, onToggle, onDelete }: Props) {
          return (
            <li>
              <span>{item.text}</span>
              <button onClick={() => onToggle()}>Toggle</button>
              <button onClick={() => onDelete()}>Delete</button>
            </li>
          )
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appFile = result.files.find(f => f.componentNames.includes('App'))

    // Multiple event delegations are generated
    expect(appFile!.clientJs).toContain('toggle(item.id)')
    expect(appFile!.clientJs).toContain('remove(item.id)')
    // Different event-ids are used
    expect(appFile!.clientJs).toContain('data-event-id="0"')
    expect(appFile!.clientJs).toContain('data-event-id="1"')
  })
})
