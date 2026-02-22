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
8. Create stories and run `bun run barefoot story <name>` — Visual preview in browser
9. Ask the user to check `http://localhost:3003` in the browser for visual/interaction verification

## Stories

Stories provide visual preview with full hydration support.

### File location

`ui/components/ui/__stories__/<name>.stories.tsx`

### Format

Each `export function` becomes a separate story. PascalCase names are auto-converted to display titles (e.g., `WithLabel` → "With Label").

```tsx
"use client"

import { ComponentName } from '../component-name'

/** Default usage */
export function Default() {
  return <ComponentName />
}

/** Show a specific variant or state */
export function WithProps() {
  return <ComponentName variant="outline" disabled />
}
```

### Guidelines

- Always include a `Default` story showing basic usage.
- Add stories for key variants, states, and compositions (e.g., `WithLabel`, `Disabled`, `PreFilled`).
- Stories that use signals need `"use client"` at the top.
- Import components via relative path from `../` (e.g., `import { Button } from '../button'`).
- After creating stories, run `bun run barefoot story <name>` and ask the user to verify in the browser.

## Rules

- Use `barefoot search` and `barefoot docs` for component discovery. Do not read source files to learn component APIs.
- New components go in `ui/components/ui/<name>.tsx`.
- IR tests go in `ui/components/ui/__tests__/<name>.test.ts`.
- Stateful components (using signals) must have `"use client"` as the first line.
- Stateful components must use `props.xxx` (not destructuring) to maintain reactivity.
- Use `createSignal`, `createMemo`, `createEffect` from `@barefootjs/dom` (SolidJS-style, not React hooks).
- Use `for` attribute on `<Label>` (not `htmlFor`).
- Event handlers have typed `e.target` — write `onInput={e => setValue(e.target.value)}` directly. Do not cast with `as HTMLInputElement`.
- Use `className` in JSX (not `class`). `class` is a JS reserved keyword.
- Signal getters must be called in JSX: `value={name()}` (not `value={name}`).
