/**
 * 動的コンテンツのテスト
 *
 * ## 概要
 * JSX内の動的な値（signal呼び出し、式、条件分岐）が
 * 正しくHTMLとクライアントJSに変換されることを検証する。
 *
 * ## 対応パターン
 * - 関数呼び出し: `{count()}`
 * - 二項演算: `{count() * 2}`
 * - 条件式（三項演算子）: `{on() ? 'ON' : 'OFF'}`
 * - テキスト + 動的コンテンツ: `Count: {count()}`
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * <p>{count()}</p>
 *
 * // 出力（HTML）
 * <p id="__d0">0</p>  // 初期値で評価
 *
 * // 出力（clientJs）
 * const __d0 = document.getElementById('__d0')
 * function updateAll() {
 *   __d0.textContent = count()
 * }
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('動的コンテンツ', () => {
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
})
