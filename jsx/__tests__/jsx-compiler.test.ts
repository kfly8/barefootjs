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
  it('文字列のsignal', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [text, setText] = signal('hello')
        return <p>{text()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain("const [text, setText] = signal('hello')")
  })

  /**
   * 複数のsignal
   * const [count, setCount] = signal(0)
   * const [name, setName] = signal('')
   */
  it('複数のsignal', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        const [name, setName] = signal('Alice')
        return <p>{name()}: {count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [count, setCount] = signal(0)')
    expect(component.clientJs).toContain("const [name, setName] = signal('Alice')")
  })

  /**
   * オブジェクトのsignal
   * const [user, setUser] = signal({ name: '', age: 0 })
   */
  it('オブジェクトのsignal', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [user, setUser] = signal({ name: 'Alice', age: 20 })
        return <p>{user().name}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain("const [user, setUser] = signal({ name: 'Alice', age: 20 })")
  })

  /**
   * 配列のsignal
   * const [items, setItems] = signal([])
   */
  it('配列のsignal', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([])
        return <p>{items().length}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [items, setItems] = signal([])')
  })
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
   * signal(false) → 初期表示は "OFF" であるべき
   */
  it('初期値の正しい描画（真偽値から文字列）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [on, setOn] = signal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 初期値 false なので OFF が表示される
    expect(component.serverComponent).toContain('>OFF<')
  })

  /**
   * 初期値の正しい描画（数値の演算）
   * signal(5) → 初期表示は 10
   */
  it('初期値の正しい描画（数値の演算）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(5)
        return <span>{count() * 2}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 初期値 5 * 2 = 10
    expect(component.serverComponent).toContain('>10<')
  })

  /**
   * 配列のmap
   * <ul>{items().map(item => <li>{item}</li>)}</ul>
   */
  it('配列のmap', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal(['a', 'b', 'c'])
        return <ul>{items().map(item => <li>{item}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // リスト要素にIDが付与される
    expect(component.serverComponent).toContain('id="__l0"')

    // クライアントJSでinnerHTMLで更新される
    expect(component.clientJs).toContain('__l0.innerHTML = items().map(item => `<li>${item}</li>`).join(\'\')')

    // 初期値が描画される
    expect(component.serverComponent).toContain('<li>a</li><li>b</li><li>c</li>')
  })

  /**
   * 配列のfilter + map
   * <ul>{items().filter(x => x.done).map(item => <li>{item.text}</li>)}</ul>
   */
  it('配列のfilter + map', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { text: 'a', done: true },
          { text: 'b', done: false },
          { text: 'c', done: true }
        ])
        return <ul>{items().filter(x => x.done).map(item => <li>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // リスト要素にIDが付与される
    expect(component.serverComponent).toContain('id="__l0"')

    // クライアントJSでfilter + mapが使われる
    expect(component.clientJs).toContain('items().filter(x => x.done).map(item =>')

    // 初期値でフィルタされた要素が描画される（done: trueのみ）
    expect(component.serverComponent).toContain('<li>a</li>')
    expect(component.serverComponent).toContain('<li>c</li>')
    expect(component.serverComponent).not.toContain('<li>b</li>')
  })
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
   *
   * → __a0.className = isActive() ? 'active' : ''
   */
  it('動的なclass属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [isActive, setIsActive] = signal(false)
        return <p class={isActive() ? 'active' : ''}>Hello</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 動的属性を持つ要素にIDが付与される
    expect(component.serverComponent).toContain('id="__a0"')

    // 初期値がfalseなのでclassは空
    expect(component.serverComponent).not.toContain('class="active"')

    // クライアントJSでclassNameが更新される
    expect(component.clientJs).toContain("__a0.className = isActive() ? 'active' : ''")
  })

  /**
   * 動的なclass属性（初期値がtrue）
   */
  it('動的なclass属性（初期値がtrue）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [isActive, setIsActive] = signal(true)
        return <p class={isActive() ? 'active' : ''}>Hello</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 初期値がtrueなのでclassName="active"（サーバーコンポーネントではclassNameに変換される）
    expect(component.serverComponent).toContain('className="active"')
  })

  /**
   * style属性（静的）
   * <p style="color: red">...</p>
   */
  it('style属性（静的）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        return <p style="color: red">{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 静的なstyle属性がそのまま出力される
    expect(component.serverComponent).toContain('style="color: red"')
  })

  /**
   * 動的なstyle属性
   * <p style={{ color: isRed() ? 'red' : 'blue' }}>...</p>
   *
   * → Object.assign(__a0.style, { color: isRed() ? 'red' : 'blue' })
   */
  it('動的なstyle属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [isRed, setIsRed] = signal(true)
        return <p style={{ color: isRed() ? 'red' : 'blue' }}>Hello</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 動的属性を持つ要素にIDが付与される
    expect(component.serverComponent).toContain('id="__a0"')

    // 初期値がtrueなのでcolor: red
    expect(component.serverComponent).toContain('style="color: red"')

    // クライアントJSでstyleが更新される
    expect(component.clientJs).toContain("Object.assign(__a0.style, { color: isRed() ? 'red' : 'blue' })")
  })

  /**
   * disabled属性
   * <button disabled={isLoading()}>Submit</button>
   *
   * → __a0.disabled = isLoading()
   */
  it('動的なdisabled属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [isLoading, setIsLoading] = signal(false)
        return <button disabled={isLoading()}>Submit</button>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 動的属性を持つ要素にIDが付与される
    expect(component.serverComponent).toContain('id="__a0"')

    // 初期値がfalseなのでdisabled属性はない
    expect(component.serverComponent).not.toContain('disabled')

    // クライアントJSでdisabledが更新される
    expect(component.clientJs).toContain('__a0.disabled = isLoading()')
  })

  /**
   * disabled属性（初期値がtrue）
   */
  it('動的なdisabled属性（初期値がtrue）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [isLoading, setIsLoading] = signal(true)
        return <button disabled={isLoading()}>Submit</button>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 初期値がtrueなのでdisabled属性がある
    expect(component.serverComponent).toContain('disabled')
  })

  /**
   * value属性（input要素）
   * <input value={text()} />
   *
   * → __a0.value = text()
   */
  it('動的なvalue属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [text, setText] = signal('hello')
        return <input value={text()} />
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 動的属性を持つ要素にIDが付与される
    expect(component.serverComponent).toContain('id="__a0"')

    // 初期値が出力される
    expect(component.serverComponent).toContain('value="hello"')

    // クライアントJSでvalueが更新される
    expect(component.clientJs).toContain('__a0.value = text()')
  })
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
