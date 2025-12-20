/**
 * BareJS - Minimal Reactive Primitive
 *
 * signalのみを提供する最小限のリアクティブシステム。
 */

/**
 * Signal型の定義
 */
export type Signal<T> = {
  /** 現在の値を取得 */
  (): T
  /** 値を更新 */
  set: (value: T) => void
  /** 値を更新（関数を渡す場合） */
  update: (fn: (current: T) => T) => void
}

/**
 * signal - リアクティブな値を作成
 *
 * @param initialValue - 初期値
 * @returns Signal オブジェクト
 *
 * @example
 * const count = signal(0)
 * count()        // 0
 * count.set(1)   // 値を1に更新
 * count()        // 1
 * count.update(n => n + 1)  // 値を2に更新
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue

  // getter関数にset/updateメソッドを追加
  const get = (() => value) as Signal<T>

  get.set = (newValue: T) => {
    value = newValue
  }

  get.update = (fn: (current: T) => T) => {
    value = fn(value)
  }

  return get
}
