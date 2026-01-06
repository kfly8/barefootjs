# BarefootJS

A JSX compiler that generates server-side JSX and client-side JavaScript from JSX components.
Uses a signal-based reactive system similar to SolidJS, generating minimal client JS only for interactive parts.

This project use Bun.

## Terminology

### Marked JSX

BarefootJS compiles JSX components into two outputs:

1. **Marked JSX** - Server-side JSX with hydration markers (`data-bf-scope`, `data-bf`, `data-bf-cond`, etc.)
2. **Client JS** - Minimal JavaScript that hydrates interactive parts

The "markers" are data attributes that allow the client JS to find and update specific DOM elements without virtual DOM diffing.

## Directory Structure

```
packages/
├── jsx/           # JSX compiler core (compileJSX function)
│   ├── extractors/    # Extract metadata from AST (signals, memos, imports, props, etc.)
│   ├── transformers/  # JSX → IR → Marked JSX / Client JS
│   ├── adapters/      # Output adapters (testing)
│   └── compiler/      # Code generation utilities
├── dom/           # Reactive primitives (createSignal, createEffect, createMemo)
└── hono/          # Hono framework integration (server adapter, jsx-runtime)
examples/
└── hono/          # Sample components (Counter, TodoApp, etc.)
```

## Development Workflow

### After modifying packages

When you modify source files in `packages/`, you MUST rebuild the packages before testing `examples/`:

```bash
# Rebuild packages (in dependency order)
cd packages/jsx && bun run build
cd packages/hono && bun run build

# Then rebuild examples
cd examples/hono && bun run build
```

**Why?** Each package exports from `dist/` (built files), not `src/`. Without rebuilding, examples will use stale code.

### Testing

1. **Unit tests**: Run `bun test packages/jsx` to verify compiler changes
2. **Package rebuild**: Rebuild affected packages
3. **Example rebuild**: Rebuild examples to verify integration
4. **E2E tests (Playwright)**: Run automated browser tests

```bash
# Run examples/hono E2E tests (Counter, Toggle, FizzBuzz, TodoApp)
cd examples/hono && bun run test:e2e

# Run ui E2E tests (Button documentation, Home page)
cd ui && bun run test:e2e

# UI mode for debugging
bun run test:e2e:ui

# Run specific test
bunx playwright test -g "adds a new todo"
```

**Important**: Unit tests alone are not sufficient. E2E tests verify client-side JavaScript behavior including hydration, event handling, and DOM manipulation in an actual browser.

### Updating Specification

When adding or modifying compiler features:

1. Update `spec/spec.tsv` with the new specification entry
2. Add E2E test to `packages/jsx/__tests__/spec/` with spec ID comment (e.g., `// JSX-001: Plain text preserved`)

See [SPEC.md](SPEC.md) for specification format details.

## Important Guidelines

### UI Components Must NOT Depend on Hono

**CRITICAL**: Components in `ui/components/` must be framework-agnostic.

- ❌ **NEVER** import from `@barefootjs/hono` or `hono/*` in UI components
- ✅ Import types from `@barefootjs/jsx`
- ✅ Import runtime from `@barefootjs/dom`

```typescript
// ❌ WRONG - creates Hono dependency
import type { ButtonHTMLAttributes } from '@barefootjs/hono/jsx/jsx-runtime'

// ✅ CORRECT - framework-agnostic
import type { ButtonHTMLAttributes } from '@barefootjs/jsx'
```

The `ui/` components are meant to be reusable across different frameworks. Hono integration belongs only in `packages/hono/`.

### Trust the Compiler - No Workarounds

When encountering compiler issues:

1. **Do NOT add workarounds** in component code (e.g., `typeof fn === 'function'` checks)
2. **Investigate the root cause** in `packages/jsx/src/compiler/`
3. **Fix the compiler** or create an issue if the fix is complex
4. **Write a test** to prevent regression

The compiler should generate correct code. If it doesn't, that's a bug to fix, not work around.

```typescript
// ❌ WRONG - workaround for compiler bug
const buttonClass = typeof buttonVariants === 'function'
  ? buttonVariants({ variant, size, className })
  : ''  // Workaround!

// ✅ CORRECT - trust the compiler, fix bugs in compiler
const buttonClass = buttonVariants({ variant, size, className })
```
