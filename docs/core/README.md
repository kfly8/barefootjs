# BarefootJS Documentation

## Table of Contents

### 1. [Introduction](./introduction.md)

- What is BarefootJS?
- Why BarefootJS?
- Design Philosophy

### 2. Getting Started

- Installation
- Quick Start (5-minute tutorial)
- Project Structure

### 3. [Core Concepts](./core-concepts.md)

- Two-Phase Compilation
- Signal-Based Reactivity
- Hydration Model
- The `"use client"` Directive

### 4. [Reactivity](./reactivity.md)

- [`createSignal`](./reactivity/create-signal.md) — Create a reactive value
- [`createEffect`](./reactivity/create-effect.md) — Run side effects when dependencies change
- [`createMemo`](./reactivity/create-memo.md) — Create a cached derived value
- [`onMount`](./reactivity/on-mount.md) — Run once on component initialization
- [`onCleanup`](./reactivity/on-cleanup.md) — Register cleanup for effects and lifecycle
- [`untrack`](./reactivity/untrack.md) — Read signals without tracking dependencies
- [Props Reactivity](./reactivity/props-reactivity.md) — Gotchas with destructuring

### 5. [Templates & Rendering](./rendering.md)

- [JSX Compatibility](./rendering/jsx-compatibility.md) — What works, what doesn't, and what differs
- [Fragment](./rendering/fragment.md) — Fragment support and hydration behavior
- [`/* @client */` Directive](./rendering/client-directive.md) — Skip server evaluation for client-only expressions

### 6. [Components](./components.md)

- [Component Authoring](./components/component-authoring.md) — Server components, client components, and the compilation model
- [Props & Type Safety](./components/props-type-safety.md) — Typing props, defaults, and rest spreading
- [Children & Slots](./components/children-slots.md) — Children prop, the `Slot` component, and the `asChild` pattern
- [Context API](./components/context-api.md) — Sharing state with `createContext` / `useContext`
- [Portals](./components/portals.md) — Rendering elements outside their parent DOM hierarchy

### 7. [Adapters](./adapters.md)

- [Adapter Architecture](./adapters/adapter-architecture.md) — How adapters work, the `TemplateAdapter` interface, and the IR contract
- [Hono Adapter](./adapters/hono-adapter.md) — Configuration and output format for Hono / JSX-based servers
- [Go Template Adapter](./adapters/go-template-adapter.md) — Configuration and output format for Go `html/template`
- [Writing a Custom Adapter](./adapters/custom-adapter.md) — Step-by-step guide to implementing your own adapter

### 8. [UI Components](./ui-components.md)

- Architecture & Design Philosophy
- Installation (`barefoot add`)
- Component Patterns (`asChild`, Controlled/Uncontrolled)
- Theming & Customization
- Component API & Demos → [ui.barefootjs.dev](https://ui.barefootjs.dev)

### 9. [Advanced](./advanced.md)

- [IR Schema Reference](./advanced/ir-schema.md) — Node types, metadata, hydration markers
- [Compiler Internals](./advanced/compiler-internals.md) — Pipeline phases, reactivity analysis, code generation
- [Error Codes Reference](./advanced/error-codes.md) — All BF001–BF043 errors with solutions
- [Performance Optimization](./advanced/performance.md) — Minimal client JS, fast hydration, efficient reactivity

### 10. [Guides](./guides.md)

- [Migrating from React](./guides/migrating-from-react.md) — Key differences and step-by-step migration
- [Using with Go Backend](./guides/go-backend.md) — Go `html/template` integration
- [Deploying to Cloudflare Workers](./guides/cloudflare-workers.md) — Hono on the edge
- [Building a Todo App](./guides/todo-app.md) — End-to-end tutorial

---

## Documentation Conventions

Throughout this documentation, code examples use **switchable tabs** for the following:

**Adapter** — Examples show output for your selected adapter:

<!-- tabs:adapter -->
- Hono (default)
- Go Template

**Package Manager** — Install commands match your toolchain:

<!-- tabs:pm -->
- npm (default)
- bun
- pnpm
- yarn

These preferences persist across pages.

> **Note for non-JavaScript developers:**
> Sections marked with 💡 provide brief explanations of JSX and TypeScript concepts for developers coming from Go, Python, or other backend languages.
