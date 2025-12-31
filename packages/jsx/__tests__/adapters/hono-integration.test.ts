/**
 * Hono Server Component Adapter Integration Tests
 *
 * Tests that compile real components similar to examples/hono
 * to verify the full compilation pipeline with the Hono adapter.
 */

import { describe, it, expect } from 'bun:test'
import { compileJSX, type CompileJSXResult } from '../../src'
import { honoServerAdapter } from '@barefootjs/hono'

async function compile(source: string): Promise<CompileJSXResult> {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  return compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { markedJsxAdapter: honoServerAdapter })
}

async function compileWithFiles(
  entryPath: string,
  files: Record<string, string>
): Promise<CompileJSXResult> {
  return compileJSX(entryPath, async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  }, { markedJsxAdapter: honoServerAdapter })
}

describe('Hono Adapter Integration', () => {
  describe('Counter pattern (like examples/hono/Counter.tsx)', () => {
    it('compiles simple counter with signals', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        function Component() {
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
      const file = result.files[0]

      // Server JSX should have:
      expect(file.markedJsx).toContain('import { useRequestContext }')
      expect(file.markedJsx).toContain('import manifest from')
      expect(file.markedJsx).toContain('export function Component')
      expect(file.markedJsx).toContain('className="counter"')
      expect(file.markedJsx).toContain('{0}')  // Initial value

      // Client JS should have:
      expect(file.clientJs).toContain('createSignal(0)')
      expect(file.clientJs).toContain('createEffect')
      expect(file.clientJs).toContain('setCount(n => n + 1)')
    })

    it('compiles counter with derived values', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        function Component() {
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
      const file = result.files[0]

      expect(file.markedJsx).toContain('{0}')       // count()
      expect(file.markedJsx).toContain('{0 * 2}')   // count() * 2
      // Expression is evaluated before element check to ensure signal dependencies are tracked
      expect(file.clientJs).toContain('const __textValue = count()')
      expect(file.clientJs).toContain('const __textValue = "doubled: " + String(count() * 2)')
      expect(file.clientJs).toContain('String(__textValue)')
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
      const file = result.files[0]

      // Server JSX should use map with key
      expect(file.markedJsx).toContain('.map((todo, __index) =>')
      expect(file.markedJsx).toContain('data-key={todo.id}')

      // Client JS should have event delegation
      expect(file.clientJs).toContain('reconcileList')
      expect(file.clientJs).toContain("addEventListener('click'")
      expect(file.clientJs).toContain('data-event-id')
    })

    it('compiles component with props for hydration', async () => {
      const source = `
        import { createSignal } from 'barefoot'
        type Props = { initialTodos: Array<{ id: number; text: string }> }
        function Component({ initialTodos }: Props) {
          const [todos, setTodos] = createSignal(initialTodos)
          return (
            <ul>
              {todos().map(todo => <li key={todo.id}>{todo.text}</li>)}
            </ul>
          )
        }
      `
      const result = await compile(source)
      const file = result.files[0]

      // Should include props in function signature
      expect(file.markedJsx).toContain('initialTodos')
      expect(file.markedJsx).toContain('__isRoot')
      expect(file.markedJsx).toContain('__hydrateProps')
      expect(file.markedJsx).toContain('data-bf-props="Component"')

      // Client JS should have auto-hydration
      expect(file.clientJs).toContain('initComponent')
      expect(file.clientJs).toContain('data-bf-props')
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

      const parent = result.files.find(f => f.componentNames.includes('Parent'))
      const child = result.files.find(f => f.componentNames.includes('Child'))

      expect(parent).toBeDefined()
      expect(child).toBeDefined()

      // Parent should import Child (preserving original import style - default import in this case)
      expect(parent!.markedJsx).toContain("import Child from './Child'")
      expect(parent!.markedJsx).toContain('<Child')
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

      const parent = result.files.find(f => f.componentNames.includes('Parent'))
      const todoItem = result.files.find(f => f.componentNames.includes('TodoItem'))

      expect(parent).toBeDefined()
      expect(todoItem).toBeDefined()

      // TodoItem in list should have props (item) but not onDelete (event handler)
      expect(parent!.markedJsx).toContain('<TodoItem')
      expect(parent!.markedJsx).toContain('item={item}')
      // Event handlers are stripped from server JSX
      expect(parent!.markedJsx).not.toContain('onDelete={')
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
      const file = result.files[0]

      // Should track which scripts have been output
      expect(file.markedJsx).toContain('bfOutputScripts')
      expect(file.markedJsx).toContain('__needsBarefoot')
      expect(file.markedJsx).toContain('__needsThis')
      expect(file.markedJsx).toContain('__barefootSrc')
    })
  })
})
