/**
 * HTML属性のテスト
 *
 * ## 概要
 * JSX要素のHTML属性（静的・動的）が正しく処理されることを検証する。
 *
 * ## 対応パターン
 * - 静的属性: `class="counter"`, `style="color: red"`
 * - 動的class: `class={isActive() ? 'active' : ''}`
 * - 動的style: `style={{ color: isRed() ? 'red' : 'blue' }}`
 * - 動的disabled: `disabled={isLoading()}`
 * - 動的value: `value={text()}`
 *
 * ## 生成されるコード
 * ```typescript
 * // 入力
 * <p class={isActive() ? 'active' : ''}>Hello</p>
 *
 * // 出力（HTML）- 初期値で評価
 * <p id="__a0" class="">Hello</p>  // isActive() = false の場合
 *
 * // 出力（clientJs）
 * const __a0 = document.getElementById('__a0')
 * function updateAll() {
 *   __a0.className = isActive() ? 'active' : ''
 * }
 * ```
 *
 * ## 注意事項
 * - サーバーコンポーネントでは `class` → `className` に変換
 * - boolean属性（disabled等）は `true` の時のみ出力
 */

import { describe, it, expect } from 'bun:test'
import { compile } from './test-helpers'

describe('HTML属性 - 静的', () => {
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
})

describe('HTML属性 - 動的class', () => {
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
})

describe('HTML属性 - 動的style', () => {
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
})

describe('HTML属性 - boolean属性', () => {
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
})

describe('HTML属性 - フォーム関連', () => {
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
