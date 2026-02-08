# Reactivity

This page covers the full reactivity API. For a conceptual overview, see [Core Concepts](./core-concepts.md#signal-based-reactivity).

All reactive primitives are imported from `@barefootjs/dom`:

```tsx
import { createSignal, createEffect, createMemo, onMount, onCleanup, untrack } from '@barefootjs/dom'
```


## Signals (`createSignal`)

```tsx
const [getter, setter] = createSignal<T>(initialValue: T)
```

Creates a reactive value. Returns a getter/setter pair.

```tsx
const [count, setCount] = createSignal(0)

// Read — call the getter
count() // 0

// Write — pass a value
setCount(5)

// Write — pass an updater function
setCount(n => n + 1) // 6
```

The setter skips updates when the new value is identical to the current value (`Object.is` comparison). No effects are triggered in that case.

```tsx
const [name, setName] = createSignal('Alice')
setName('Alice') // No effect runs — value unchanged
```


## Effects (`createEffect`)

```tsx
createEffect(fn: () => void | (() => void)): void
```

Runs a function immediately and re-runs it whenever any signal read inside it changes.

```tsx
const [count, setCount] = createSignal(0)

createEffect(() => {
  document.title = `Count: ${count()}`
})

setCount(1) // Effect re-runs, title updates to "Count: 1"
```

Dependencies are tracked automatically — every signal getter called during the function's execution is recorded as a dependency.

### Cleanup

If the effect function returns a function, it is called as a cleanup before each re-run:

```tsx
createEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000)
  return () => clearInterval(timer) // Cleanup before re-run
})
```

You can also register cleanup with `onCleanup`:

```tsx
createEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000)
  onCleanup(() => clearInterval(timer))
})
```

`onCleanup` can be called multiple times within an effect. Cleanups execute in reverse order (last registered, first called).


## Memos (`createMemo`)

```tsx
const getter = createMemo<T>(fn: () => T): () => T
```

Creates a cached derived value. Recomputes only when its dependencies change.

```tsx
const [count, setCount] = createSignal(2)
const doubled = createMemo(() => count() * 2)

doubled() // 4
setCount(5)
doubled() // 10
```

Memos are read-only signals — they can be used as dependencies in effects and other memos:

```tsx
const [count, setCount] = createSignal(1)
const doubled = createMemo(() => count() * 2)
const quadrupled = createMemo(() => doubled() * 2)

createEffect(() => {
  console.log(quadrupled()) // Logs 4, then 8 when count becomes 2
})
```


## Lifecycle (`onMount`, `onCleanup`)

### `onMount`

```tsx
onMount(fn: () => void): void
```

Runs once when the component initializes. Signal accesses inside are **not** tracked — the function never re-runs.

```tsx
onMount(() => {
  const hash = window.location.hash
  setFilter(hash === '#/active' ? 'active' : 'all')

  window.addEventListener('hashchange', handleHashChange)
  onCleanup(() => window.removeEventListener('hashchange', handleHashChange))
})
```

`onMount` is equivalent to `createEffect(() => untrack(fn))`.

### `onCleanup`

```tsx
onCleanup(fn: () => void): void
```

Registers a cleanup function in the current reactive context (effect or `onMount`). Called when the effect re-runs or the component is destroyed.

```tsx
createEffect(() => {
  const controller = new AbortController()

  fetch(`/api/items?q=${query()}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setItems)

  onCleanup(() => controller.abort())
})
```


## `untrack`

```tsx
untrack<T>(fn: () => T): T
```

Reads signals without registering them as dependencies.

```tsx
createEffect(() => {
  // count() IS tracked — this effect re-runs when count changes
  console.log('count:', count())

  // name() is NOT tracked — changing name alone won't trigger this effect
  console.log('name:', untrack(() => name()))
})
```


## Props Reactivity

Props in BarefootJS can be reactive — the compiler wraps dynamic expressions in getters. This means **how you access props determines whether updates propagate**.

### Direct access — reactive

```tsx
function Display(props: { value: number }) {
  createEffect(() => {
    console.log(props.value) // Re-runs when parent updates value
  })
  return <span>{props.value}</span>
}
```

### Destructuring — captures once

```tsx
function Display({ value }: { value: number }) {
  createEffect(() => {
    console.log(value) // Stale — captured at component init
  })
  return <span>{value}</span>
}
```

Destructuring calls the getter immediately, capturing the value at that moment. Subsequent updates from the parent are lost.

### When destructuring is fine

Destructuring is safe when you use the value as an **initial value** for local state:

```tsx
function Counter({ initial }: { initial: number }) {
  const [count, setCount] = createSignal(initial) // OK — initial value only
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

### Summary

| Pattern | Reactive? | Use when |
|---------|-----------|----------|
| `props.value` | Yes | You need live updates from parent |
| `const { value } = props` | No | Value is used once (e.g., initial state) |
| `createSignal(props.value)` | `props.value` is reactive, signal is independent | Creating local state from a prop |

### How it works

When a parent passes a dynamic expression, the compiler transforms it into a getter:

```tsx
// Parent
<Child value={count()} />

// Compiled props object
{ get value() { return count() } }
```

Accessing `props.value` calls the getter, which calls `count()`, which registers the dependency. Destructuring `{ value } = props` calls the getter once and stores the result.
