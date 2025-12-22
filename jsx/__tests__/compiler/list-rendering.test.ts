/**
 * リストレンダリングのテスト
 *
 * ## 概要
 * 配列の `.map()` によるリストレンダリングと、
 * リスト内の動的要素（イベント、条件分岐、属性）の処理を検証する。
 *
 * ## 対応パターン
 * - 基本的なmap: `items().map(item => <li>{item}</li>)`
 * - filter + map: `items().filter(x => x.done).map(...)`
 * - map内のイベント: `onClick={() => remove(item.id)}`
 * - map内の条件分岐: `{item.editing ? <input /> : <span />}`
 * - map内の動的属性: `class={item.done ? 'done' : ''}`
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * <ul>{items().map(item => <li onClick={() => remove(item.id)}>{item.text}</li>)}</ul>
 *
 * // 出力（HTML）
 * <ul id="__l0">
 *   <li data-index="0" data-event-id="0">...</li>
 *   ...
 * </ul>
 *
 * // 出力（clientJs）
 * __l0.innerHTML = items().map((item, __index) => `<li data-index="${__index}" data-event-id="0">${item.text}</li>`).join('')
 * __l0.addEventListener('click', (e) => {
 *   const target = e.target.closest('[data-event-id="0"]')
 *   if (target && target.dataset.eventId === '0') {
 *     const __index = parseInt(target.dataset.index, 10)
 *     const item = items()[__index]
 *     remove(item.id)
 *     updateAll()
 *   }
 * })
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('リストレンダリング - 基本', () => {
  it('配列のmap', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal(['a', 'b', 'c'])
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

  it('配列のfilter + map', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

describe('リストレンダリング - イベント', () => {
  it('map内のonClick', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

  it('map内の複数のonClick（異なる要素）', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

  it('map内のonChange', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

  it('map内の同一要素に複数イベント', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'a' }])
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

  it('map内のblurイベント（キャプチャフェーズ）', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1 }])
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

  it('map内のkeydownイベント（条件付き実行）', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1 }])
        return (
          <ul>{items().map(item => (
            <li><input onKeyDown={(e) => e.key === 'Enter' && console.log('enter')} /></li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 条件付き実行: if (condition) { action }
    expect(component.clientJs).toContain("if (e.key === 'Enter')")
    expect(component.clientJs).toContain("console.log('enter')")
  })

  it('map内のkeydownイベント（複数条件 && 実行）', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
        const handleFinish = (id, text) => console.log(id, text)
        return (
          <ul>{items().map(item => (
            <li>
              <input onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && handleFinish(item.id, e.target.value)} />
            </li>
          ))}</ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 複数条件の場合も if 文で囲まれる
    // 期待: if (e.key === 'Enter' && !e.isComposing) { handleFinish(...) }
    expect(component.clientJs).toContain("if (e.key === 'Enter' && !e.isComposing)")
    expect(component.clientJs).toContain("handleFinish(item.id, e.target.value)")

    // アクションは if 文の中にあるべき
    const clientJs = component.clientJs
    const ifMatch = clientJs.match(/if \(e\.key === 'Enter' && !e\.isComposing\) \{[\s\S]*?handleFinish\(item\.id, e\.target\.value\)[\s\S]*?\}/)
    expect(ifMatch).not.toBeNull()
  })
})

describe('リストレンダリング - 動的属性', () => {
  it('map内の動的class属性', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

  it('map内の動的style属性', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

  it('map内の動的checked属性', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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
})

describe('リストレンダリング - 条件分岐', () => {
  it('map内の条件付きレンダリング（三項演算子）', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
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

  it('初期HTMLで三項演算子が評価される', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([
          { id: 1, text: 'hello', editing: false },
          { id: 2, text: 'world', editing: true }
        ])
        return (
          <ul>
            {items().map(item => (
              <li>
                {item.editing ? (
                  <input value={item.text} />
                ) : (
                  <span>{item.text}</span>
                )}
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)

    // 初期HTMLに三項演算子がそのまま含まれていない
    expect(result.html).not.toContain('item.editing ?')
    // 初期値に基づいて正しく評価されている
    // id:1 は editing:false なので <span>
    expect(result.html).toContain('<span>hello</span>')
    // id:2 は editing:true なので <input>
    expect(result.html).toContain('<input')
    expect(result.html).toContain('value="world"')
  })
})
