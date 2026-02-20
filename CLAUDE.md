# BarefootJS

JSX → Marked Template + client JS compiler. Signal-based reactivity for any backend.

## Project Setup / Tech Stack

This project primarily uses TypeScript with Go template adapters. Use `bun` instead of `npm` for package management. For CSS, use UnoCSS — note that UnoCSS alpha modifiers do not work with CSS variables, and files must be explicitly included in UnoCSS scanning config.

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
- `site/core/` — Main site: landing page + documentation (Hono + Cloudflare Workers)
  - `site/core/landing/` — Landing page components and routes
- `site/ui/` — UI component documentation site (Hono + Cloudflare Workers)
- `site/shared/` — Shared design tokens and components across sites
- `docs/core/` — Documentation content (Markdown source files)

## Testing

| Layer | Verifies | Tool | Speed |
|-------|----------|------|-------|
| IR test (`@barefootjs/test`) | Structure, a11y, signals, compiler errors | `bun test` | ms |
| Compiler unit test (`packages/jsx/`) | IR generation, adapter output, error codes | `bun test` | ms |
| E2E (`site/ui/e2e/`) | User interactions, hydration, visual rendering | Playwright | seconds |

- **New UI component**: Write IR test in `packages/test/__tests__/` using `renderToTest()`.
- **Compiler change**: Write unit test in `packages/jsx/src/__tests__/`.
- **Interaction behavior**: Write E2E in `site/ui/e2e/` only for click/keyboard/hover that IR tests cannot cover.
- **Hydration correctness** is a compiler invariant. If E2E reveals a hydration bug, fix it in `packages/jsx/`, not in `ui/`.

## Component Development Workflow

When building or modifying UI components, use the `barefoot` CLI first for component discovery.

1. `bun run barefoot search <query>` — Find components by name/category/tags
2. `bun run barefoot show <component>` — Get props, examples, accessibility info
3. Implement the component
4. `bun run barefoot test:template <name>` — Generate IR test from source
5. `bun test <path>` — Run and verify

## Implementation Guidelines

When implementing a feature, match the capability level of existing similar features. For example, if filter() supports arbitrary predicates, find() should too. Always check sibling implementations for parity.

## Specs

- `spec/compiler.md` — Compiler spec: pipeline architecture, IR schema, transformation rules, adapter interface, error codes

## Git Commit (Claude Code Web)

When `CLAUDE_CODE_ENTRYPOINT=remote`, append `Co-authored-by` as the **last line** of every commit message (GitHub requires it to be last to recognize it).

Before the first commit, run `git log --format='%an <%ae>' | grep -v '^Claude ' | sort -u` and let the user pick via `AskUserQuestion`. Remember the choice for the session.
