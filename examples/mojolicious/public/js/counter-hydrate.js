/**
 * Counter Component - Hydration wrapper
 *
 * Wraps the generated client JS to support multiple instances.
 */

import { createSignal, createEffect, createMemo, findScope, hydrate } from './barefoot.js'

function initCounter(__props, __instanceIndex = 0, __parentScope = null) {
  const [count, setCount] = createSignal(__props.count ?? 0)
  const doubled = createMemo(() => count() * 2)

  const __scope = findScope('Counter', __instanceIndex, __parentScope)
  if (!__scope) return
  const _0 = __scope
  const _1 = __scope?.nextElementSibling
  const _2 = _1?.nextElementSibling
  const _3 = _2?.nextElementSibling
  const _4 = _3?.nextElementSibling

  createEffect(() => {
    const __textValue = count()
    if (_0) {
      _0.textContent = String(__textValue)
    }
  })
  createEffect(() => {
    const __textValue = "doubled: " + String(doubled())
    if (_1) {
      _1.textContent = String(__textValue)
    }
  })

  if (_2) {
    _2.onclick = () => setCount(n => n + 1)
  }
  if (_3) {
    _3.onclick = () => setCount(n => n - 1)
  }
  if (_4) {
    _4.onclick = () => setCount(0)
  }
}

// Auto-hydration for all Counter instances
hydrate('Counter', initCounter)
