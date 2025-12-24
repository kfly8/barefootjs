/**
 * Component tests
 *
 * ## Overview
 * Verify component composition, props, children, and
 * server component output.
 *
 * ## Supported patterns
 * - Components without props: `<Counter />`
 * - Components with props: `<Counter initial={5} />`
 * - Components with children: `<Button>Click me</Button>`
 * - Callback props: `<Form onAdd={handleAdd} />`
 *
 * ## Generated code
 * ```typescript
 * // With props (clientJs)
 * export function initForm({ onAdd }) {
 *   const [text, setText] = createSignal('')
 *   // ...
 * }
 *
 * // Call in parent component
 * import { initForm } from './Form-abc123.js'
 * initForm({ onAdd: (...args) => { handleAdd(...args); updateAll() } })
 * ```
 *
 * ## Notes
 * - Component names must be PascalCase
 * - Components with props are wrapped in `init{Name}` function
 * - Callback props are wrapped with `updateAll()` when parent has dynamic content
 */

import { describe, it, expect } from 'bun:test'
import { compile, compileWithFiles } from './test-helpers'

describe('Components - Basics', () => {
  it('Component without props', async () => {
    const files = {
      '/test/App.tsx': `
        import Counter from './Counter'
        function App() {
          return (
            <div>
              <h1>My App</h1>
              <Counter />
            </div>
          )
        }
      `,
      '/test/Counter.tsx': `
        import { createSignal } from 'barefoot'
        function Counter() {
          const [count, setCount] = createSignal(0)
          return (
            <div>
              <p>{count()}</p>
              <button onClick={() => setCount(n => n + 1)}>+1</button>
            </div>
          )
        }
      `,
    }

    const result = await compileWithFiles('/test/App.tsx', files)

    // Counter component is output
    const counterComponent = result.components.find(c => c.name === 'Counter')
    expect(counterComponent).toBeDefined()
    expect(counterComponent!.clientJs).toContain('const [count, setCount] = createSignal(0)')
  })

  it('Component with props', async () => {
    const files = {
      '/test/App.tsx': `
        import Counter from './Counter'
        function App() {
          return (
            <div>
              <Counter initial={5} />
            </div>
          )
        }
      `,
      '/test/Counter.tsx': `
        import { createSignal } from 'barefoot'
        function Counter({ initial }) {
          const [count, setCount] = createSignal(initial)
          return (
            <div>
              <p>{count()}</p>
              <button onClick={() => setCount(n => n + 1)}>+1</button>
            </div>
          )
        }
      `,
    }

    const result = await compileWithFiles('/test/App.tsx', files)

    // Counter component takes props
    const counterComponent = result.components.find(c => c.name === 'Counter')
    expect(counterComponent).toBeDefined()
    // Props are stored in component output
    expect(counterComponent!.props.map(p => p.name)).toContain('initial')
  })

  it('Component with children and clientJs', async () => {
    const files = {
      '/test/App.tsx': `
        import Button from './Button'
        function App() {
          return (
            <div>
              <Button>Click me</Button>
            </div>
          )
        }
      `,
      '/test/Button.tsx': `
        import { createSignal } from 'barefoot'
        function Button({ children }) {
          const [clicked, setClicked] = createSignal(false)
          return <button class="btn" onClick={() => setClicked(true)}>{children}</button>
        }
      `,
    }

    const result = await compileWithFiles('/test/App.tsx', files)

    // Button component takes children and has clientJs
    const buttonComponent = result.components.find(c => c.name === 'Button')
    expect(buttonComponent).toBeDefined()
    // Children prop is handled
    expect(buttonComponent!.props.map(p => p.name)).toContain('children')
  })
})

describe('Components - Props and init function', () => {
  it('Components with props are wrapped in init function', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Form from './Form'
        function App() {
          const [items, setItems] = createSignal([])
          const handleAdd = (text) => {
            setItems([...items(), { id: Date.now(), text }])
          }
          return (
            <div>
              <Form onAdd={handleAdd} />
            </div>
          )
        }
      `,
      '/test/Form.tsx': `
        import { createSignal } from 'barefoot'
        type Props = { onAdd: (text: string) => void }
        function Form({ onAdd }: Props) {
          const [text, setText] = createSignal('')
          const handleSubmit = () => {
            if (text().trim()) {
              onAdd(text().trim())
              setText('')
            }
          }
          return (
            <div>
              <input value={text()} onInput={(e) => setText(e.target.value)} />
              <button onClick={() => handleSubmit()}>Add</button>
            </div>
          )
        }
        export default Form
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const formComponent = result.components.find(c => c.name === 'Form')

    // Wrapped in init function
    expect(formComponent!.clientJs).toContain('export function initForm({ onAdd })')
    // Signal declaration is inside function
    expect(formComponent!.clientJs).toContain("const [text, setText] = createSignal('')")
    // Local function is also inside function
    expect(formComponent!.clientJs).toContain('const handleSubmit = () =>')
    // onAdd can be used
    expect(formComponent!.clientJs).toContain('onAdd(text().trim())')
  })

  it('Components without props are not wrapped', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <button onClick={() => setCount(count() + 1)}>{count()}</button>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // Not wrapped in init function
    expect(component.clientJs).not.toContain('export function init')
    // Signal declaration is at top level
    expect(component.clientJs).toContain('const [count, setCount] = createSignal(0)')
  })

  it('Parent component calls child init function', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Form from './Form'
        function App() {
          const [items, setItems] = createSignal([])
          const handleAdd = (text) => {
            setItems([...items(), { id: Date.now(), text }])
          }
          return (
            <div>
              <Form onAdd={handleAdd} />
              <ul>{items().map(item => <li>{item.text}</li>)}</ul>
            </div>
          )
        }
      `,
      '/test/Form.tsx': `
        import { createSignal } from 'barefoot'
        type Props = { onAdd: (text: string) => void }
        function Form({ onAdd }: Props) {
          const [text, setText] = createSignal('')
          return (
            <div>
              <input value={text()} onInput={(e) => setText(e.target.value)} />
              <button onClick={() => onAdd(text())}>Add</button>
            </div>
          )
        }
        export default Form
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appComponent = result.components.find(c => c.name === 'App')

    // Child component import exists (with hash)
    expect(appComponent!.clientJs).toMatch(/import { initForm } from '\.\/Form-[a-f0-9]+\.js'/)
    // init call exists (callback is passed as is because createEffect automatically tracks)
    expect(appComponent!.clientJs).toContain('initForm({ onAdd: handleAdd })')
  })
})

describe('Components - Callback props', () => {
  it('When there is dynamic content, callback props are passed as is (automatically tracked by createEffect)', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        import { createSignal } from 'barefoot'
        import Child from './Child'
        function Parent() {
          const [count, setCount] = createSignal(0)
          const handleClick = () => setCount(count() + 1)
          return (
            <div>
              <span>{count()}</span>
              <Child onClick={handleClick} />
            </div>
          )
        }
        export default Parent
      `,
      '/test/Child.tsx': `
        type Props = { onClick: () => void }
        function Child({ onClick }: Props) {
          return <button onClick={() => onClick()}>Click</button>
        }
        export default Child
      `,
    }
    const result = await compileWithFiles('/test/Parent.tsx', files)
    const parent = result.components.find(c => c.name === 'Parent')

    // Callback is passed as is (due to automatic tracking by createEffect)
    expect(parent!.clientJs).toContain('initChild({ onClick: handleClick })')
  })

  it('Even without dynamic content, callback props are passed as is', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        import Child from './Child'
        function Parent() {
          const handleClick = () => console.log('clicked')
          return (
            <div>
              <Child onClick={handleClick} />
            </div>
          )
        }
        export default Parent
      `,
      '/test/Child.tsx': `
        type Props = { onClick: () => void }
        function Child({ onClick }: Props) {
          return <button onClick={() => onClick()}>Click</button>
        }
        export default Child
      `,
    }
    const result = await compileWithFiles('/test/Parent.tsx', files)
    const parent = result.components.find(c => c.name === 'Parent')

    // Callback is not wrapped
    expect(parent!.clientJs).toContain('onClick: handleClick')
    expect(parent!.clientJs).not.toContain('updateAll')
  })
})

describe('Components - Hash and filename', () => {
  it('ComponentOutput includes hash and filename for components with clientJs', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import Counter from './Counter'
        function App() {
          return <div><Counter /></div>
        }
        export default App
      `,
      '/test/Counter.tsx': `
        import { createSignal } from 'barefoot'
        function Counter() {
          const [count, setCount] = createSignal(0)
          return <button onClick={() => setCount(count() + 1)}>{count()}</button>
        }
        export default Counter
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)

    // Components with clientJs have hash and filename
    for (const c of result.components) {
      expect(c.hash).toMatch(/^[a-f0-9]{8}$/)
      if (c.hasClientJs) {
        expect(c.filename).toBe(`${c.name}-${c.hash}.js`)
      } else {
        expect(c.filename).toBe('')
      }
    }

    // Counter component has clientJs
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
    expect(counter!.hasClientJs).toBe(true)
    expect(counter!.hash).toBeTruthy()
    expect(counter!.filename).toContain(counter!.hash)

    // All components with JSX return are included (even without clientJs)
    // App component has serverJsx but no clientJs
    const app = result.components.find(c => c.name === 'App')
    expect(app).toBeDefined()
    expect(app!.hasClientJs).toBe(false)
    expect(app!.filename).toBe('')
    expect(app!.serverJsx).toContain('<Counter />')
  })
})

describe('Components - Auto-hydration', () => {
  it('Client JS includes auto-hydration code for components with props', async () => {
    const files: Record<string, string> = {
      '/test/Counter.tsx': `
        import { createSignal } from 'barefoot'
        function Counter({ initial }) {
          const [count, setCount] = createSignal(initial)
          return (
            <div>
              <p>{count()}</p>
              <button onClick={() => setCount(n => n + 1)}>+1</button>
            </div>
          )
        }
        export default Counter
      `,
    }
    const result = await compileWithFiles('/test/Counter.tsx', files)
    const counter = result.components.find(c => c.name === 'Counter')

    // Client JS should include auto-hydration code
    expect(counter!.clientJs).toContain('// Auto-hydration')
    expect(counter!.clientJs).toContain('document.querySelector(\'script[data-bf-props="Counter"]\')')
    expect(counter!.clientJs).toContain('JSON.parse(__propsEl.textContent')
    expect(counter!.clientJs).toContain('initCounter(__props)')
  })

  it('Components without props do not have auto-hydration code', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return <button onClick={() => setCount(count() + 1)}>{count()}</button>
      }
    `
    const result = await compile(source)
    const counter = result.components[0]

    // No auto-hydration code for components without props
    expect(counter.clientJs).not.toContain('Auto-hydration')
    expect(counter.clientJs).not.toContain('data-bf-props')
  })

})
