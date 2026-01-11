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
        "use client"
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
        "use client"
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
    const counterFile = result.files.find(f => f.componentNames.includes('Counter'))
    expect(counterFile).toBeDefined()
    expect(counterFile!.clientJs).toContain('const [count, setCount] = createSignal(0)')
  })

  it('Component with props', async () => {
    const files = {
      '/test/App.tsx': `
        "use client"
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
        "use client"
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
    const counterFile = result.files.find(f => f.componentNames.includes('Counter'))
    expect(counterFile).toBeDefined()
    // Props are stored in componentProps keyed by component name
    expect(counterFile!.componentProps['Counter'].map(p => p.name)).toContain('initial')
  })

  it('Component with children and clientJs', async () => {
    const files = {
      '/test/App.tsx': `
        "use client"
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
        "use client"
        import { createSignal } from 'barefoot'
        function Button({ children }) {
          const [clicked, setClicked] = createSignal(false)
          return <button class="btn" onClick={() => setClicked(true)}>{children}</button>
        }
      `,
    }

    const result = await compileWithFiles('/test/App.tsx', files)

    // Button component takes children and has clientJs
    const buttonFile = result.files.find(f => f.componentNames.includes('Button'))
    expect(buttonFile).toBeDefined()
    // Children prop is handled
    expect(buttonFile!.componentProps['Button'].map(p => p.name)).toContain('children')
  })
})

describe('Components - Props and init function', () => {
  it('Components with props are wrapped in init function', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
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
        "use client"
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
    const formFile = result.files.find(f => f.componentNames.includes('Form'))

    // Wrapped in init function (with __instanceIndex and __parentScope for multiple instance and scoping support)
    expect(formFile!.clientJs).toContain('export function initForm({ onAdd }, __instanceIndex = 0, __parentScope = null)')
    // Signal declaration is inside function
    expect(formFile!.clientJs).toContain("const [text, setText] = createSignal('')")
    // Local function is also inside function
    expect(formFile!.clientJs).toContain('const handleSubmit = () =>')
    // onAdd can be used
    expect(formFile!.clientJs).toContain('onAdd(text().trim())')
  })

  it('Components without props are not wrapped', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <button onClick={() => setCount(count() + 1)}>{count()}</button>
      }
    `
    const result = await compile(source)
    const file = result.files[0]

    // Not wrapped in init function
    expect(file.clientJs).not.toContain('export function init')
    // Signal declaration is at top level
    expect(file.clientJs).toContain('const [count, setCount] = createSignal(0)')
  })

  it('Parent component calls child init function', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
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
              <ul>{items().map(item => <li key={item.id}>{item.text}</li>)}</ul>
            </div>
          )
        }
      `,
      '/test/Form.tsx': `
        "use client"
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
    const appFile = result.files.find(f => f.componentNames.includes('App'))

    // Child component import exists (with hash)
    expect(appFile!.clientJs).toMatch(/import { initForm } from '\.\/Form-[a-f0-9]+\.js'/)
    // init call exists with instance index and scope (callback is passed as is because createEffect automatically tracks)
    expect(appFile!.clientJs).toContain('initForm({ onAdd: handleAdd }, 0, __scope)')
  })
})

describe('Components - Callback props', () => {
  it('When there is dynamic content, callback props are passed as is (automatically tracked by createEffect)', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        "use client"
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
        "use client"
        type Props = { onClick: () => void }
        function Child({ onClick }: Props) {
          return <button onClick={() => onClick()}>Click</button>
        }
        export default Child
      `,
    }
    const result = await compileWithFiles('/test/Parent.tsx', files)
    const parent = result.files.find(f => f.componentNames.includes('Parent'))

    // Callback is passed as is with instance index and scope (due to automatic tracking by createEffect)
    expect(parent!.clientJs).toContain('initChild({ onClick: handleClick }, 0, __scope)')
  })

  it('Even without dynamic content, callback props are passed as is', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        "use client"
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
        "use client"
        type Props = { onClick: () => void }
        function Child({ onClick }: Props) {
          return <button onClick={() => onClick()}>Click</button>
        }
        export default Child
      `,
    }
    const result = await compileWithFiles('/test/Parent.tsx', files)
    const parent = result.files.find(f => f.componentNames.includes('Parent'))

    // Callback is not wrapped
    expect(parent!.clientJs).toContain('onClick: handleClick')
    expect(parent!.clientJs).not.toContain('updateAll')
  })
})

describe('Components - Module constants in child props', () => {
  it('includes module constants used in child component props', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Example from './Example'

        const variantCode = \`<Button>Default</Button>\`
        const sizeCode = \`<Button size="sm">Small</Button>\`

        function Parent() {
          const [count, setCount] = createSignal(0)
          return (
            <div>
              <span>{count()}</span>
              <Example title="Variants" code={variantCode} />
              <Example title="Sizes" code={sizeCode} />
            </div>
          )
        }
        export default Parent
      `,
      '/test/Example.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        type Props = { title: string; code: string }
        function Example({ title, code }: Props) {
          const [expanded, setExpanded] = createSignal(false)
          return (
            <div>
              <h3>{title}</h3>
              <button onClick={() => setExpanded(!expanded())}>Toggle</button>
              <pre>{code}</pre>
            </div>
          )
        }
        export default Example
      `,
    }
    const result = await compileWithFiles('/test/Parent.tsx', files)
    const parent = result.files.find(f => f.componentNames.includes('Parent'))

    // Module constants should be included in client JS
    expect(parent!.clientJs).toContain('const variantCode = `<Button>Default</Button>`')
    expect(parent!.clientJs).toContain('const sizeCode = `<Button size="sm">Small</Button>`')
    // Child init calls should reference the constants
    expect(parent!.clientJs).toContain('code: variantCode')
    expect(parent!.clientJs).toContain('code: sizeCode')
  })

  it('does not include unused module constants', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Example from './Example'

        const usedCode = \`used\`
        const unusedCode = \`unused\`

        function Parent() {
          const [count, setCount] = createSignal(0)
          return (
            <div>
              <span>{count()}</span>
              <Example code={usedCode} />
            </div>
          )
        }
        export default Parent
      `,
      '/test/Example.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        type Props = { code: string }
        function Example({ code }: Props) {
          const [show, setShow] = createSignal(true)
          return (
            <div>
              <button onClick={() => setShow(!show())}>Toggle</button>
              <pre>{code}</pre>
            </div>
          )
        }
        export default Example
      `,
    }
    const result = await compileWithFiles('/test/Parent.tsx', files)
    const parent = result.files.find(f => f.componentNames.includes('Parent'))

    // Only used constants should be included
    expect(parent!.clientJs).toContain('const usedCode = `used`')
    expect(parent!.clientJs).not.toContain('unusedCode')
  })
})

describe('Components - Hash and filename', () => {
  it('ComponentOutput includes hash and filename for components with clientJs', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        "use client"
        import Counter from './Counter'
        function App() {
          return <div><Counter /></div>
        }
        export default App
      `,
      '/test/Counter.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        function Counter() {
          const [count, setCount] = createSignal(0)
          return <button onClick={() => setCount(count() + 1)}>{count()}</button>
        }
        export default Counter
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)

    // Files with clientJs have hash and clientJsFilename
    for (const f of result.files) {
      expect(f.hash).toMatch(/^[a-f0-9]{8}$/)
      if (f.hasClientJs) {
        expect(f.clientJsFilename).toMatch(new RegExp(`(${f.componentNames.join('|')})-${f.hash}\\.js`))
      } else {
        expect(f.clientJsFilename).toBe('')
      }
    }

    // Counter file has clientJs
    const counter = result.files.find(f => f.componentNames.includes('Counter'))
    expect(counter).toBeDefined()
    expect(counter!.hasClientJs).toBe(true)
    expect(counter!.hash).toBeTruthy()
    expect(counter!.clientJsFilename).toContain(counter!.hash)

    // All files with JSX return are included
    // App file has serverJsx AND clientJs (because it calls initCounter for child component)
    const app = result.files.find(f => f.componentNames.includes('App'))
    expect(app).toBeDefined()
    expect(app!.hasClientJs).toBe(true)  // App needs clientJs to initialize child Counter
    expect(app!.clientJsFilename).toContain(app!.hash)
    expect(app!.markedJsx).toContain('<Counter />')
  })
})

describe('Components - Auto-hydration', () => {
  it('Client JS includes auto-hydration code for components with props', async () => {
    const files: Record<string, string> = {
      '/test/Counter.tsx': `
        "use client"
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
    const counter = result.files.find(f => f.componentNames.includes('Counter'))

    // Client JS should include auto-hydration code using hydrate() helper
    expect(counter!.clientJs).toContain("hydrate('Counter', initCounter)")
  })

  it('Components without props do not have auto-hydration code', async () => {
    const source = `
      "use client"
      import { createSignal } from 'barefoot'
      function Counter() {
        const [count, setCount] = createSignal(0)
        return <button onClick={() => setCount(count() + 1)}>{count()}</button>
      }
    `
    const result = await compile(source)
    const counter = result.files[0]

    // No auto-hydration code for components without props
    expect(counter.clientJs).not.toContain('Auto-hydration')
    expect(counter.clientJs).not.toContain('data-bf-props')
  })

})

describe('Components - Lazy Children', () => {
  it('passes children as function when they contain reactive expressions', async () => {
    const files = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Button from './Button'
        function App() {
          const [count, setCount] = createSignal(0)
          return <Button onClick={() => setCount(n => n + 1)}>Count: {count()}</Button>
        }
      `,
      '/test/Button.tsx': `
        "use client"
        function Button({ onClick, children }) {
          return <button onClick={onClick}>{children}</button>
        }
        export default Button
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // App's client JS should pass children as a function
    expect(app!.clientJs).toContain('children: () =>')
    expect(app!.clientJs).toContain('initButton')
  })

  it('child component handles lazy children with function check', async () => {
    const files = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from 'barefoot'
        import Button from './Button'
        function App() {
          const [count, setCount] = createSignal(0)
          return <Button onClick={() => setCount(n => n + 1)}>Count: {count()}</Button>
        }
      `,
      '/test/Button.tsx': `
        "use client"
        function Button({ onClick, children }) {
          return <button onClick={onClick}>{children}</button>
        }
        export default Button
      `,
    }
    const result = await compileWithFiles('/test/Button.tsx', files)
    const button = result.files.find(f => f.componentNames.includes('Button'))

    // Button's server JSX should handle children as function
    expect(button!.markedJsx).toContain("typeof children === 'function' ? children() : children")
    // Button's client JS should have effect for children
    expect(button!.clientJs).toContain('createEffect')
    expect(button!.clientJs).toContain('__childrenResult')
  })

  it('static children are not wrapped in function', async () => {
    const files = {
      '/test/App.tsx': `
        "use client"
        import Button from './Button'
        function App() {
          return <Button>Click me</Button>
        }
      `,
      '/test/Button.tsx': `
        "use client"
        function Button({ children }) {
          return <button>{children}</button>
        }
        export default Button
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // App's server JSX should inline children (not pass as function)
    expect(app!.markedJsx).toContain('>Click me<')
    expect(app!.markedJsx).not.toContain('children={() =>')
  })
})

describe('Components - Reactive Children (No Warning)', () => {
  it('does not warn when lazy children pattern is applied', async () => {
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (msg: string) => warnings.push(msg)

    try {
      const files = {
        '/test/App.tsx': `
        "use client"
          import { createSignal } from 'barefoot'
          import Button from './Button'
          function App() {
            const [count, setCount] = createSignal(0)
            return <Button onClick={() => setCount(n => n + 1)}>Count: {count()}</Button>
          }
        `,
        '/test/Button.tsx': `
        "use client"
          function Button({ onClick, children }) {
            return <button onClick={onClick}>{children}</button>
          }
          export default Button
        `,
      }
      await compileWithFiles('/test/App.tsx', files)

      // No warning - lazy children pattern is now automatically applied
      const reactiveWarnings = warnings.filter(w => w.includes('reactive expressions'))
      expect(reactiveWarnings.length).toBe(0)
    } finally {
      console.warn = originalWarn
    }
  })

  it('static children still work as expected', async () => {
    const files = {
      '/test/App.tsx': `
        "use client"
        import Button from './Button'
        function App() {
          return <Button>Click me</Button>
        }
      `,
      '/test/Button.tsx': `
        "use client"
        function Button({ children }) {
          return <button>{children}</button>
        }
        export default Button
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // Static children are inlined (not passed as function)
    expect(app!.markedJsx).toContain('>Click me<')
    expect(app!.markedJsx).not.toContain('children(() =>')
  })
})

// Issue #160: __findInScope not generated for elements inside component children
describe('Components - Issue #160 Regression', () => {
  it('generates __findInScope for dynamic elements inside component children', async () => {
    // This test reproduces the bug where elements inside component children
    // are collected to dynamicAttributes but not added to elementPaths,
    // causing __findInScope to not be generated.
    //
    // The element with dynamic class (signal-based) is inside a component's children,
    // so calculateElementPaths won't add it to elementPaths (component children are skipped),
    // but collectClientJsInfo will add it to dynamicAttributes.
    const files = {
      '/test/App.tsx': `
        "use client"
        import { createSignal } from '@barefootjs/dom'
        import { Wrapper } from './Wrapper'

        export function App() {
          const [active, setActive] = createSignal(false)

          return (
            <Wrapper>
              <div>
                <span class={active() ? 'active' : 'inactive'}>Status</span>
                <button onClick={() => setActive(!active())}>Toggle</button>
              </div>
            </Wrapper>
          )
        }
      `,
      '/test/Wrapper.tsx': `
        "use client"
        import type { Child } from '@barefootjs/jsx'

        interface WrapperProps {
          children?: Child
        }

        export function Wrapper({ children }: WrapperProps) {
          return <div class="wrapper">{children}</div>
        }
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const app = result.files.find(f => f.componentNames.includes('App'))

    // find(__scope, ...) must be generated since the element is inside component children
    // and its path cannot be calculated by calculateElementPaths.
    // Before the fix, elementPaths.values() was checked but the element wasn't in the map,
    // so needsScopedFinder was false even though find() was used in getElementAccessCode.
    expect(app!.clientJs).toContain('find(__scope,')
  })
})
