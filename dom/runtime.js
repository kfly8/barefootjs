/**
 * BarefootJS Runtime - Browser-compatible minimal runtime
 */

// --- Internal State ---

let currentEffect = null
let effectDepth = 0
const MAX_EFFECT_RUNS = 100

// --- createSignal ---

export function createSignal(initialValue) {
  let value = initialValue
  const subscribers = new Set()

  const get = () => {
    if (currentEffect) {
      subscribers.add(currentEffect)
      currentEffect.dependencies.add(subscribers)
    }
    return value
  }

  const set = (valueOrFn) => {
    const newValue = typeof valueOrFn === 'function' ? valueOrFn(value) : valueOrFn

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

export function createEffect(fn) {
  if (currentEffect !== null) {
    throw new Error('createEffect cannot be nested inside another effect')
  }

  const effect = {
    fn,
    cleanup: null,
    dependencies: new Set(),
  }

  runEffect(effect)
}

function runEffect(effect) {
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

export function onCleanup(fn) {
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
 * Reconcile a list of items with their DOM representation using keys.
 * Reuses existing DOM elements when possible based on data-key attribute.
 *
 * @param {HTMLElement} container - The container element holding the list items
 * @param {Array} items - The new array of items to render
 * @param {Function} renderFn - Function that renders an item to HTML string: (item, index) => string
 * @param {Function} getKey - Function that extracts a unique key from an item: (item) => string | number
 */
export function reconcileList(container, items, renderFn, getKey) {
  const newKeys = items.map(getKey)
  const existingElements = Array.from(container.children)
  const existingMap = new Map()

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
      const newElement = temp.firstChild

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
      const newElement = temp.firstChild
      if (newElement) {
        fragment.appendChild(newElement)
      }
    }
  })

  // Clear container and append new list
  container.innerHTML = ''
  container.appendChild(fragment)
}
