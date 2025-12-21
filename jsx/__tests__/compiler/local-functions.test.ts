/**
 * コンポーネント内ローカル関数のテスト
 *
 * ## 概要
 * コンポーネント内で定義されたローカル関数（ハンドラ関数）が
 * クライアントJSに正しく出力されることを検証する。
 *
 * ## 対応パターン
 * - アロー関数で定義されたハンドラ
 * - 複数のハンドラ関数
 * - signal宣言と混在
 * - TypeScript型注釈の除去
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * const handleToggle = (id: number) => {
 *   setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))
 * }
 *
 * // 出力（clientJs）- 型注釈が除去される
 * const handleToggle = (id) => {
 *   setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))
 * }
 * ```
 *
 * ## 注意事項
 * - signal呼び出しを含む関数のみが抽出される
 * - TypeScript型注釈は除去される
 * - デフォルト引数は保持される
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('コンポーネント内ローカル関数', () => {
  it('アロー関数で定義されたハンドラが出力される', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([{ id: 1, done: false }])
        const handleToggle = (id) => {
          setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))
        }
        return (
          <ul>
            {items().map(item => (
              <li>
                <button onClick={() => handleToggle(item.id)}>切替</button>
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // ハンドラ関数が定義されている
    expect(component.clientJs).toContain('const handleToggle = (id) =>')
    expect(component.clientJs).toContain('setItems(items().map(t => t.id === id ? { ...t, done: !t.done } : t))')
  })

  it('複数のハンドラ関数が出力される', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal([])
        const handleAdd = () => {
          setItems([...items(), { id: Date.now() }])
        }
        const handleDelete = (id) => {
          setItems(items().filter(t => t.id !== id))
        }
        return (
          <div>
            <button onClick={() => handleAdd()}>追加</button>
            <ul>
              {items().map(item => (
                <li>
                  <button onClick={() => handleDelete(item.id)}>削除</button>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 両方のハンドラ関数が定義されている
    expect(component.clientJs).toContain('const handleAdd = () =>')
    expect(component.clientJs).toContain('const handleDelete = (id) =>')
  })

  it('signal宣言と混在しても正しく抽出される', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [count, setCount] = signal(0)
        const [name, setName] = signal('')
        const increment = () => {
          setCount(count() + 1)
        }
        const reset = () => {
          setCount(0)
          setName('')
        }
        return (
          <div>
            <button onClick={() => increment()}>+1</button>
            <button onClick={() => reset()}>リセット</button>
          </div>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // signal宣言は通常通り
    expect(component.clientJs).toContain('const [count, setCount] = signal(0)')
    expect(component.clientJs).toContain("const [name, setName] = signal('')")
    // ハンドラ関数も出力される
    expect(component.clientJs).toContain('const increment = () =>')
    expect(component.clientJs).toContain('const reset = () =>')
  })

  it('TypeScript型注釈が除去される', async () => {
    const source = `
      import { signal } from 'barefoot'
      function Component() {
        const [items, setItems] = signal<{ id: number; done: boolean }[]>([])
        const handleToggle = (id: number) => {
          setItems(items().map((t: { id: number; done: boolean }) =>
            t.id === id ? { ...t, done: !t.done } : t
          ))
        }
        const handleAdd = (text: string, priority: number = 1) => {
          setItems([...items(), { id: Date.now(), done: false }])
        }
        return (
          <ul>
            {items().map(item => (
              <li>
                <button onClick={() => handleToggle(item.id)}>切替</button>
              </li>
            ))}
          </ul>
        )
      }
    `
    const result = await compile(source)
    const component = result.components[0]

    // 型注釈が除去されている
    expect(component.clientJs).not.toContain(': number')
    expect(component.clientJs).not.toContain(': string')
    expect(component.clientJs).not.toContain(': {')
    // 関数自体は出力される
    expect(component.clientJs).toContain('const handleToggle = (id) =>')
    expect(component.clientJs).toContain('const handleAdd = (text, priority = 1) =>')
  })
})
