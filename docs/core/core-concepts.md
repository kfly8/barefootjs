---
title: Core Concepts
description: Two-phase compilation, signal-based reactivity, and the hydration model
---

# Core Concepts

BarefootJS has three key ideas: a two-phase compiler, signal-based reactivity, and marker-driven hydration. This page explains how they fit together.


## Two-Phase Compilation

The compiler transforms a single JSX source file into two separate outputs:

```
JSX Source
    ↓
[Phase 1] Analyze + Transform → IR (Intermediate Representation)
    ↓
[Phase 2a] IR → Marked Template  (server)
[Phase 2b] IR → Client JS        (browser)
```

**Phase 1** parses the JSX once and produces a JSON IR tree. The IR captures the component structure, reactive expressions, event handlers, and type information — independent of any backend.

**Phase 2** takes the IR and generates two outputs:

- **Marked Template** — An HTML template for your server, with `bf-*` attributes marking interactive elements. The adapter determines the output format.
- **Client JS** — A minimal script that creates signals, wires up effects, and binds event handlers to the marked elements.

### Example

Given this source:

```tsx
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter({ initial = 0 }) {
  const [count, setCount] = createSignal(initial)

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
    </div>
  )
}
```

Phase 1 produces an IR that records:
- A signal `count` with setter `setCount` and initial value `initial`
- A reactive expression `count()` at `slot_0`
- A click handler on the button at `slot_1`

Phase 2a produces a server template:

<!-- tabs:adapter -->
<!-- tab:Hono -->
```tsx
export function Counter(props) {
  return (
    <div bf-s="Counter">
      <p bf="slot_0">{props.initial ?? 0}</p>
      <button bf="slot_1">+1</button>
    </div>
  )
}
```
<!-- tab:Go Template -->
```go-template
{{define "Counter"}}
<div bf-s="{{.ScopeID}}">
  <p bf="slot_0">{{.Initial}}</p>
  <button bf="slot_1">+1</button>
</div>
{{end}}
```
<!-- /tabs -->

Phase 2b produces client JS:

```js
import { createSignal, createEffect, find, bind } from '@barefootjs/dom'

export function init(props) {
  const [count, setCount] = createSignal(props.initial ?? 0)

  const _slot_0 = find('[bf="slot_0"]')
  createEffect(() => { _slot_0.textContent = String(count()) })

  bind('[bf="slot_1"]', 'click', () => setCount(n => n + 1))
}
```

The server renders the HTML. The browser runs only the client JS to make it interactive.

### Adapters

The IR is backend-agnostic. An **adapter** converts it to the template format your server needs:

| Adapter | Output | Backend |
|---------|--------|---------|
| `HonoAdapter` | `.hono.tsx` | Hono / JSX-based servers |
| `GoTemplateAdapter` | `.tmpl` + `_types.go` | Go `html/template` |

The same JSX source produces correct output for each adapter. See [Adapters](./adapters.md) for details.


## Signal-Based Reactivity

BarefootJS uses fine-grained reactivity inspired by SolidJS. The core primitives are **signals**, **effects**, and **memos**.

### Signals

A signal holds a reactive value. It returns a getter/setter pair:

```tsx
const [count, setCount] = createSignal(0)

count()              // Read: returns 0
setCount(5)          // Write: set to 5
setCount(n => n + 1) // Write: updater function
```

The getter is a **function call** — `count()`, not `count`. This is how the reactivity system tracks which effects depend on which signals.

### Effects

An effect runs a function whenever its signal dependencies change:

```tsx
createEffect(() => {
  console.log('Count is:', count())
})
```

The first time it runs, the system records that `count` was read. When `count` changes, the effect re-runs automatically. No dependency array is needed.

### Memos

A memo is a cached derived value:

```tsx
const doubled = createMemo(() => count() * 2)

doubled() // Returns the cached result
```

Like effects, memos track dependencies automatically. Unlike effects, they return a value and only recompute when dependencies change.

### How It Works

When a signal getter is called inside an effect, the effect subscribes to that signal. When the setter is called, all subscribed effects re-run. This happens at the **expression level** — only the specific DOM nodes that depend on a signal are updated.

```
setCount(1)
    ↓
Signal notifies subscribers
    ↓
Effect re-runs: _slot_0.textContent = String(count())
    ↓
Only <p> updates. The rest of the DOM is untouched.
```


## Hydration Model

Hydration is the process of making server-rendered HTML interactive. BarefootJS uses a **marker-driven** approach.

### Hydration Markers

The compiler inserts `bf-*` attributes into the server template. These tell the client JS where to attach behavior:

| Marker | Purpose | Example |
|--------|---------|---------|
| `bf-s` | Component scope boundary (`~` prefix = child) | `<div bf-s="Counter_a1b2">`, `<div bf-s="~Item_c3d4">` |
| `bf` | Interactive element (slot) | `<p bf="s0">` |
| `bf-h` | Hydration guard (runtime-only, prevents double hydration) | `<div bf-s="Counter_a1b2" bf-h>` |
| `bf-p` | Serialized props JSON | `<div bf-p='{"initial":5}'>` |
| `bf-c` | Conditional block | `<div bf-c="s2">` |
| `bf-po` | Portal owner scope ID | `<div bf-po="Dialog_a1b2">` |
| `bf-pi` | Portal container ID | `<div bf-pi="bf-portal-1">` |
| `bf-pp` | Portal placeholder | `<template bf-pp="bf-portal-1">` |
| `bf-i` | List item marker | `<li bf-i>` |

### Hydration Flow

1. The server renders HTML with markers and embeds component props in `bf-p` attributes
2. The browser loads the client JS
3. `hydrate()` finds all `bf-s` elements without `bf-h` (uninitialized)
4. For each scope, the init function runs — creating signals, binding effects, attaching event handlers
5. The runtime sets `bf-h` on the scope element to prevent double initialization
6. The page is now interactive

```
Server HTML (static)
    ↓
Client JS loads
    ↓
hydrate("Counter", init)
    ↓
Find <div bf-s="Counter_a1b2"> without bf-h
    ↓
Read props from bf-p attribute
    ↓
Run init(): createSignal, createEffect, bind events
    ↓
Set bf-h on scope element (mark as initialized)
    ↓
Page is interactive
```

### Scoped Queries

Each component only hydrates its own elements. The runtime's `find()` function searches within a scope boundary, excluding nested component scopes. This prevents components from interfering with each other.

```html
<div bf-s="TodoApp_x1">        <!-- TodoApp scope -->
  <h1 bf="slot_0">Todo</h1>        <!-- belongs to TodoApp -->
  <div bf-s="~TodoItem_y1">     <!-- TodoItem scope (~ = child, excluded from TodoApp queries) -->
    <span bf="slot_0">Buy milk</span>
  </div>
</div>
```

When TodoApp's init calls `find(scope, '[bf="slot_0"]')`, it finds the `<h1>`, not the `<span>` inside TodoItem.


## The `"use client"` Directive

Components that use reactive primitives (`createSignal`, `createEffect`, etc.) must include the `"use client"` directive at the top of the file:

```tsx
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)
  // ...
}
```

This tells the compiler:

- **Generate client JS** for this component
- **Add hydration markers** to the server template
- **Validate** that reactive APIs are only used in client components

Without the directive, the compiler produces a server-only template with no client JS. A component without `"use client"` that tries to use `createSignal` will get an error:

```
error[BF001]: 'use client' directive required for components with createSignal

  --> src/components/Counter.tsx:3:1
   |
 3 | import { createSignal } from '@barefootjs/dom'
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = help: Add "use client" at the top of the file
```

### Security Boundary

`"use client"` marks a **security boundary**. Code in a client component is compiled into JavaScript that runs in the browser — meaning it is **visible to the user**. Never include secrets, database access, or other sensitive logic in a `"use client"` file.

```tsx
// server-only.tsx — NO "use client"
// This code stays on the server. Safe for secrets.
export function UserList() {
  const users = db.query('SELECT * FROM users')
  return (
    <ul>
      {users.map(u => <li>{u.name}</li>)}
    </ul>
  )
}
```

```tsx
// counter.tsx — "use client"
// This code ships to the browser. No secrets here.
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

### Server and Client Component Composition

Server components and client components have a clear composition rule:

- **Server component → Client component**: A server component can render a client component as a child. The server renders the HTML with hydration markers, and the client JS takes over in the browser.
- **Client component → Client component**: A client component can render other client components.
- **Client component → Server component**: Not allowed. A client component cannot import and render a server-only component, because server-only code does not exist on the client.

```tsx
// Page.tsx — server component
// ✅ Can use client components as children
import { Counter } from './Counter'    // "use client"
import { UserList } from './UserList'  // server-only

export function Page() {
  return (
    <div>
      <UserList />   {/* ✅ Server → Server */}
      <Counter />    {/* ✅ Server → Client */}
    </div>
  )
}
```

```tsx
// Dashboard.tsx — "use client"
import { Counter } from './Counter'    // ✅ Client → Client
import { UserList } from './UserList'  // ❌ Client → Server (error)
```

Think of `"use client"` as a one-way gate: once you cross into client territory, everything below must also be a client component.
