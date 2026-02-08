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

### 4. Reactivity

- Signals (`createSignal`)
- Effects (`createEffect`)
- Memos (`createMemo`)
- Lifecycle (`onMount`, `onCleanup`)
- Props Reactivity — Gotchas

### 5. Templates & Rendering

- JSX Expressions
- Conditional Rendering
- List Rendering
- Event Handling
- Refs

### 6. Components

- Component Authoring
- Props & Type Safety
- Children & Slots
- Context API
- Portals

### 7. Adapters

- Adapter Architecture
- Hono Adapter
- Go Template Adapter
- Writing a Custom Adapter

### 8. UI Components

- Overview & Installation
- Component Catalog (Button, Dialog, Accordion, Tabs, etc.)

### 9. Advanced

- IR Schema Reference
- Compiler Internals
- Error Codes Reference
- Performance Optimization

### 10. Guides

- Migrating from React
- Using with Go Backend
- Deploying to Cloudflare Workers
- Building a Todo App (Tutorial)

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
