# BarefootJS

A JSX compiler that generates server-side JSX and client-side JavaScript from JSX components.
Uses a signal-based reactive system similar to SolidJS, generating minimal client JS only for interactive parts.

## Directory Structure

```
packages/
├── jsx/           # JSX compiler core (compileJSX function)
│   ├── extractors/    # Extract metadata from AST (signals, memos, imports, props, etc.)
│   ├── transformers/  # JSX → IR → Server JSX / Client JS
│   ├── adapters/      # Output adapters (testing)
│   └── compiler/      # Code generation utilities
├── dom/           # Reactive primitives (createSignal, createEffect, createMemo)
└── hono/          # Hono framework integration (server adapter, jsx-runtime)
examples/
└── hono/          # Sample components (Counter, TodoApp, etc.)
```

## Use Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

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

### Testing changes

1. **Unit tests**: Run `bun test packages/jsx` to verify compiler changes
2. **Package rebuild**: Rebuild affected packages
3. **Example rebuild**: Rebuild examples to verify integration
4. **Browser test (REQUIRED)**: Test in Chrome browser to verify client-side behavior
   - Start server: `cd examples/hono && bun run server.tsx`
   - Test interactive components (click buttons, verify state updates)
   - Test conditional rendering (toggle views, verify correct values)

**Important**: Unit tests alone are not sufficient. Client-side JavaScript must be tested in an actual browser to catch hydration and DOM manipulation issues.

