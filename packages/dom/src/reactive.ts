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

// --- reconcileList ---

/**
 * Efficient key-based list reconciliation
 *
 * Updates a list container by reusing existing DOM elements when possible,
 * based on the data-key attribute.
 *
 * @param container - The container element holding the list items
 * @param items - The new array of items to render
 * @param renderFn - Function to render an item to HTML string
 * @param getKey - Function to extract unique key from item
 *
 * @example
 * const [todos, setTodos] = createSignal([{ id: 1, text: 'Buy milk' }])
 * createEffect(() => {
 *   reconcileList(
 *     listEl,
 *     todos(),
 *     (todo, i) => `<li data-key="${todo.id}">${todo.text}</li>`,
 *     todo => todo.id
 *   )
 * })
 */
export function reconcileList<T>(
  container: HTMLElement,
  items: T[],
  renderFn: (item: T, index: number) => string,
  getKey: (item: T) => string | number
): void {
  const newKeys = items.map(getKey)
  const existingElements = Array.from(container.children) as HTMLElement[]
  const existingMap = new Map<string | number, HTMLElement>()

  // Build map of existing elements by key
  existingElements.forEach(el => {
    const key = el.dataset.key
    if (key !== undefined) {
      const numKey = Number(key)
      existingMap.set(Number.isNaN(numKey) ? key : numKey, el)
    }
  })

  // Build new list
  const fragment = document.createDocumentFragment()
  items.forEach((item, index) => {
    const key = newKeys[index]
    const existing = existingMap.get(key)

    if (existing) {
      const newHtml = renderFn(item, index)
      const temp = document.createElement('div')
      temp.innerHTML = newHtml
      const newElement = temp.firstChild as HTMLElement

      if (newElement) {
        if (existing.isEqualNode(newElement)) {
          fragment.appendChild(existing)
        } else {
          fragment.appendChild(newElement)
        }
      } else {
        fragment.appendChild(existing)
      }
      existingMap.delete(key)
    } else {
      const newHtml = renderFn(item, index)
      const temp = document.createElement('div')
      temp.innerHTML = newHtml
      const newElement = temp.firstChild as HTMLElement
      if (newElement) {
        fragment.appendChild(newElement)
      }
    }
  })

  container.innerHTML = ''
  container.appendChild(fragment)
}
