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

// テスト用のヘルパー: 複数ファイルをサポート
async function compileWithFiles(
  entryPath: string,
  files: Record<string, string>
) {
  return compileJSX(entryPath, async (path) => {
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
// map内の動的要素
// =============================================================================

describe('map内の動的要素', () => {
  /**
   * map内のonClick
   * items().map(item => <li onClick={() => remove(item.id)}>{item.text}</li>)
   *
   * → イベントデリゲーションでハンドラを設定
   * → data-index属性で要素を特定
   */
  it('map内のonClick', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { id: 1, text: 'a' },
          { id: 2, text: 'b' }
        ])
        const remove = (id) => setItems(items => items.filter(x => x.id !== id))
        return <ul>{items().map(item => <li onClick={() => remove(item.id)}>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // リスト要素にIDが付与される
    expect(component.serverComponent).toContain('id="__l0"')

    // data-index属性がテンプレートに含まれる
    expect(component.clientJs).toContain('data-index="${__index}"')

    // イベントデリゲーションが設定される
    expect(component.clientJs).toContain("__l0.addEventListener('click'")
    expect(component.clientJs).toContain('const item = items()[__index]')
    expect(component.clientJs).toContain('remove(item.id)')
  })

  /**
   * map内の複数のonClick（異なる要素）
   * items().map(item => <li><button onClick={toggle}>A</button><button onClick={remove}>B</button></li>)
   *
   * → 各イベントハンドラはdata-event-idで区別される
   */
  it('map内の複数のonClick（異なる要素）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { id: 1, text: 'a', done: false },
          { id: 2, text: 'b', done: true }
        ])
        const toggle = (id) => setItems(items => items.map(x => x.id === id ? { ...x, done: !x.done } : x))
        const remove = (id) => setItems(items => items.filter(x => x.id !== id))
        return (
          <ul>{items().map(todo => (
            <li>
              <span>{todo.text}</span>
              <button onClick={() => toggle(todo.id)}>Toggle</button>
              <button onClick={() => remove(todo.id)}>Delete</button>
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 各ボタンに異なるdata-event-idが付与される
    expect(component.clientJs).toContain('data-event-id="0"')
    expect(component.clientJs).toContain('data-event-id="1"')

    // 各イベントハンドラが個別に設定される
    expect(component.clientJs).toContain('toggle(todo.id)')
    expect(component.clientJs).toContain('remove(todo.id)')

    // イベントデリゲーションでevent-idをチェックする
    expect(component.clientJs).toContain("dataset.eventId === '0'")
    expect(component.clientJs).toContain("dataset.eventId === '1'")
  })

  /**
   * map内のonChange
   * items().map(item => <input onChange={() => toggle(item.id)} />)
   */
  it('map内のonChange', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { id: 1, checked: false },
          { id: 2, checked: true }
        ])
        const toggle = (id) => setItems(items => items.map(x => x.id === id ? { ...x, checked: !x.checked } : x))
        return <div>{items().map(item => <input type="checkbox" onChange={() => toggle(item.id)} />)}</div>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // onchangeイベントデリゲーションが設定される
    expect(component.clientJs).toContain("addEventListener('change'")
    expect(component.clientJs).toContain('toggle(item.id)')
  })

  /**
   * map内の動的class属性
   * items().map(item => <li class={item.done ? 'done' : ''}>{item.text}</li>)
   *
   * → テンプレート内で式として出力され、innerHTML更新時に評価される
   */
  it('map内の動的class属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { text: 'a', done: true },
          { text: 'b', done: false }
        ])
        return <ul>{items().map(item => <li class={item.done ? 'done' : ''}>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // テンプレートに動的class属性が含まれる
    expect(component.clientJs).toContain("class=\"${item.done ? 'done' : ''}\"")
  })

  /**
   * map内の動的style属性
   */
  it('map内の動的style属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { text: 'a', color: 'red' },
          { text: 'b', color: 'blue' }
        ])
        return <ul>{items().map(item => <li style={item.color}>{item.text}</li>)}</ul>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // テンプレートに動的style属性が含まれる
    expect(component.clientJs).toContain('style="${item.color}"')
  })

  /**
   * map内の動的checked属性
   */
  it('map内の動的checked属性', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { id: 1, checked: true },
          { id: 2, checked: false }
        ])
        return <div>{items().map(item => <input type="checkbox" checked={item.checked} />)}</div>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // テンプレートに動的checked属性が含まれる
    expect(component.clientJs).toContain('checked="${item.checked}"')
  })

  /**
   * map内の同一要素に複数イベント
   * <input onInput={...} onBlur={...} onKeyDown={...} />
   *
   * → 同一要素の全イベントが同じevent-idを共有する
   */
  it('map内の同一要素に複数イベント', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([{ id: 1, text: 'a' }])
        return (
          <ul>{items().map(item => (
            <li>
              <input
                onInput={(e) => console.log('input')}
                onBlur={() => console.log('blur')}
                onKeyDown={(e) => console.log('keydown')}
              />
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 同一要素の全イベントが同じevent-idを共有
    expect(component.clientJs).toContain('data-event-id="0"')
    // 全イベントリスナーが同じevent-idをチェック
    expect(component.clientJs).toMatch(/addEventListener\('input'[\s\S]*?data-event-id="0"/)
    expect(component.clientJs).toMatch(/addEventListener\('blur'[\s\S]*?data-event-id="0"/)
    expect(component.clientJs).toMatch(/addEventListener\('keydown'[\s\S]*?data-event-id="0"/)
  })

  /**
   * map内のblurイベント（キャプチャフェーズ）
   * blurはバブリングしないため、キャプチャフェーズで捕捉
   */
  it('map内のblurイベント（キャプチャフェーズ）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([{ id: 1 }])
        return (
          <ul>{items().map(item => (
            <li><input onBlur={() => console.log('blur')} /></li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // blurイベントはキャプチャフェーズを使用
    expect(component.clientJs).toContain("addEventListener('blur'")
    expect(component.clientJs).toContain('}, true)')
  })

  /**
   * map内のkeydownイベント（条件付き実行）
   * e.key === 'Enter' && action のパターンを検出し、条件付きでupdateAll()を呼ぶ
   */
  it('map内のkeydownイベント（条件付き実行）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([{ id: 1 }])
        return (
          <ul>{items().map(item => (
            <li><input onKeyDown={(e) => e.key === 'Enter' && console.log('enter')} /></li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 条件付き実行: if (condition) { action; updateAll() }
    expect(component.clientJs).toContain("if (e.key === 'Enter')")
    expect(component.clientJs).toContain("console.log('enter')")
    expect(component.clientJs).toContain('updateAll()')
  })

  /**
   * map内の条件付きレンダリング（三項演算子）
   * items().map(item => <li>{item.editing ? <input /> : <span>{item.text}</span>}</li>)
   *
   * → テンプレート内で三項演算子を使用し、innerHTML更新時に評価される
   */
  it('map内の条件付きレンダリング（三項演算子）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([
          { id: 1, text: 'a', editing: false },
          { id: 2, text: 'b', editing: true }
        ])
        return (
          <ul>{items().map(item => (
            <li>
              {item.editing ? <input value={item.text} /> : <span>{item.text}</span>}
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // テンプレートに三項演算子が含まれる
    expect(component.clientJs).toContain('${item.editing ?')
    // input要素が含まれる
    expect(component.clientJs).toContain('<input')
    // span要素が含まれる
    expect(component.clientJs).toContain('<span>')
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
   *
   * → __b0.onchange = (e) => { setText(e.target.value); updateAll() }
   */
  it('onChange', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [text, setText] = signal('')
        return (
          <div>
            <p>{text()}</p>
            <input onChange={(e) => setText(e.target.value)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // input要素にIDが付与される
    expect(component.serverComponent).toContain('id="__b0"')

    // onchangeハンドラが設定される（イベント引数が保持される）
    expect(component.clientJs).toContain('__b0.onchange = (e) =>')
    expect(component.clientJs).toContain('setText(e.target.value)')

    // updateAllが呼ばれる
    expect(component.clientJs).toContain('updateAll()')
  })

  /**
   * onInput（イベント引数付き）
   * <input onInput={(e) => setText(e.target.value)} />
   *
   * → __b0.oninput = (e) => { setText(e.target.value); updateAll() }
   */
  it('onInput（イベント引数付き）', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [text, setText] = signal('')
        return (
          <div>
            <p>{text()}</p>
            <input onInput={(e) => setText(e.target.value)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // oninputハンドラが設定される（イベント引数が保持される）
    expect(component.clientJs).toContain('__b0.oninput = (e) =>')
    expect(component.clientJs).toContain('setText(e.target.value)')
  })

  /**
   * onSubmit
   * <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
   *
   * → __b0.onsubmit = (e) => { e.preventDefault(); handleSubmit(); updateAll() }
   */
  it('onSubmit', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [submitted, setSubmitted] = signal(false)
        return (
          <div>
            <p>{submitted() ? 'Done' : 'Not yet'}</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}>
              <button type="submit">Submit</button>
            </form>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // form要素にIDが付与される
    expect(component.serverComponent).toContain('id="__b0"')

    // onsubmitハンドラが設定される
    expect(component.clientJs).toContain('__b0.onsubmit')
    expect(component.clientJs).toContain('e.preventDefault()')
    expect(component.clientJs).toContain('setSubmitted(true)')
  })

  /**
   * onKeyDown
   * <input onKeyDown={(e) => e.key === 'Enter' && handleEnter()} />
   *
   * → __b0.onkeydown = (e) => { e.key === 'Enter' && handleEnter(); updateAll() }
   */
  it('onKeyDown', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [text, setText] = signal('')
        const [submitted, setSubmitted] = signal(false)
        return (
          <div>
            <p>{submitted() ? 'Submitted' : 'Type and press Enter'}</p>
            <input onKeyDown={(e) => e.key === 'Enter' && setSubmitted(true)} />
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // input要素にIDが付与される
    expect(component.serverComponent).toContain('id="__b0"')

    // onkeydownハンドラが設定される
    expect(component.clientJs).toContain('__b0.onkeydown')
    expect(component.clientJs).toContain("e.key === 'Enter'")
    expect(component.clientJs).toContain('setSubmitted(true)')
  })
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
   *
   * 親コンポーネントが子コンポーネントをインポートして使用
   */
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

  /**
   * propsありのコンポーネント
   * <Counter initial={5} />
   *
   * サーバーコンポーネントがpropsを受け取る形式になる
   */
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

  /**
   * childrenを持つコンポーネント
   * <Button>Click me</Button>
   *
   * サーバーコンポーネントがchildrenを受け取る形式になる
   */
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
