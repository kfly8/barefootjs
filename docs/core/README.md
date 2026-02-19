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

- [Two-Phase Compilation](./core-concepts/compilation.md) — JSX → IR → server template + client JS
- [Signal-Based Reactivity](./core-concepts/reactivity.md) — Fine-grained reactivity with signals, effects, and memos
- [Hydration Model](./core-concepts/hydration.md) — Marker-driven hydration for server-rendered HTML
- [`"use client"` Directive](./core-concepts/use-client.md) — Marking components for client-side interactivity
- [Clean Overrides](./core-concepts/clean-overrides.md) — CSS Cascade Layers for reliable style overrides

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

### 8. [Advanced](./advanced.md)

- [IR Schema Reference](./advanced/ir-schema.md) — Node types, metadata, hydration markers
- [Compiler Internals](./advanced/compiler-internals.md) — Pipeline phases, reactivity analysis, code generation
- [Error Codes Reference](./advanced/error-codes.md) — All BF001–BF043 errors with solutions
- [Performance Optimization](./advanced/performance.md) — Minimal client JS, fast hydration, efficient reactivity

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
