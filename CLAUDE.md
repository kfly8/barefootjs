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
- `site/docs/` — Main site: landing page + documentation (Hono + Cloudflare Workers)
  - `site/docs/landing/` — Landing page components and routes
- `site/ui/` — UI component documentation site (Hono + Cloudflare Workers)
- `site/shared/` — Shared design tokens and components across sites
- `docs/core/` — Documentation content (Markdown source files)

## Specs

- `spec/compiler.md` — Compiler spec: pipeline architecture, IR schema, transformation rules, adapter interface, error codes
