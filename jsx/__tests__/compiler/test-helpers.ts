/**
 * JSXコンパイラテスト用ヘルパー関数
 *
 * テスト間で共通のセットアップとユーティリティを提供する。
 */

import { compileJSX } from '../../jsx-compiler'

/**
 * 単一コンポーネントをコンパイル
 *
 * @param source - JSXソースコード
 * @returns コンパイル結果
 *
 * @example
 * ```typescript
 * const result = await compile(`
 *   import { signal } from 'barefoot'
 *   function Counter() {
 *     const [count, setCount] = signal(0)
 *     return <p>{count()}</p>
 *   }
 * `)
 * expect(result.components[0].clientJs).toContain('signal(0)')
 * ```
 */
export async function compile(source: string) {
  const files: Record<string, string> = {
    '/test/Component.tsx': source,
  }
  return compileJSX('/test/Component.tsx', async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  })
}

/**
 * 複数ファイル構成のコンポーネントをコンパイル
 *
 * @param entryPath - エントリーポイントのパス
 * @param files - ファイルパスとソースコードのマップ
 * @returns コンパイル結果
 *
 * @example
 * ```typescript
 * const result = await compileWithFiles('/test/App.tsx', {
 *   '/test/App.tsx': `
 *     import Counter from './Counter'
 *     function App() { return <Counter /> }
 *   `,
 *   '/test/Counter.tsx': `
 *     import { signal } from 'barefoot'
 *     function Counter() { ... }
 *   `,
 * })
 * ```
 */
export async function compileWithFiles(
  entryPath: string,
  files: Record<string, string>
) {
  return compileJSX(entryPath, async (path) => {
    if (files[path]) return files[path]
    throw new Error(`File not found: ${path}`)
  })
}
