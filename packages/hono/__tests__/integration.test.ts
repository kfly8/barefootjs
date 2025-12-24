/**
 * Hono Server Component Adapter Integration Tests
 *
 * Tests that compile real components similar to examples/hono
 * to verify the full compilation pipeline with the Hono adapter.
 */

import { describe, it, expect } from 'bun:test'
import { compileJSX } from '@barefootjs/jsx'
import { honoServerAdapter } from '../src'

async function compile(source: string) {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  return compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: honoServerAdapter })
}

async function compileWithFiles(
  entryPath: string,
  files: Record<string, string>
) {
  return compileJSX(entryPath, async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { serverAdapter: honoServerAdapter })
}

describe('Hono Adapter Integration', () => {
  describe('Counter pattern (like examples/hono/Counter.tsx)', () => {
    it('compiles simple counter with signals', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        function Counter() {
          const [count, setCount] = createSignal(0)
          return (
            <>
              <p class="counter">{count()}</p>
              <button onClick={() => setCount(n => n + 1)}>+1</button>
            </>
          )
        }
      `
      const result = await compile(source)
      const component = result.components[0]

      // Server JSX should have:
      expect(component.serverJsx).toContain('import { useRequestContext }')
      expect(component.serverJsx).toContain('import manifest from')
      expect(component.serverJsx).toContain('export function Component')
      expect(component.serverJsx).toContain('className="counter"')
      expect(component.serverJsx).toContain('{0}')  // Initial value

      // Client JS should have:
      expect(component.clientJs).toContain('createSignal(0)')
      expect(component.clientJs).toContain('createEffect')
      expect(component.clientJs).toContain('setCount(n => n + 1)')
    })

    it('compiles counter with derived values', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        function Counter() {
          const [count, setCount] = createSignal(0)
          return (
            <div>
              <p class="count">{count()}</p>
              <p class="doubled">doubled: {count() * 2}</p>
            </div>
          )
        }
      `
      const result = await compile(source)
      const component = result.components[0]

      expect(component.serverJsx).toContain('{0}')       // count()
      expect(component.serverJsx).toContain('{0 * 2}')   // count() * 2
      expect(component.clientJs).toContain('String(count())')
      expect(component.clientJs).toContain('String(count() * 2)')
    })
  })

  describe('TodoApp pattern (like examples/hono/TodoApp.tsx)', () => {
    it('compiles list with key and event delegation', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        function TodoApp() {
          const [todos, setTodos] = createSignal([
            { id: 1, text: 'First', done: false }
          ])
          const remove = (id) => setTodos(todos().filter(t => t.id !== id))
          return (
            <ul>
              {todos().map(todo => (
                <li key={todo.id}>
                  <span>{todo.text}</span>
                  <button onClick={() => remove(todo.id)}>Delete</button>
                </li>
              ))}
            </ul>
          )
        }
      `
      const result = await compile(source)
      const component = result.components[0]

      // Server JSX should use map with key
      expect(component.serverJsx).toContain('.map((todo, __index) =>')
      expect(component.serverJsx).toContain('data-key={todo.id}')

      // Client JS should have event delegation
      expect(component.clientJs).toContain('reconcileList')
      expect(component.clientJs).toContain("addEventListener('click'")
      expect(component.clientJs).toContain('data-event-id')
    })

    it('compiles component with props for hydration', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        type Props = { initialTodos: Array<{ id: number; text: string }> }
        function TodoApp({ initialTodos }: Props) {
          const [todos, setTodos] = createSignal(initialTodos)
          return (
            <ul>
              {todos().map(todo => <li key={todo.id}>{todo.text}</li>)}
            </ul>
          )
        }
      `
      const result = await compile(source)
      const component = result.components[0]

      // Should include props in function signature
      expect(component.serverJsx).toContain('initialTodos')
      expect(component.serverJsx).toContain('__isRoot')
      expect(component.serverJsx).toContain('__hydrateProps')
      expect(component.serverJsx).toContain('data-bf-props="Component"')

      // Client JS should have auto-hydration
      expect(component.clientJs).toContain('initComponent')
      expect(component.clientJs).toContain('data-bf-props')
    })
  })

  describe('Child component pattern (like TodoItem)', () => {
    it('compiles parent with child component imports', async () => {
      const result = await compileWithFiles('/test/Parent.tsx', {
        '/test/Parent.tsx': `
          import Child from './Child'
          function Parent() {
            return (
              <div>
                <Child name="test" />
              </div>
            )
          }
        `,
        '/test/Child.tsx': `
          function Child({ name }) {
            return <span>{name}</span>
          }
        `,
      })

      const parent = result.components.find(c => c.name === 'Parent')
      const child = result.components.find(c => c.name === 'Child')

      expect(parent).toBeDefined()
      expect(child).toBeDefined()

      // Parent should import Child
      expect(parent!.serverJsx).toContain("import { Child } from './Child'")
      expect(parent!.serverJsx).toContain('<Child')
    })

    it('compiles child component with callback props (event handlers excluded from server)', async () => {
      const result = await compileWithFiles('/test/Parent.tsx', {
        '/test/Parent.tsx': `
          import { createSignal } from 'barefoot'
          import TodoItem from './TodoItem'
          function Parent() {
            const [items, setItems] = createSignal([{ id: 1, text: 'Test' }])
            const handleDelete = (id) => setItems(items().filter(x => x.id !== id))
            return (
              <ul>
                {items().map(item => (
                  <TodoItem
                    key={item.id}
                    item={item}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </ul>
            )
          }
        `,
        '/test/TodoItem.tsx': `
          function TodoItem({ item, onDelete }) {
            return (
              <li>
                <span>{item.text}</span>
                <button onClick={onDelete}>Delete</button>
              </li>
            )
          }
        `,
      })

      const parent = result.components.find(c => c.name === 'Parent')
      const todoItem = result.components.find(c => c.name === 'TodoItem')

      expect(parent).toBeDefined()
      expect(todoItem).toBeDefined()

      // TodoItem in list should have props (item) but not onDelete (event handler)
      expect(parent!.serverJsx).toContain('<TodoItem')
      expect(parent!.serverJsx).toContain('item={item}')
      // Event handlers are stripped from server JSX
      expect(parent!.serverJsx).not.toContain('onDelete={')
    })
  })

  describe('Script output deduplication', () => {
    it('generates script tracking logic', async () => {
      const source = `
        function Simple() {
          return <div>Hello</div>
        }
      `
      const result = await compile(source)
      const component = result.components[0]

      // Should track which scripts have been output
      expect(component.serverJsx).toContain('bfOutputScripts')
      expect(component.serverJsx).toContain('__needsBarefoot')
      expect(component.serverJsx).toContain('__needsThis')
      expect(component.serverJsx).toContain('__barefootSrc')
    })
  })
})
