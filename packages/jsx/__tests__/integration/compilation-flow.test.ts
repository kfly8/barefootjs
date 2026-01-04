/**
 * Full Compilation Flow Integration Tests
 *
 * Tests the complete JSX compilation pipeline:
 * JSX Source → IR → Server JSX + Client JS
 */

import { describe, it, expect } from 'bun:test'
import { compile, compileWithFiles } from '../compiler/test-helpers'

describe('Full Compilation Flow', () => {
  describe('simple components', () => {
    it('compiles a simple counter component', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        function Counter() {
          const [count, setCount] = createSignal(0)
          return (
            <div class="counter">
              <p>{count()}</p>
              <button onClick={() => setCount(n => n + 1)}>+</button>
            </div>
          )
        }
      `

      const result = await compile(source)
      expect(result.files.length).toBe(1)

      const file = result.files[0]

      // Server JSX should contain:
      // - data-bf-scope marker (conditional for list compatibility)
      // - className (converted from class)
      // - initial signal value (0)
      expect(file.markedJsx).toContain('data-bf-scope": "Counter"')
      expect(file.markedJsx).toContain('className="counter"')
      expect(file.markedJsx).toContain('{0}')

      // Client JS should contain:
      // - createSignal call
      // - event handler
      expect(file.clientJs).toContain('createSignal(0)')
      expect(file.clientJs).toContain('setCount')
      expect(file.hasClientJs).toBe(true)
      expect(file.hasUseClientDirective).toBe(true)
    })

    it('compiles a static component without client JS', async () => {
      const source = `
        "use client"
        function Header() {
          return (
            <header class="main-header">
              <h1>Welcome</h1>
            </header>
          )
        }
      `

      const result = await compile(source)
      expect(result.files.length).toBe(1)

      const file = result.files[0]

      expect(file.markedJsx).toContain('data-bf-scope": "Header"')
      expect(file.markedJsx).toContain('<h1>Welcome</h1>')
      // Static component with "use client" but no dynamic content has no client JS
      expect(file.hasClientJs).toBe(false)
    })
  })

  describe('conditional rendering', () => {
    it('compiles component with ternary conditional', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        function Toggle() {
          const [isOn, setIsOn] = createSignal(false)
          return (
            <div>
              {isOn() ? <span class="on">ON</span> : <span class="off">OFF</span>}
              <button onClick={() => setIsOn(v => !v)}>Toggle</button>
            </div>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Server JSX should have conditional with data-bf-cond marker
      expect(file.markedJsx).toContain('data-bf-cond')
      expect(file.markedJsx).toContain('false ?')
      expect(file.markedJsx).toContain('className="on"')
      expect(file.markedJsx).toContain('className="off"')

      // Client JS should handle conditional updates
      expect(file.clientJs).toContain('isOn')
    })

    it('compiles component with logical AND conditional', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        function Greeting() {
          const [show, setShow] = createSignal(true)
          return (
            <div>
              {show() && <p>Hello, World!</p>}
              <button onClick={() => setShow(v => !v)}>Toggle</button>
            </div>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      expect(file.markedJsx).toContain('Hello, World!')
      expect(file.clientJs).toContain('show')
    })
  })

  describe('list rendering', () => {
    it('compiles component with map expression', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        type Todo = { id: number; text: string }

        function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
          const [todos, setTodos] = createSignal(initialTodos)
          return (
            <ul class="todo-list">
              {todos().map(todo => (
                <li key={todo.id}>{todo.text}</li>
              ))}
            </ul>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Server JSX should have map expression
      expect(file.markedJsx).toContain('initialTodos?.map')
      expect(file.markedJsx).toContain('data-key={todo.id}')
      expect(file.markedJsx).toContain('{todo.text}')

      // Client JS should handle list updates
      expect(file.clientJs).toContain('todos')
    })

    it('compiles component with list and event handlers', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        type Item = { id: number; text: string }

        function ItemList({ initialItems }: { initialItems: Item[] }) {
          const [items, setItems] = createSignal(initialItems)
          const remove = (id: number) => setItems(items().filter(i => i.id !== id))
          return (
            <ul>
              {items().map(item => (
                <li key={item.id}>
                  {item.text}
                  <button onClick={() => remove(item.id)}>X</button>
                </li>
              ))}
            </ul>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Server JSX should have map expression (signals replaced with initial values)
      expect(file.markedJsx).toContain('initialItems?.map')
      expect(file.markedJsx).toContain('data-key={item.id}')

      // Client JS should have remove function
      expect(file.clientJs).toContain('remove')
    })
  })

  describe('nested components', () => {
    it('compiles parent and child components', async () => {
      const result = await compileWithFiles('/test/App.tsx', {
        '/test/App.tsx': `
          "use client"
          import Counter from './Counter'

          function App() {
            return (
              <div class="app">
                <h1>My App</h1>
                <Counter />
              </div>
            )
          }
        `,
        '/test/Counter.tsx': `
          "use client"
          import { createSignal } from 'barefoot'

          function Counter() {
            const [count, setCount] = createSignal(0)
            return (
              <div class="counter">
                <span>{count()}</span>
                <button onClick={() => setCount(n => n + 1)}>+</button>
              </div>
            )
          }

          export default Counter
        `,
      })

      // Should have two output files (both have "use client")
      expect(result.files.length).toBe(2)

      // Find App file
      const appFile = result.files.find(f => f.componentNames.includes('App'))
      expect(appFile).toBeDefined()
      expect(appFile!.markedJsx).toContain('<Counter')

      // Find Counter file
      const counterFile = result.files.find(f => f.componentNames.includes('Counter'))
      expect(counterFile).toBeDefined()
      expect(counterFile!.clientJs).toContain('createSignal')
    })

    it('server component using client component only outputs client component', async () => {
      const result = await compileWithFiles('/test/App.tsx', {
        '/test/App.tsx': `
          import Counter from './Counter'

          function App() {
            return (
              <div class="app">
                <h1>My App</h1>
                <Counter />
              </div>
            )
          }
        `,
        '/test/Counter.tsx': `
          "use client"
          import { createSignal } from 'barefoot'

          function Counter() {
            const [count, setCount] = createSignal(0)
            return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
          }

          export default Counter
        `,
      })

      // Only Counter has "use client", so only Counter is in output
      expect(result.files.length).toBe(1)

      const counterFile = result.files[0]
      expect(counterFile.componentNames).toContain('Counter')
      expect(counterFile.clientJs).toContain('createSignal')
    })
  })

  describe('edge cases', () => {
    it('compiles component with ref', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        function InputForm() {
          let inputRef: HTMLInputElement | null = null
          const [value, setValue] = createSignal('')

          return (
            <form>
              <input ref={(el) => inputRef = el} value={value()} />
              <button onClick={() => console.log(inputRef?.value)}>Log</button>
            </form>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Client JS should have ref handling
      expect(file.clientJs).toContain('inputRef')
    })

    it('compiles component with memo', async () => {
      const source = `
        "use client"
        import { createSignal, createMemo } from 'barefoot'

        function Doubler() {
          const [count, setCount] = createSignal(5)
          const doubled = createMemo(() => count() * 2)
          return (
            <div>
              <span>{doubled()}</span>
              <button onClick={() => setCount(n => n + 1)}>+</button>
            </div>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Server JSX should show computed initial value
      expect(file.markedJsx).toContain('(5 * 2)')

      // Client JS should have memo
      expect(file.clientJs).toContain('createMemo')
      expect(file.clientJs).toContain('doubled')
    })

    it('compiles component with spread attributes', async () => {
      const source = `
        "use client"
        function Wrapper({ className, ...rest }: { className: string; [key: string]: any }) {
          return <div class={className} {...rest}>Content</div>
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      expect(file.markedJsx).toContain('{...rest}')
    })

    it('compiles component with multiple exports', async () => {
      const source = `
        "use client"
        export function Header() {
          return <header>Header</header>
        }

        export function Footer() {
          return <footer>Footer</footer>
        }
      `

      const result = await compile(source)
      expect(result.files.length).toBe(1)

      const file = result.files[0]
      // Both components should be in componentNames
      expect(file.componentNames).toContain('Header')
      expect(file.componentNames).toContain('Footer')
      // The file structure should track both components
      expect(file.componentNames.length).toBe(2)
    })
  })

  describe('props handling', () => {
    it('compiles component with typed props', async () => {
      const source = `
        "use client"
        type ButtonProps = {
          label: string
          disabled?: boolean
        }

        function Button({ label, disabled = false }: ButtonProps) {
          return <button disabled={disabled}>{label}</button>
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Boolean attributes are converted to conditional: (value) ? true : undefined
      expect(file.markedJsx).toContain('disabled={(disabled) ? true : undefined}')
      expect(file.markedJsx).toContain('{label}')

      // Check componentProps
      expect(file.componentProps['Button']).toBeDefined()
    })

    it('compiles component with callback props', async () => {
      const source = `
        "use client"
        import { createSignal } from 'barefoot'

        type ToggleProps = {
          checked: boolean
          onToggle: () => void
        }

        function Toggle({ checked, onToggle }: ToggleProps) {
          return (
            <button onClick={onToggle}>
              {checked ? 'ON' : 'OFF'}
            </button>
          )
        }
      `

      const result = await compile(source)
      const file = result.files[0]

      // Client JS should reference onToggle (event handlers are handled client-side)
      expect(file.clientJs).toContain('onToggle')
      // Server JSX should have the conditional expression
      expect(file.markedJsx).toContain("checked ? 'ON' : 'OFF'")
    })
  })

  describe('server-only components', () => {
    it('files without directive are not included in output', async () => {
      const source = `
        function Counter() {
          return <div>Static content</div>
        }
      `

      const result = await compile(source)

      // No "use client" directive means no output
      expect(result.files.length).toBe(0)
    })

    it('only files with directive are included in output', async () => {
      const result = await compileWithFiles('/test/App.tsx', {
        '/test/App.tsx': `
          import Counter from './Counter'
          import Header from './Header'

          function App() {
            return (
              <div>
                <Header />
                <Counter />
              </div>
            )
          }
        `,
        '/test/Counter.tsx': `
          "use client"
          import { createSignal } from 'barefoot'

          function Counter() {
            const [count, setCount] = createSignal(0)
            return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
          }

          export default Counter
        `,
        '/test/Header.tsx': `
          function Header() {
            return <h1>Welcome</h1>
          }

          export default Header
        `,
      })

      // Only Counter has "use client", so only Counter is in output
      expect(result.files.length).toBe(1)

      const counterFile = result.files[0]
      expect(counterFile.componentNames).toContain('Counter')
      expect(counterFile.hasClientJs).toBe(true)
      expect(counterFile.hasUseClientDirective).toBe(true)

      // App and Header are NOT in output (no "use client")
      expect(result.files.find(f => f.componentNames.includes('App'))).toBeUndefined()
      expect(result.files.find(f => f.componentNames.includes('Header'))).toBeUndefined()
    })
  })
})
