/**
 * BarefootJS - Reactive Primitives
 *
 * createSignal: 状態を保持し、変更を追跡するリアクティブプリミティブ
 * createEffect: signal の変更に反応して自動実行される副作用
 * onCleanup: effect のクリーンアップ関数を登録
 */

// --- Types ---

export type Signal<T> = [
  /** 現在の値を取得（effect内で呼ぶと依存として登録される） */
  () => T,
  /** 値を更新（値または関数を渡す） */
  (valueOrFn: T | ((prev: T) => T)) => void
]

export type CleanupFn = () => void
export type EffectFn = () => void | CleanupFn

// --- Internal State ---

type EffectContext = {
  fn: EffectFn
  cleanup: CleanupFn | null
  dependencies: Set<Set<EffectContext>>
}

let currentEffect: EffectContext | null = null
let effectDepth = 0
const MAX_EFFECT_RUNS = 100

// --- createSignal ---

/**
 * createSignal - リアクティブな値を作成
 *
 * @param initialValue - 初期値
 * @returns [getter, setter] のタプル
 *
 * @example
 * const [count, setCount] = createSignal(0)
 * count()              // 0
 * setCount(5)          // 値を5に更新
 * setCount(n => n + 1) // 関数で更新（6になる）
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue
  const subscribers = new Set<EffectContext>()

  const get = () => {
    // 現在実行中のeffectがあれば、このsignalへの依存を記録
    if (currentEffect) {
      subscribers.add(currentEffect)
      currentEffect.dependencies.add(subscribers)
    }
    return value
  }

  const set = (valueOrFn: T | ((prev: T) => T)) => {
    const newValue = typeof valueOrFn === 'function'
      ? (valueOrFn as (prev: T) => T)(value)
      : valueOrFn

    // 値が変わらない場合は何もしない
    if (Object.is(value, newValue)) {
      return
    }

    value = newValue

    // 依存しているeffectを再実行
    const effectsToRun = [...subscribers]
    for (const effect of effectsToRun) {
      runEffect(effect)
    }
  }

  return [get, set]
}

// --- createEffect ---

/**
 * createEffect - signal の変更に反応して自動実行される副作用
 *
 * @param fn - 副作用関数（クリーンアップ関数を返すことができる）
 *
 * @example
 * const [count, setCount] = createSignal(0)
 * createEffect(() => {
 *   console.log("count changed:", count())
 * })
 * setCount(1)  // "count changed: 1" が出力される
 */
export function createEffect(fn: EffectFn): void {
  if (currentEffect !== null) {
    throw new Error('createEffect cannot be nested inside another effect')
  }

  const effect: EffectContext = {
    fn,
    cleanup: null,
    dependencies: new Set(),
  }

  runEffect(effect)
}

function runEffect(effect: EffectContext): void {
  // 循環依存チェック
  effectDepth++
  if (effectDepth > MAX_EFFECT_RUNS) {
    effectDepth = 0
    throw new Error(`Effect exceeded maximum run limit (${MAX_EFFECT_RUNS}). Possible circular dependency.`)
  }

  // 前回のクリーンアップを実行
  if (effect.cleanup) {
    effect.cleanup()
    effect.cleanup = null
  }

  // 前回の依存をクリア
  for (const dep of effect.dependencies) {
    dep.delete(effect)
  }
  effect.dependencies.clear()

  // effectを実行して新しい依存を収集
  const prevEffect = currentEffect
  currentEffect = effect

  try {
    const result = effect.fn()
    if (typeof result === 'function') {
      effect.cleanup = result
    }
  } finally {
    currentEffect = prevEffect
    effectDepth--
  }
}

// --- onCleanup ---

let currentCleanupFn: CleanupFn | null = null

/**
 * onCleanup - effect のクリーンアップ関数を登録
 *
 * effect 内で呼び出すと、次回の effect 実行前または
 * effect が破棄される時にクリーンアップ関数が呼ばれる。
 *
 * @param fn - クリーンアップ関数
 *
 * @example
 * createEffect(() => {
 *   const timer = setInterval(() => console.log('tick'), 1000)
 *   onCleanup(() => clearInterval(timer))
 * })
 */
export function onCleanup(fn: CleanupFn): void {
  if (currentEffect) {
    const effect = currentEffect
    const prevCleanup = effect.cleanup
    effect.cleanup = () => {
      if (prevCleanup) prevCleanup()
      fn()
    }
  }
}
