# BarefootJS

JSX → Marked Template + client JS compiler. Signal-based reactivity for any backend.

## Architecture

2-phase compilation: JSX → IR → Marked Template + Client JS
Adapters: HonoAdapter (`packages/hono/`), GoTemplateAdapter (`packages/go-template/`)

## Code Map

- `packages/jsx/src/` — Core compiler
  - `jsx-to-ir.ts` — Phase 1: JSX to IR
  - `ir-to-client-js.ts` — Phase 2: IR to client JS
  - `analyzer.ts` — Reactivity analysis
- `packages/dom/src/` — Client runtime (createSignal, createEffect, etc.)
- `packages/hono/` — Hono/JSX adapter
- `packages/go-template/` — Go html/template adapter
- `ui/` — UI component registry
- `docs/ui/` — Documentation site (Hono + Cloudflare Workers)
- `spec/compiler.md` — Compiler spec (transformation rules, IR schema, error codes)
- `spec/ui.md` — UI component spec
