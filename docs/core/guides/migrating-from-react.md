# Migrating from React

This guide covers the key differences between React and BarefootJS, and provides a step-by-step migration path for converting React components.

## Mental Model Shift

| Concept | React | BarefootJS |
|---------|-------|-----------|
| Rendering | Client-side (or SSR + full hydration) | Server-rendered + targeted hydration |
| State | `useState` — triggers re-render | `createSignal` — updates only dependent elements |
| Derived state | `useMemo` with deps array | `createMemo` with auto-tracking |
| Side effects | `useEffect` with deps array | `createEffect` with auto-tracking |
| Props | Direct access, safe to destructure | Getter-based, destructuring captures once |
| Components | Re-execute on every render | Execute once, signals handle updates |

The biggest shift: **React re-runs your component function on every state change. BarefootJS runs it once — signals handle subsequent updates.**

---

## State: `useState` → `createSignal`

### React

```tsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### BarefootJS

```tsx
"use client"
import { createSignal } from '@barefootjs/dom'

function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

**Key differences:**
- Add `"use client"` directive
- `count` becomes `count()` — signals are getter functions
- Updater function `n => n + 1` is preferred (no stale closure issues)

---

## Derived State: `useMemo` → `createMemo`

### React

```tsx
const doubled = useMemo(() => count * 2, [count])
```

### BarefootJS

```tsx
const doubled = createMemo(() => count() * 2)
```

No dependency array — BarefootJS tracks which signals are read inside the memo automatically.

---

## Effects: `useEffect` → `createEffect`

### React

```tsx
useEffect(() => {
  document.title = `Count: ${count}`
}, [count])

useEffect(() => {
  const handler = () => { ... }
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, [])
```

### BarefootJS

```tsx
createEffect(() => {
  document.title = `Count: ${count()}`
})

onMount(() => {
  const handler = () => { ... }
  window.addEventListener('resize', handler)
  onCleanup(() => window.removeEventListener('resize', handler))
})
```

**Key differences:**
- No dependency array — auto-tracked
- `useEffect(() => ..., [])` (mount-only) becomes `onMount()`
- Cleanup returned from `useEffect` becomes `onCleanup()` inside effects or `onMount`

---

## Props: Destructuring Differences

### React — Safe to Destructure

```tsx
function Greeting({ name, greeting = 'Hello' }) {
  return <h1>{greeting}, {name}!</h1>
}
```

### BarefootJS — Use `props.xxx` for Reactivity

```tsx
// ✅ Reactive — re-evaluates when parent updates props
function Greeting(props: Props) {
  return <h1>{props.greeting ?? 'Hello'}, {props.name}!</h1>
}

// ⚠️ Destructured — value captured once (OK for static props)
// @bf-ignore props-destructuring
function Greeting({ name, greeting = 'Hello' }: Props) {
  return <h1>{greeting}, {name}!</h1>
}
```

**When is destructuring OK?**
- Props used as initial values for signals: `const [count, setCount] = createSignal(initialCount)`
- Props that never change after mount (e.g., `id`, `className`)

See [Props Reactivity](../reactivity/props-reactivity.md) for details.

---

## Conditional Rendering

### React

```tsx
{isOpen && <Panel />}
{status === 'loading' ? <Spinner /> : <Content />}
```

### BarefootJS

Same JSX syntax — no changes needed:

```tsx
{isOpen() && <Panel />}
{status() === 'loading' ? <Spinner /> : <Content />}
```

The compiler generates DOM-switching code for conditionals (no virtual DOM diffing).

---

## Lists

### React

```tsx
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

### BarefootJS

```tsx
{items().map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

Nearly identical — just call the signal getter `items()`. The compiler generates `reconcileList` for key-based DOM reconciliation.

---

## Context

### React

```tsx
const ThemeContext = createContext('light')

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  )
}

function Child() {
  const theme = useContext(ThemeContext)
  return <div class={theme}>...</div>
}
```

### BarefootJS

```tsx
import { createContext, useContext, provideContext } from '@barefootjs/dom'

const ThemeContext = createContext<string>('light')

function App() {
  provideContext(ThemeContext, 'dark')
  return <Child />
}

function Child() {
  const theme = useContext(ThemeContext)
  return <div class={theme}>...</div>
}
```

**Key difference:** `provideContext()` is a function call instead of a JSX wrapper component. The context value is set before child components initialize.

---

## Refs

### React

```tsx
const inputRef = useRef<HTMLInputElement>(null)
useEffect(() => {
  inputRef.current?.focus()
}, [])
```

### BarefootJS

```tsx
let inputEl: HTMLInputElement
const inputRef = (el: HTMLInputElement) => { inputEl = el }

onMount(() => {
  inputEl.focus()
})
```

```tsx
<input ref={inputRef} />
```

Refs in BarefootJS are **callback refs** — the function receives the element when it's found during hydration.

---

## Common Patterns

### Fetching Data

React:
```tsx
const [data, setData] = useState(null)
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData)
}, [])
```

BarefootJS:
```tsx
const [data, setData] = createSignal(null)
onMount(async () => {
  const res = await fetch('/api/data')
  setData(await res.json())
})
```

> **Note:** In BarefootJS, initial data is typically loaded on the server and passed as props. Client-side fetching is for dynamic updates after hydration.

### Event Handlers

React:
```tsx
<input onChange={(e) => setValue(e.target.value)} />
```

BarefootJS:
```tsx
<input onInput={(e) => setValue(e.target.value)} />
```

> **Note:** BarefootJS uses native DOM events. `onInput` fires on every keystroke; `onChange` fires on blur. For real-time text input, prefer `onInput`.

---

## Migration Checklist

1. [ ] Add `"use client"` to files with reactive state
2. [ ] `useState(x)` → `createSignal(x)`
3. [ ] Access state as `count()` instead of `count`
4. [ ] `useMemo(() => x, [deps])` → `createMemo(() => x)` (no deps array)
5. [ ] `useEffect(() => x, [deps])` → `createEffect(() => x)` (no deps array)
6. [ ] `useEffect(() => x, [])` → `onMount(() => x)`
7. [ ] Cleanup: return in `useEffect` → `onCleanup()` inside effect
8. [ ] `useRef` → callback ref
9. [ ] Avoid destructuring reactive props (use `props.xxx`)
10. [ ] `useContext` → `useContext` (same name, different import)
11. [ ] `Context.Provider` → `provideContext()` function call
12. [ ] `onChange` on inputs → `onInput` for real-time updates
