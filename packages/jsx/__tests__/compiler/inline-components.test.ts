/**
 * Test for inline component expansion in map
 *
 * ## Overview
 * Verify that components used within `.map()` are expanded inline
 * into template literals.
 *
 * ## Why inline expansion is needed
 * Components in map are re-rendered with `innerHTML` every time
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
 * {items().map(item => <Item item={item} onDelete={() => remove(item.id)} />)}
 *
 * // Item component
 * function Item({ item, onDelete }) {
 *   return <li><span>{item.text}</span><button onClick={() => onDelete()}>Delete</button></li>
 * }
 *
 * // Output (clientJs) - Item is expanded inline
 * l0.innerHTML = items().map((item, __index) =>
 *   `<li><span>${item.text}</span><button data-index="${__index}" data-event-id="0">Delete</button></li>`
 * ).join('')
 *
 * l0.addEventListener('click', (e) => {
 *   const target = e.target.closest('[data-event-id="0"]')
 *   if (target && target.dataset.eventId === '0') {
 *     const __index = parseInt(target.dataset.index, 10)
 *     const item = items()[__index]
 *     remove(item.id)  // onDelete() is expanded
 *     updateAll()
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
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
          return (
            <ul>
              {items().map(item => (
                <Item item={item} />
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
    const appComponent = result.components.find(c => c.name === 'App')

    // Item component is expanded inline in HTML (with __index for event delegation support)
    expect(appComponent!.clientJs).toContain('items().map((item, __index) => `<li>${item.text}</li>`).join(\'\')')
  })

  it('Inline expansion of components with event handlers', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
          const remove = (id) => setItems(items().filter(i => i.id !== id))
          return (
            <ul>
              {items().map(item => (
                <Item item={item} onDelete={() => remove(item.id)} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
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
    const appComponent = result.components.find(c => c.name === 'App')

    // Event handlers are converted to data-index and data-event-id
    expect(appComponent!.clientJs).toContain('data-index="${__index}"')
    expect(appComponent!.clientJs).toContain('data-event-id="0"')
    // Event delegation is generated
    expect(appComponent!.clientJs).toContain("addEventListener('click'")
    // Handler content is expanded inline (onDelete() → remove(item.id))
    expect(appComponent!.clientJs).toContain('remove(item.id)')
  })

  it('Inline expansion of components with conditional rendering', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello', editing: false }])
          return (
            <ul>
              {items().map(item => (
                <Item item={item} />
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
    const appComponent = result.components.find(c => c.name === 'App')

    // Conditional rendering is included in template
    expect(appComponent!.clientJs).toContain('item.editing ?')
  })

  it('Components with multiple event handlers', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
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
    const appComponent = result.components.find(c => c.name === 'App')

    // Multiple event delegations are generated
    expect(appComponent!.clientJs).toContain('toggle(item.id)')
    expect(appComponent!.clientJs).toContain('remove(item.id)')
    // Different event-ids are used
    expect(appComponent!.clientJs).toContain('data-event-id="0"')
    expect(appComponent!.clientJs).toContain('data-event-id="1"')
  })
})
