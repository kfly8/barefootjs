/**
 * コンポーネントのテスト
 *
 * ## 概要
 * 複数コンポーネントの構成、props、children、
 * サーバーコンポーネント出力を検証する。
 *
 * ## 対応パターン
 * - propsなしのコンポーネント: `<Counter />`
 * - propsありのコンポーネント: `<Counter initial={5} />`
 * - childrenを持つコンポーネント: `<Button>Click me</Button>`
 * - コールバックprops: `<Form onAdd={handleAdd} />`
 *
 * ## 生成されるコード
 * ```typescript
 * // propsありの場合（clientJs）
 * export function initForm({ onAdd }) {
 *   const [text, setText] = signal('')
 *   // ...
 * }
 *
 * // 親コンポーネントでの呼び出し
 * import { initForm } from './Form-abc123.js'
 * initForm({ onAdd: (...args) => { handleAdd(...args); updateAll() } })
 * ```
 *
 * ## 注意事項
 * - コンポーネント名はPascalCase
 * - propsを持つコンポーネントは `init{Name}` 関数でラップ
 * - コールバックpropsは親の動的コンテンツがある場合 `updateAll()` でラップ
 */

import { describe, it, expect } from 'bun:test'
import { compile, compileWithFiles } from './test-helpers'

describe('コンポーネント - 基本', () => {
  it('propsなしのコンポーネント', async () => {
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
        import { signal } from 'barefoot'
        function Counter() {
          const [count, setCount] = signal(0)
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

    // AppコンポーネントのHTMLにCounterのHTMLが埋め込まれる
    expect(result.html).toContain('<h1>My App</h1>')
    expect(result.html).toContain('<p')
    expect(result.html).toContain('<button')

    // Counterコンポーネントが出力される
    const counterComponent = result.components.find(c => c.name === 'Counter')
    expect(counterComponent).toBeDefined()
    expect(counterComponent!.clientJs).toContain('const [count, setCount] = signal(0)')
  })

  it('propsありのコンポーネント', async () => {
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
        import { signal } from 'barefoot'
        function Counter({ initial }) {
          const [count, setCount] = signal(initial)
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

    // Counterコンポーネントがpropsを受け取る形式になる
    const counterComponent = result.components.find(c => c.name === 'Counter')
    expect(counterComponent).toBeDefined()
    expect(counterComponent!.serverComponent).toContain('function Counter({ initial })')
  })

  it('childrenを持つコンポーネント', async () => {
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
        function Button({ children }) {
          return <button class="btn">{children}</button>
        }
      `,
    }

    const result = await compileWithFiles('/test/App.tsx', files)

    // Buttonコンポーネントがchildrenを受け取る形式になる
    const buttonComponent = result.components.find(c => c.name === 'Button')
    expect(buttonComponent).toBeDefined()
    expect(buttonComponent!.serverComponent).toContain('function Button({ children })')
  })
})

describe('コンポーネント - propsとinit関数', () => {
  it('propsを持つコンポーネントはinit関数でラップされる', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { signal } from 'barefoot'
        import Form from './Form'
        function App() {
          const [items, setItems] = signal([])
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
        import { signal } from 'barefoot'
        type Props = { onAdd: (text: string) => void }
        function Form({ onAdd }: Props) {
          const [text, setText] = signal('')
          const handleSubmit = () => {
            if (text().trim()) {
              onAdd(text().trim())
              setText('')
            }
          }
          return (
            <div>
              <input value={text()} onInput={(e) => setText(e.target.value)} />
              <button onClick={() => handleSubmit()}>追加</button>
            </div>
          )
        }
        export default Form
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const formComponent = result.components.find(c => c.name === 'Form')

    // init関数でラップされている
    expect(formComponent!.clientJs).toContain('export function initForm({ onAdd })')
    // signal宣言が関数内にある
    expect(formComponent!.clientJs).toContain("const [text, setText] = signal('')")
    // ローカル関数も関数内にある
    expect(formComponent!.clientJs).toContain('const handleSubmit = () =>')
    // onAddが使える
    expect(formComponent!.clientJs).toContain('onAdd(text().trim())')
  })

  it('propsがないコンポーネントはラップされない', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <button onClick={() => setCount(count() + 1)}>{count()}</button>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // init関数でラップされていない
    expect(component.clientJs).not.toContain('export function init')
    // トップレベルにsignal宣言がある
    expect(component.clientJs).toContain('const [count, setCount] = signal(0)')
  })

  it('親コンポーネントが子のinit関数を呼び出す', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { signal } from 'barefoot'
        import Form from './Form'
        function App() {
          const [items, setItems] = signal([])
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
        import { signal } from 'barefoot'
        type Props = { onAdd: (text: string) => void }
        function Form({ onAdd }: Props) {
          const [text, setText] = signal('')
          return (
            <div>
              <input value={text()} onInput={(e) => setText(e.target.value)} />
              <button onClick={() => onAdd(text())}>追加</button>
            </div>
          )
        }
        export default Form
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appComponent = result.components.find(c => c.name === 'App')

    // 子コンポーネントのimportがある（ハッシュ付き）
    expect(appComponent!.clientJs).toMatch(/import { initForm } from '\.\/Form-[a-f0-9]+\.js'/)
    // init呼び出しがある（コールバックpropsはupdateAll()でラップされる）
    expect(appComponent!.clientJs).toContain('initForm({ onAdd: (...args) => { handleAdd(...args); updateAll() }}')
  })
})

describe('コンポーネント - コールバックpropsのラップ', () => {
  it('動的コンテンツがある場合、コールバックpropsがupdateAll()でラップされる', async () => {
    const files: Record<string, string> = {
      '/test/Parent.tsx': `
        import { signal } from 'barefoot'
        import Child from './Child'
        function Parent() {
          const [count, setCount] = signal(0)
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

    // コールバックがupdateAll()でラップされている
    expect(parent!.clientJs).toContain('onClick: (...args) => { handleClick(...args); updateAll() }')
  })

  it('動的コンテンツがない場合、コールバックpropsはラップされない', async () => {
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

    // コールバックはラップされていない
    expect(parent!.clientJs).toContain('onClick: handleClick')
    expect(parent!.clientJs).not.toContain('updateAll')
  })
})

describe('コンポーネント - ハッシュとファイル名', () => {
  it('ComponentOutputにhashとfilenameが含まれる', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import Counter from './Counter'
        function App() {
          return <div><Counter /></div>
        }
        export default App
      `,
      '/test/Counter.tsx': `
        import { signal } from 'barefoot'
        function Counter() {
          const [count, setCount] = signal(0)
          return <button onClick={() => setCount(count() + 1)}>{count()}</button>
        }
        export default Counter
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)

    // 各コンポーネントにhashとfilenameがある
    for (const c of result.components) {
      expect(c.hash).toMatch(/^[a-f0-9]{8}$/)
      expect(c.filename).toBe(`${c.name}-${c.hash}.js`)
    }

    // Counterコンポーネントの確認
    const counter = result.components.find(c => c.name === 'Counter')
    expect(counter).toBeDefined()
    expect(counter!.hash).toBeTruthy()
    expect(counter!.filename).toContain(counter!.hash)
  })
})

describe('コンポーネント - サーバー出力', () => {
  it('useRequestContextによるコンポーネント登録', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.serverComponent).toContain("import { useRequestContext } from 'hono/jsx-renderer'")
    expect(component.serverComponent).toContain("c.set('usedComponents'")
  })
})
