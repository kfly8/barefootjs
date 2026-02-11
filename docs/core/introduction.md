---
title: Introduction
description: What is BarefootJS, why it exists, and its design philosophy
---

# Introduction

## What is BarefootJS?

BarefootJS is a compiler that transforms JSX components into server-rendered templates and minimal client-side JavaScript.

Write familiar JSX with fine-grained reactivity — the compiler splits it into a **server template** for your backend and a **tiny hydration script** for the browser.

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

This single file compiles into two outputs:

<!-- tabs:adapter -->
<!-- tab:Hono -->
**Server template** — Renders static HTML with hydration markers:

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
**Server template** — Go `html/template` with hydration markers:

```go-template
{{define "Counter"}}
<div bf-s="{{.ScopeID}}">
  <p bf="slot_0">{{.Initial}}</p>
  <button bf="slot_1">+1</button>
</div>
{{end}}
```

<!-- /tabs -->

**Client script** — Wires up only the interactive parts:

```js
import { createSignal, createEffect, find, bind } from '@barefootjs/dom'

export function hydrate(props) {
  const [count, setCount] = createSignal(props.initial ?? 0)

  const el = find('[bf="slot_0"]')
  createEffect(() => { el.textContent = String(count()) })

  bind('[bf="slot_1"]', 'click', () => setCount(n => n + 1))
}
```

No framework runtime. No virtual DOM. Just the minimum JavaScript needed for interactivity.


## Why BarefootJS?

### The Problem

Modern frontend frameworks ship large JavaScript runtimes to the browser, even when most of the page is static content. Server-side rendering helps with initial load, but hydration still requires downloading and executing the full framework.

If your backend is Go, Python, or Perl, the gap is wider: you either maintain separate template and JavaScript codebases, or adopt a JavaScript-only stack.

### The BarefootJS Approach

BarefootJS compiles JSX into **native templates for your backend** and **minimal client JS** — bridging server rendering and client interactivity without a runtime.

- **Backend agnostic** — The same JSX source produces templates for any backend (Go, TypeScript, etc.)
- **Fine-grained reactivity** — Signals track dependencies at the expression level, updating only the affected DOM nodes
- **Minimal client JS** — Each component ships only the JavaScript it needs, not a framework runtime
- **Full type safety** — TypeScript types flow through the entire compilation pipeline


## Design Philosophy

**1. Compile, don't ship a runtime.**
The compiler does the heavy lifting at build time. The browser receives only the JavaScript it needs — no framework, no virtual DOM diffing.

**2. Backend agnostic.**
The same JSX source produces templates for Hono, Go `html/template`, and any future adapter. Your component library works across stacks.

**3. Fine-grained reactivity.**
Inspired by SolidJS, signals track dependencies at the expression level. When state changes, only the affected DOM nodes update — not the entire component tree.

**4. Progressive enhancement.**
Server-rendered HTML works without JavaScript. Client scripts enhance the page with interactivity. If JavaScript fails to load, users still see content.

**5. Familiar syntax, no lock-in.**
JSX is the authoring format, but the output is standard HTML and vanilla JavaScript. There is no proprietary template language to learn and no framework to migrate away from.


## Who is it for?

- **Full-stack TypeScript developers** who want reactive UI without shipping a framework runtime to the browser
- **Backend teams** (Go, Python, etc.) who need interactive components without adopting a JavaScript-only stack
- **Performance-focused teams** who need minimal client JS with fine-grained DOM updates
