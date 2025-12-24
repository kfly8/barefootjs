/**
 * BarefootJS - Reactive Primitives
 *
 * createSignal: Reactive primitive that holds state and tracks changes
 * createEffect: Side effect that runs automatically when signals change
 * onCleanup: Register cleanup function for effects
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
 * createSignal - Create a reactive value
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
    // If there's a currently running effect, register dependency on this signal
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

    // Skip if value hasn't changed
    if (Object.is(value, newValue)) {
      return
    }

    value = newValue

    // Re-run all dependent effects
    const effectsToRun = [...subscribers]
    for (const effect of effectsToRun) {
      runEffect(effect)
    }
  }

  return [get, set]
}

// --- createEffect ---

/**
 * createEffect - Side effect that runs automatically when signals change
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
  // Check for circular dependency
  effectDepth++
  if (effectDepth > MAX_EFFECT_RUNS) {
    effectDepth = 0
    throw new Error(`Effect exceeded maximum run limit (${MAX_EFFECT_RUNS}). Possible circular dependency.`)
  }

  // Run previous cleanup
  if (effect.cleanup) {
    effect.cleanup()
    effect.cleanup = null
  }

  // Clear previous dependencies
  for (const dep of effect.dependencies) {
    dep.delete(effect)
  }
  effect.dependencies.clear()

  // Run effect and collect new dependencies
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
 * onCleanup - Register cleanup function for effects
 *
 * When called inside an effect, the cleanup function will be called
 * before the next effect run or when the effect is disposed.
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
 * reconcileList - Efficient key-based list updates
 *
 * Updates a list container by reusing existing DOM elements when possible,
 * based on the key attribute. This is more efficient than innerHTML for
 * lists where items are added, removed, or reordered.
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
      // Try to preserve original type (number vs string)
      const numKey = Number(key)
      existingMap.set(Number.isNaN(numKey) ? key : numKey, el)
    }
  })

  // Build new list
  // Note: Event delegation on the container is not affected by element replacement
  const fragment = document.createDocumentFragment()
  items.forEach((item, index) => {
    const key = newKeys[index]
    const existing = existingMap.get(key)

    if (existing) {
      // Existing element found - render new HTML and compare
      const newHtml = renderFn(item, index)
      const temp = document.createElement('div')
      temp.innerHTML = newHtml
      const newElement = temp.firstChild as HTMLElement

      if (newElement) {
        // Use isEqualNode for robust DOM structure comparison
        // (unlike outerHTML, this is not affected by attribute ordering)
        if (existing.isEqualNode(newElement)) {
          // Content unchanged, reuse existing element (preserves DOM state)
          fragment.appendChild(existing)
        } else {
          // Content changed, replace with new element
          fragment.appendChild(newElement)
        }
      }
      existingMap.delete(key)
    } else {
      // No existing element - render and create new
      const newHtml = renderFn(item, index)
      const temp = document.createElement('div')
      temp.innerHTML = newHtml
      const newElement = temp.firstChild as HTMLElement
      if (newElement) {
        fragment.appendChild(newElement)
      }
    }
  })

  // Clear container and append new list
  container.innerHTML = ''
  container.appendChild(fragment)
}
