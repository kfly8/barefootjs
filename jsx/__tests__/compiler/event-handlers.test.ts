/**
 * イベントハンドラのテスト
 *
 * ## 概要
 * JSX要素のイベントハンドラ（onClick, onChange, onInput等）が
 * クライアントJSに正しく変換されることを検証する。
 *
 * ## 対応パターン
 * - onClick: ボタンクリック等
 * - onChange: 入力値変更
 * - onInput: 入力中のリアルタイム更新
 * - onSubmit: フォーム送信
 * - onKeyDown: キーボードイベント
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * <button onClick={() => setCount(n => n + 1)}>+1</button>
 *
 * // 出力（HTML）
 * <button id="__b0">+1</button>
 *
 * // 出力（clientJs）
 * const __b0 = document.getElementById('__b0')
 * __b0.onclick = () => {
 *   setCount(n => n + 1)
 *   updateAll()
 * }
 * ```
 *
 * ## 注意事項
 * - 動的コンテンツがある場合、ハンドラ実行後に `updateAll()` が呼ばれる
 * - イベント引数 `(e)` は保持される
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('イベントハンドラ - 基本', () => {
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
})

describe('イベントハンドラ - フォーム', () => {
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
})

describe('イベントハンドラ - キーボード', () => {
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
