/**
 * List E2E Test
 *
 * Tests list rendering and updates similar to TodoApp:
 * - Initial list rendering
 * - Adding items to list
 * - Removing items from list
 * - Updating items in list
 * - Event delegation within list items
 */

import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compile, setupDOM, click, waitForUpdate } from './test-helpers'

beforeAll(() => {
  // Only register if not already registered
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('List E2E', () => {
  it('renders initial list', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function List() {
        const [items, setItems] = createSignal(['Apple', 'Banana', 'Cherry'])
        return (
          <ul>
            {items().map(item => <li>{item}</li>)}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(3)
    expect(items[0].textContent).toBe('Apple')
    expect(items[1].textContent).toBe('Banana')
    expect(items[2].textContent).toBe('Cherry')

    cleanup()
  })

  it('updates list when signal changes', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function List() {
        const [items, setItems] = createSignal(['A', 'B'])
        return (
          <div>
            <ul>
              {items().map(item => <li>{item}</li>)}
            </ul>
            <button onClick={() => setItems([...items(), 'C'])}>Add</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    // Initial
    expect(container.querySelectorAll('li').length).toBe(2)

    // Click add button
    click(container.querySelector('button')!)
    await waitForUpdate()

    // List should have 3 items
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(3)
    expect(items[2].textContent).toBe('C')

    cleanup()
  })

  it('handles click events within list items', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function List() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'First' },
          { id: 2, text: 'Second' },
          { id: 3, text: 'Third' }
        ])
        const remove = (id) => setItems(items().filter(item => item.id !== id))
        return (
          <ul>
            {items().map(item => (
              <li key={item.id}>
                <span>{item.text}</span>
                <button onClick={() => remove(item.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    // Initial - 3 items
    expect(container.querySelectorAll('li').length).toBe(3)

    // Click delete on second item
    const deleteButtons = container.querySelectorAll('button')
    click(deleteButtons[1])
    await waitForUpdate()

    // Should have 2 items
    const items = container.querySelectorAll('li')
    expect(items.length).toBe(2)
    expect(items[0].querySelector('span')?.textContent).toBe('First')
    expect(items[1].querySelector('span')?.textContent).toBe('Third')

    cleanup()
  })

  it('handles toggle state in list items', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function TodoList() {
        const [todos, setTodos] = createSignal([
          { id: 1, text: 'Task 1', done: false },
          { id: 2, text: 'Task 2', done: true }
        ])
        const toggle = (id) => setTodos(todos().map(t =>
          t.id === id ? { ...t, done: !t.done } : t
        ))
        return (
          <ul>
            {todos().map(todo => (
              <li key={todo.id} class={todo.done ? 'done' : ''}>
                <span>{todo.text}</span>
                <button onClick={() => toggle(todo.id)}>Toggle</button>
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    // Initial state
    const items = container.querySelectorAll('li')
    expect(items[0].className).toBe('')
    expect(items[1].className).toBe('done')

    // Toggle first item
    click(container.querySelectorAll('button')[0])
    await waitForUpdate()

    // First item should now be done
    const updatedItems = container.querySelectorAll('li')
    expect(updatedItems[0].className).toBe('done')
    expect(updatedItems[1].className).toBe('done')

    cleanup()
  })

  it('shows computed values from list', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function TodoCounter() {
        const [todos, setTodos] = createSignal([
          { id: 1, done: false },
          { id: 2, done: true },
          { id: 3, done: false }
        ])
        const toggle = (id) => setTodos(todos().map(t =>
          t.id === id ? { ...t, done: !t.done } : t
        ))
        return (
          <div>
            <p class="count">Done: {todos().filter(t => t.done).length}</p>
            <ul>
              {todos().map(todo => (
                <li key={todo.id}>
                  <button onClick={() => toggle(todo.id)}>
                    {todo.done ? 'Undo' : 'Done'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    `
    const result = await compile(source)
    const { container, cleanup } = await setupDOM(result)

    // Initial: 1 done
    expect(container.querySelector('.count')?.textContent).toBe('Done: 1')

    // Toggle first item to done
    click(container.querySelectorAll('button')[0])
    await waitForUpdate()

    // Now 2 done
    expect(container.querySelector('.count')?.textContent).toBe('Done: 2')

    cleanup()
  })
})
