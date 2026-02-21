---
name: barefootjs
description: Build UI components using the barefoot CLI for component discovery, scaffolding, and testing.
---
# Component Development Skill

Build UI components using the `barefoot` CLI for component discovery, scaffolding, and testing.

## Workflow

1. `bun run barefoot search <query>` — Find components by name/category/tags
2. `bun run barefoot docs <component>` — Get props, examples, accessibility info
3. `bun run barefoot scaffold <name> <comp...>` — Generate skeleton + basic IR test
4. Implement the component
5. `bun test <path>` — Verify compilation
6. `bun run barefoot test:template <name>` — Regenerate richer IR test
7. `bun test <path>` — Final verification

## Rules

- Use `barefoot search` and `barefoot docs` for component discovery. Do not read source files to learn component APIs.
- New components go in `ui/components/ui/<name>.tsx`.
- IR tests go in `ui/components/ui/__tests__/<name>.test.ts`.
- Stateful components (using signals) must have `"use client"` as the first line.
- Stateful components must use `props.xxx` (not destructuring) to maintain reactivity.
- Use `createSignal`, `createMemo`, `createEffect` from `@barefootjs/dom` (SolidJS-style, not React hooks).
- Use `for` attribute on `<Label>` (not `htmlFor`).
- Event handlers have typed `e.target` — write `onInput={e => setValue(e.target.value)}` directly. Do not cast with `as HTMLInputElement`.
