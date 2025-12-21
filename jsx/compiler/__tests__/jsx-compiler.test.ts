/**
 * JSXコンパイラのパターンテスト
 *
 * このテストファイルは、コンパイラが対応しているパターンのドキュメントも兼ねる。
 * - describe: パターンのカテゴリ
 * - it: 具体的なパターンと期待される出力
 * - it.todo: 未対応のパターン（将来実装予定）
 */

import { describe, it, expect } from 'bun:test'
import { compileJSX } from '../jsx-compiler'

// テスト用のヘルパー: 仮想ファイルシステムからコンパイル
async function compile(source: string) {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  return compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  })
}

// =============================================================================
// signal宣言
// =============================================================================

describe('signal宣言', () => {
  /**
   * 数値のsignal
   * const [count, setCount] = signal(0)
   */
  it('数値のsignal', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // クライアントJSにsignal宣言が含まれる
    expect(component.clientJs).toContain('const [count, setCount] = signal(0)')
  })

  /**
   * 真偽値のsignal
   * const [on, setOn] = signal(false)
   */
  it('真偽値のsignal', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [on, setOn] = signal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [on, setOn] = signal(false)')
  })

  /**
   * 文字列のsignal
   * const [text, setText] = signal('hello')
   */
  it.todo('文字列のsignal')

  /**
   * 複数のsignal
   * const [count, setCount] = signal(0)
   * const [name, setName] = signal('')
   */
  it.todo('複数のsignal')

  /**
   * オブジェクトのsignal
   * const [user, setUser] = signal({ name: '', age: 0 })
   */
  it.todo('オブジェクトのsignal')

  /**
   * 配列のsignal
   * const [items, setItems] = signal([])
   */
  it.todo('配列のsignal')
})

// =============================================================================
// 動的コンテンツ
// =============================================================================

describe('動的コンテンツ', () => {
  /**
   * 関数呼び出し
   * <p>{count()}</p>
   *
   * → __d0.textContent = count()
   */
  it('関数呼び出し', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 動的要素にIDが付与される
    expect(component.serverComponent).toContain('id="__d0"')

    // updateAll関数で更新される
    expect(component.clientJs).toContain('__d0.textContent = count()')
  })

  /**
   * 二項演算
   * <p>{count() * 2}</p>
   *
   * → __d0.textContent = count() * 2
   */
  it('二項演算', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p>{count() * 2}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('__d0.textContent = count() * 2')
  })

  /**
   * 条件式（三項演算子）
   * <span>{on() ? 'ON' : 'OFF'}</span>
   *
   * → __d0.textContent = on() ? 'ON' : 'OFF'
   */
  it('条件式（三項演算子）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [on, setOn] = signal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain("__d0.textContent = on() ? 'ON' : 'OFF'")
  })

  /**
   * テキスト + 動的コンテンツ
   * <p>Count: {count()}</p>
   *
   * → __d0.textContent = "Count: " + count()
   */
  it('テキスト + 動的コンテンツ', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p>Count: {count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('__d0.textContent = "Count:" + count()')
  })

  /**
   * 初期値の正しい描画
   * signal(false) → 初期表示は "OFF" であるべき（現状は "0"）
   */
  it.todo('初期値の正しい描画')

  /**
   * 配列のmap
   * <ul>{items().map(item => <li>{item}</li>)}</ul>
   */
  it.todo('配列のmap')

  /**
   * 配列のfilter + map
   * <ul>{items().filter(x => x.done).map(item => <li>{item.text}</li>)}</ul>
   */
  it.todo('配列のfilter + map')
})

// =============================================================================
// イベントハンドラ
// =============================================================================

describe('イベントハンドラ', () => {
  /**
   * onClick
   * <button onClick={() => setCount(n => n + 1)}>+1</button>
   *
   * → __b0.onclick = () => { setCount(n => n + 1); updateAll() }
   */
  it('onClick', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // ボタンにIDが付与される
    expect(component.serverComponent).toContain('id="__b0"')

    // onclickハンドラが設定される
    expect(component.clientJs).toContain('__b0.onclick')
    expect(component.clientJs).toContain('setCount(n => n + 1)')

    // updateAllが呼ばれる
    expect(component.clientJs).toContain('updateAll()')
  })

  /**
   * 複数のonClick
   * <button onClick={() => setCount(n => n + 1)}>+1</button>
   * <button onClick={() => setCount(n => n - 1)}>-1</button>
   */
  it('複数のonClick', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return (
          <div>
            <p>{count()}</p>
            <button onClick={() => setCount(n => n + 1)}>+1</button>
            <button onClick={() => setCount(n => n - 1)}>-1</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.serverComponent).toContain('id="__b0"')
    expect(component.serverComponent).toContain('id="__b1"')
    expect(component.clientJs).toContain('__b0.onclick')
    expect(component.clientJs).toContain('__b1.onclick')
  })

  /**
   * onChange
   * <input onChange={(e) => setText(e.target.value)} />
   */
  it.todo('onChange')

  /**
   * onSubmit
   * <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
   */
  it.todo('onSubmit')

  /**
   * onKeyDown
   * <input onKeyDown={(e) => e.key === 'Enter' && handleEnter()} />
   */
  it.todo('onKeyDown')
})

// =============================================================================
// HTML属性
// =============================================================================

describe('HTML属性', () => {
  /**
   * class属性
   * <p class="counter">...</p>
   *
   * → サーバー: className="counter"
   */
  it('class属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p class="counter">{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // サーバーコンポーネントではclassNameに変換
    expect(component.serverComponent).toContain('className="counter"')
  })

  /**
   * 動的なclass属性
   * <p class={isActive() ? 'active' : ''}>...</p>
   */
  it.todo('動的なclass属性')

  /**
   * style属性
   * <p style="color: red">...</p>
   */
  it.todo('style属性')

  /**
   * 動的なstyle属性
   * <p style={{ color: isRed() ? 'red' : 'blue' }}>...</p>
   */
  it.todo('動的なstyle属性')

  /**
   * disabled属性
   * <button disabled={isLoading()}>Submit</button>
   */
  it.todo('動的なdisabled属性')

  /**
   * value属性（input要素）
   * <input value={text()} />
   */
  it.todo('動的なvalue属性')
})

// =============================================================================
// コンポーネント
// =============================================================================

describe('コンポーネント', () => {
  /**
   * propsなしのコンポーネント
   * <Counter />
   */
  it.todo('propsなしのコンポーネント')

  /**
   * propsありのコンポーネント
   * <Counter initial={5} />
   */
  it.todo('propsありのコンポーネント')

  /**
   * childrenを持つコンポーネント
   * <Button>Click me</Button>
   */
  it.todo('childrenを持つコンポーネント')
})

// =============================================================================
// サーバーコンポーネント出力
// =============================================================================

describe('サーバーコンポーネント出力', () => {
  /**
   * useRequestContextによるコンポーネント登録
   * Hono SSRで使用されたコンポーネントを追跡するため
   */
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
