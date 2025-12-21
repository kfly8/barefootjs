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
 * const [count, setCount] = signal(0)
 *
 * // 出力（clientJs）
 * import { signal } from './barefoot.js'
 * const [count, setCount] = signal(0)
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('signal宣言', () => {
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

    expect(component.clientJs).toContain('const [count, setCount] = signal(0)')
  })

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
