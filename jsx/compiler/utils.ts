/**
 * JSXコンパイラ - ユーティリティ関数
 *
 * コンパイル処理で使用する汎用ユーティリティを提供する。
 */

/**
 * コールバックprops（onXxx）をラップしてupdateAll()を追加
 *
 * @example
 * // 入力
 * { onAdd: handleAdd }
 *
 * // 出力（hasUpdateAll = true の場合）
 * { onAdd: (...args) => { handleAdd(...args); updateAll() } }
 */
export function wrapCallbackProps(propsExpr: string, hasUpdateAll: boolean): string {
  if (!hasUpdateAll) return propsExpr

  // onで始まるprops（onAdd, onToggle等）をラップ
  return propsExpr.replace(
    /(on[A-Z]\w*):\s*([^,}]+)/g,
    (_, propName, value) => {
      const trimmedValue = value.trim()
      return `${propName}: (...args) => { ${trimmedValue}(...args); updateAll() }`
    }
  )
}

/**
 * 配列式を評価
 * ビルド時のみ実行されるためevalは安全
 */
export function evaluateArrayExpression(expr: string): unknown[] | null {
  try {
    const result = eval(expr)
    return Array.isArray(result) ? result : null
  } catch {
    return null
  }
}

/**
 * テンプレートリテラルを評価
 * ビルド時のみ実行されるためFunctionコンストラクタは安全
 */
export function evaluateTemplate(
  templateStr: string,
  paramName: string,
  item: unknown,
  __index: number
): string {
  try {
    const evalFn = new Function(paramName, '__index', `return ${templateStr}`)
    return evalFn(item, __index)
  } catch {
    return ''
  }
}

/**
 * コンテンツからハッシュを生成（8文字の16進数）
 *
 * @param content - ハッシュ対象のコンテンツ
 * @returns 8文字のハッシュ文字列
 */
export function generateContentHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // 8文字の16進数に変換（負の値も正しく処理）
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * パスを解決
 *
 * @param baseDir - ベースディレクトリ
 * @param relativePath - 相対パス（./や../で始まる）
 * @returns 解決されたパス
 */
export function resolvePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('./')) {
    return `${baseDir}/${relativePath.slice(2)}`
  }
  if (relativePath.startsWith('../')) {
    const parts = baseDir.split('/')
    parts.pop()
    return `${parts.join('/')}/${relativePath.slice(3)}`
  }
  return relativePath
}

/**
 * 動的属性かどうか判定
 * class, style, disabled, value など
 */
export function isDynamicAttributeTarget(attrName: string): boolean {
  return ['class', 'className', 'style', 'disabled', 'value', 'checked', 'hidden'].includes(attrName)
}
