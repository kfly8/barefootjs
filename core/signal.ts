/**
 * BareJS - Minimal Reactive Primitive
 *
 * React風のsignal API
 */

/**
 * Signal型の定義
 */
export type Signal<T> = [
  /** 現在の値を取得 */
  () => T,
  /** 値を更新（値または関数を渡す） */
  (valueOrFn: T | ((prev: T) => T)) => void
]

/**
 * signal - リアクティブな値を作成
 *
 * @param initialValue - 初期値
 * @returns [getter, setter] のタプル
 *
 * @example
 * const [count, setCount] = signal(0)
 * count()              // 0
 * setCount(5)          // 値を5に更新
 * setCount(n => n + 1) // 関数で更新（6になる）
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue

  const get = () => value

  const set = (valueOrFn: T | ((prev: T) => T)) => {
    value = typeof valueOrFn === 'function'
      ? (valueOrFn as (prev: T) => T)(value)
      : valueOrFn
  }

  return [get, set]
}
