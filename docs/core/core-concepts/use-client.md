---
title: '"use client" Directive'
description: Marking components for client-side interactivity
---

# The `"use client"` Directive

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
- **Add hydration markers** to the marked template
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

## Security Boundary

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

## Server and Client Component Composition

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
