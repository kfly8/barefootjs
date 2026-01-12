import { createSignal, createEffect, createMemo, findScope } from './barefoot.js'

// Counter (wrapped in IIFE for return statement)
;(function() {
const __instanceIndex = 0
const __parentScope = null
const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)

const __scope = findScope('Counter', __instanceIndex, __parentScope)
if (!__scope) return
const _0 = __scope
const _1 = __scope?.nextElementSibling
const _2 = _1?.nextElementSibling
const _3 = _2?.nextElementSibling
const _4 = _3?.nextElementSibling

createEffect(() => {
  const _0 = __scope
  const __textValue = count()
  if (_0) {
    _0.textContent = String(__textValue)
  }
})
createEffect(() => {
  const _1 = __scope?.nextElementSibling
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
})()

