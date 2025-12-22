/**
 * map内のコンポーネントインライン展開のテスト
 *
 * ## 概要
 * `.map()` 内で使用されるコンポーネントが、テンプレートリテラルに
 * インライン展開されることを検証する。
 *
 * ## なぜインライン展開が必要か
 * map内のコンポーネントは、親の配列が更新されるたびに
 * `innerHTML` で再描画される。そのため、コンポーネントを
 * 個別のDOMノードとして扱うのではなく、テンプレート文字列に
 * 展開する必要がある。
 *
 * ## 対応パターン
 * - propsを持つコンポーネント
 * - イベントハンドラ付きコンポーネント
 * - 条件付きレンダリングを含むコンポーネント
 * - 複数のイベントハンドラを持つコンポーネント
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * {items().map(item => <Item item={item} onDelete={() => remove(item.id)} />)}
 *
 * // Itemコンポーネント
 * function Item({ item, onDelete }) {
 *   return <li><span>{item.text}</span><button onClick={() => onDelete()}>削除</button></li>
 * }
 *
 * // 出力（clientJs）- Itemがインライン展開される
 * __l0.innerHTML = items().map((item, __index) =>
 *   `<li><span>${item.text}</span><button data-index="${__index}" data-event-id="0">削除</button></li>`
 * ).join('')
 *
 * __l0.addEventListener('click', (e) => {
 *   const target = e.target.closest('[data-event-id="0"]')
 *   if (target && target.dataset.eventId === '0') {
 *     const __index = parseInt(target.dataset.index, 10)
 *     const item = items()[__index]
 *     remove(item.id)  // onDelete() が展開される
 *     updateAll()
 *   }
 * })
 * ```
 */

import { describe, it, expect } from 'bun:test'
import { compileWithFiles } from './test-helpers'

describe('map内のコンポーネントインライン展開', () => {
  it('propsを持つコンポーネントのインライン展開', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
          return (
            <ul>
              {items().map(item => (
                <Item item={item} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        type Props = { item: { id: number; text: string } }
        function Item({ item }: Props) {
          return <li>{item.text}</li>
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appComponent = result.components.find(c => c.name === 'App')

    // ItemコンポーネントがHTMLにインライン展開される（イベントがないので__indexなし）
    expect(appComponent!.clientJs).toContain('items().map(item => `<li>${item.text}</li>`).join(\'\')')
  })

  it('イベントハンドラ付きコンポーネントのインライン展開', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello' }])
          const remove = (id) => setItems(items().filter(i => i.id !== id))
          return (
            <ul>
              {items().map(item => (
                <Item item={item} onDelete={() => remove(item.id)} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        type Props = {
          item: { id: number; text: string }
          onDelete: () => void
        }
        function Item({ item, onDelete }: Props) {
          return (
            <li>
              <span>{item.text}</span>
              <button onClick={() => onDelete()}>削除</button>
            </li>
          )
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appComponent = result.components.find(c => c.name === 'App')

    // イベントハンドラがdata-indexとdata-event-idに変換される
    expect(appComponent!.clientJs).toContain('data-index="${__index}"')
    expect(appComponent!.clientJs).toContain('data-event-id="0"')
    // イベントデリゲーションが生成される
    expect(appComponent!.clientJs).toContain("addEventListener('click'")
    // ハンドラの中身がインライン展開される（onDelete() → remove(item.id)）
    expect(appComponent!.clientJs).toContain('remove(item.id)')
  })

  it('条件付きレンダリングを含むコンポーネントのインライン展開', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello', editing: false }])
          return (
            <ul>
              {items().map(item => (
                <Item item={item} />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        type Props = { item: { id: number; text: string; editing: boolean } }
        function Item({ item }: Props) {
          return (
            <li>
              {item.editing ? (
                <input value={item.text} />
              ) : (
                <span>{item.text}</span>
              )}
            </li>
          )
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appComponent = result.components.find(c => c.name === 'App')

    // 条件付きレンダリングがテンプレートに含まれる
    expect(appComponent!.clientJs).toContain('item.editing ?')
  })

  it('複数のイベントハンドラを持つコンポーネント', async () => {
    const files: Record<string, string> = {
      '/test/App.tsx': `
        import { createSignal } from 'barefoot'
        import Item from './Item'
        function App() {
          const [items, setItems] = createSignal([{ id: 1, text: 'hello', done: false }])
          const toggle = (id) => setItems(items().map(i => i.id === id ? {...i, done: !i.done} : i))
          const remove = (id) => setItems(items().filter(i => i.id !== id))
          return (
            <ul>
              {items().map(item => (
                <Item
                  item={item}
                  onToggle={() => toggle(item.id)}
                  onDelete={() => remove(item.id)}
                />
              ))}
            </ul>
          )
        }
      `,
      '/test/Item.tsx': `
        type Props = {
          item: { id: number; text: string; done: boolean }
          onToggle: () => void
          onDelete: () => void
        }
        function Item({ item, onToggle, onDelete }: Props) {
          return (
            <li>
              <span>{item.text}</span>
              <button onClick={() => onToggle()}>切替</button>
              <button onClick={() => onDelete()}>削除</button>
            </li>
          )
        }
        export default Item
      `,
    }
    const result = await compileWithFiles('/test/App.tsx', files)
    const appComponent = result.components.find(c => c.name === 'App')

    // 複数のイベントデリゲーションが生成される
    expect(appComponent!.clientJs).toContain('toggle(item.id)')
    expect(appComponent!.clientJs).toContain('remove(item.id)')
    // 異なるevent-idが使われる
    expect(appComponent!.clientJs).toContain('data-event-id="0"')
    expect(appComponent!.clientJs).toContain('data-event-id="1"')
  })
})
