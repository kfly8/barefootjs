---
title: Fine-grained Reactivity
description: Signal-based reactivity with signals, effects, and memos — no virtual DOM needed
---

# Fine-grained Reactivity

In React, changing a single piece of state re-renders the component and its entire subtree. The virtual DOM then diffs the old and new trees to find what actually changed. This works, but it's overhead on every update — even when only one text node needs to change.

BarefootJS takes a different approach. **The compiler statically analyzes which DOM nodes depend on which signals, and wires them together at build time.** When a signal changes, only the exact DOM nodes that use it update. No diffing, no component re-render, no virtual DOM.

This is inspired by [SolidJS](https://www.solidjs.com/). If you're coming from React or Vue, the key difference is: **components run once, not on every state change.**

## Signals and Effects

A **signal** holds a reactive value. An **effect** runs whenever its dependencies change. A **memo** is a cached derived value. No dependency arrays needed — the system tracks reads automatically.

```tsx
const [count, setCount] = createSignal(0)   // signal
const doubled = createMemo(() => count() * 2) // memo (cached)

createEffect(() => {
  console.log('Count is:', count())          // effect (re-runs on change)
})

setCount(1)  // triggers the effect, updates doubled
```

The getter is a **function call** — `count()`, not `count`. This is how the reactivity system tracks which signals each effect depends on.

## Update Flow

**Virtual DOM (React):**
```
setState(1) → re-run component → diff virtual trees → patch DOM
```

**Signals (BarefootJS):**
```
setCount(1) → signal notifies subscribers → effect updates DOM node directly
```

No tree walk. The signal knows exactly which DOM node to update because the compiler wired them together at build time.

For the full API reference, see [Reactivity](../reactivity.md).
