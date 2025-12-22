/**
 * Signal宣言のテスト
 *
 * ## 概要
 * BarefootJSの状態管理の基本単位である `signal` の宣言と
 * クライアントJSへの出力を検証する。
 *
 * ## 対応パターン
 * - 数値、真偽値、文字列のプリミティブ型
 * - オブジェクト、配列の参照型
 * - 複数signalの同時宣言
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * const [count, setCount] = createSignal(0)
 *
 * // 出力（clientJs）
 * import { createSignal } from './barefoot.js'
 * const [count, setCount] = createSignal(0)
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('signal宣言', () => {
  it('数値のsignal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        return <p>{count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [count, setCount] = createSignal(0)')
  })

  it('真偽値のsignal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [on, setOn] = createSignal(false)
        return <span>{on() ? 'ON' : 'OFF'}</span>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [on, setOn] = createSignal(false)')
  })

  it('文字列のsignal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [text, setText] = createSignal('hello')
        return <p>{text()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain("const [text, setText] = createSignal('hello')")
  })

  it('複数のsignal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [count, setCount] = createSignal(0)
        const [name, setName] = createSignal('Alice')
        return <p>{name()}: {count()}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [count, setCount] = createSignal(0)')
    expect(component.clientJs).toContain("const [name, setName] = createSignal('Alice')")
  })

  it('オブジェクトのsignal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [user, setUser] = createSignal({ name: 'Alice', age: 20 })
        return <p>{user().name}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain("const [user, setUser] = createSignal({ name: 'Alice', age: 20 })")
  })

  it('配列のsignal', async () => {
    const source = `
      import { createSignal } from 'barefoot'
      function Component() {
        const [items, setItems] = createSignal([])
        return <p>{items().length}</p>
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    expect(component.clientJs).toContain('const [items, setItems] = createSignal([])')
  })
})
