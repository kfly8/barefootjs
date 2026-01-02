/**
 * BarefootJS - Reactive Primitives
 *
 * Minimal reactive system for DOM manipulation.
 * Inspired by SolidJS signals.
 */

// --- Types ---

export type Signal<T> = [
  /** Get current value (registers dependency when called inside effect) */
  () => T,
  /** Update value (accepts value or updater function) */
  (valueOrFn: T | ((prev: T) => T)) => void
]

export type CleanupFn = () => void
export type EffectFn = () => void | CleanupFn
export type Memo<T> = () => T

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
 * Create a reactive value
 *
 * @param initialValue - Initial value
 * @returns [getter, setter] tuple
 *
 * @example
 * const [count, setCount] = createSignal(0)
 * count()              // 0
 * setCount(5)          // Update to 5
 * setCount(n => n + 1) // Update with function (becomes 6)
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue
  const subscribers = new Set<EffectContext>()

  const get = () => {
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

    if (Object.is(value, newValue)) {
      return
    }

    value = newValue

    const effectsToRun = [...subscribers]
    for (const effect of effectsToRun) {
      runEffect(effect)
    }
  }

  return [get, set]
}

// --- createEffect ---

/**
 * Side effect that runs automatically when signals change
 *
 * @param fn - Effect function (can return a cleanup function)
 *
 * @example
 * const [count, setCount] = createSignal(0)
 * createEffect(() => {
 *   console.log("count changed:", count())
 * })
 * setCount(1)  // Logs "count changed: 1"
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
  effectDepth++
  if (effectDepth > MAX_EFFECT_RUNS) {
    effectDepth = 0
    throw new Error(`Effect exceeded maximum run limit (${MAX_EFFECT_RUNS}). Possible circular dependency.`)
  }

  if (effect.cleanup) {
    effect.cleanup()
    effect.cleanup = null
  }

  for (const dep of effect.dependencies) {
    dep.delete(effect)
  }
  effect.dependencies.clear()

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

/**
 * Register cleanup function for effects
 *
 * @param fn - Cleanup function
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

// --- createMemo ---

/**
 * Create a memoized computed value
 *
 * A derived signal that:
 * - Tracks dependencies automatically (like createEffect)
 * - Caches the computed result
 * - Acts as a read-only signal (can be used as dependency by other effects/memos)
 *
 * @param fn - Computation function that returns a value
 * @returns Getter function for the memoized value
 *
 * @example
 * const [count, setCount] = createSignal(2)
 * const doubled = createMemo(() => count() * 2)
 * doubled()    // 4
 * setCount(5)
 * doubled()    // 10
 */
export function createMemo<T>(fn: () => T): Memo<T> {
  const [value, setValue] = createSignal<T>(undefined as T)
  let initialized = false

  createEffect(() => {
    const result = fn()
    if (initialized) {
      setValue(result)
    } else {
      initialized = true
      setValue(result)
    }
  })

  return value
}

