# Compiler Internals

This page explains how the BarefootJS compiler transforms JSX source into server templates and client JavaScript. Understanding these internals is useful for debugging compilation issues, writing custom adapters, or contributing to the compiler.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────┐
│  JSX Source (.tsx with "use client")                 │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────┐
│  1. Analyzer (analyzer.ts)                          │
│     Single-pass AST visitor                         │
│     Extracts: signals, memos, effects, props, types │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────┐
│  2. JSX → IR (jsx-to-ir.ts)                         │
│     Transforms JSX AST to IR node tree              │
│     Assigns slotIds, detects reactivity             │
└──────────────────────┬──────────────────────────────┘
                       ↓
          ┌────────────┴────────────┐
          ↓                         ↓
┌─────────┴─────────┐  ┌───────────┴──────────┐
│ 3a. Adapter        │  │ 3b. IR → Client JS   │
│ IR → Template      │  │ ir-to-client-js/     │
│ (e.g., Hono JSX)   │  │ Hydration code       │
└────────────────────┘  └──────────────────────┘
```

## Entry Points

```typescript
// Async — reads files from disk
compileJSX(entryPath: string, readFile: ReadFileFn, options: CompileOptions): Promise<CompileResult>

// Sync — source string input
compileJSXSync(source: string, filePath: string, options: CompileOptions): CompileResult
```

Both support multi-component files — the compiler detects all exported components and compiles each independently, then merges the output.

---

## Phase 1: Analysis

The analyzer (`analyzer.ts`) performs a **single-pass** AST walk using TypeScript's compiler API. It collects everything the later phases need:

### What the Analyzer Extracts

| Category | Data | Example |
|----------|------|---------|
| Signals | getter/setter names, initial value, type | `[count, setCount] = createSignal(0)` |
| Memos | name, computation expression, type | `doubled = createMemo(() => count() * 2)` |
| Effects | effect body | `createEffect(() => { ... })` |
| onMounts | callback body | `onMount(() => { ... })` |
| Props | parameter style, type info, defaults | `(props: ButtonProps)` or `({ label }: Props)` |
| Imports | source, specifiers | `import { createSignal } from '@barefootjs/dom'` |
| Constants | name, value, dependencies | `const baseClass = 'btn'` |
| Functions | name, body, parameters | `function handleClick() { ... }` |
| Types | interfaces, type aliases | `interface ButtonProps { ... }` |
| JSX Return | the return statement's JSX | `return <button>...</button>` |
| Conditional Returns | early returns inside `if` blocks | `if (loading) return <Spinner />` |

### `"use client"` Validation

The analyzer checks for the `"use client"` directive at the top of the file. If the file contains reactive APIs (`createSignal`, `createEffect`, event handlers) but lacks the directive, it emits **BF001**:

```
error[BF001]: 'use client' directive required for components with createSignal
```

### Props Destructuring Detection

When props are destructured in the function parameter, the analyzer emits **BF043** (warning):

```tsx
// ⚠️ BF043: Destructuring captures values once — may lose reactivity
function Child({ count }: Props) { ... }

// ✅ No warning — direct access maintains reactivity
function Child(props: Props) { ... }
```

The warning can be suppressed with `// @bf-ignore props-destructuring`.

---

## Phase 2: JSX → IR

The `jsxToIR` function (`jsx-to-ir.ts`) transforms the analyzed JSX AST into the IR node tree.

### Reactivity Detection

The core decision at this phase is: **is this expression reactive?**

```typescript
function isReactiveExpression(expr: string, ctx: AnalyzerContext): boolean
```

An expression is reactive if it references:
- A signal getter: `count()` — detected by pattern `\bcount\s*\(`
- A memo: `doubled()` — same pattern
- A props reference: `props.value` — detected by `\bprops\.\w+`

Reactive expressions get a `slotId` assigned, which becomes a `data-bf` hydration marker in the output.

### Slot ID Assignment

Elements receive a `slotId` (making them findable during hydration) when they have:

1. Event handlers (`onClick`, `onInput`, etc.)
2. Dynamic children (reactive expressions, loops, conditionals)
3. Reactive attributes (`class={expr()}`, `value={signal()}`)
4. Refs (`ref={callback}`)
5. Component references (always need initialization)

### Filter/Sort Chain Parsing

The compiler parses `.filter()` and `.sort()` chains before `.map()` for server-side evaluation:

```tsx
{todos().filter(t => !t.done).sort((a, b) => a.date - b.date).map(t => (
  <li>{t.name}</li>
))}
```

Simple patterns (e.g., `t => !t.done`, `(a, b) => a.price - b.price`) can be compiled for server-side evaluation. Complex patterns trigger **BF021** with a suggestion to use `/* @client */`. See [Error Codes Reference](./error-codes.md#bf021--unsupported-jsx-pattern) for details.

### Auto Scope Wrapping

If a component's IR root is a Provider (Context.Provider) with no wrapper element, the compiler wraps it in `<div style="display:contents">` to provide a DOM anchor for `findScope()` during hydration.

---

## Phase 3a: Template Generation (Adapter)

Adapters implement the `TemplateAdapter` interface to convert IR nodes into backend-specific templates. See [Adapter Architecture](../adapters/adapter-architecture.md) for the full interface.

Each adapter handles:
- `renderElement()` — HTML elements with hydration markers
- `renderExpression()` — Dynamic values in the target template language
- `renderConditional()` — Template-level conditionals
- `renderLoop()` — Template-level iteration (with filter/sort if supported)
- `renderComponent()` — Child component includes

---

## Phase 3b: Client JS Generation

The `ir-to-client-js` module generates minimal JavaScript for hydration. It operates in several sub-phases:

### 1. Element Collection

Walk the IR tree and categorize elements:

| Category | Description | Example |
|----------|-------------|---------|
| `interactiveElements` | Elements with event handlers | `<button onClick={...}>` |
| `dynamicElements` | Elements with reactive text | `<span>{count()}</span>` |
| `conditionalElements` | Ternary/logical conditionals | `{open() ? <A/> : <B/>}` |
| `loopElements` | Array `.map()` loops | `{items().map(...)}` |
| `refElements` | Elements with ref callbacks | `<input ref={inputRef}>` |
| `reactiveAttrs` | Elements with reactive attributes | `<div class={cls()}>` |
| `clientOnlyElements` | `/* @client */` expressions | Skipped during SSR |

### 2. Dependency Resolution

Constants and functions are sorted by dependency:

```typescript
// "Early" constants — no reactive deps, emitted first
const baseClass = 'btn'
const THRESHOLD = 10

// "Late" constants — reference signals/memos, emitted after signal creation
const displayValue = `Count: ${count()}`
```

### 3. Controlled Signal Detection

The compiler detects when a signal name matches a prop name:

```tsx
function Switch(props: Props) {
  const [checked, setChecked] = createSignal(props.checked ?? false)
  //     ^^^^^^^ matches props.checked
}
```

This generates a sync effect:

```javascript
createEffect(() => {
  if (props.checked !== undefined) setChecked(props.checked)
})
```

### 4. Code Generation Order

The generated `init` function follows this structure:

```javascript
function init(scope, props) {
  // 1. Element references
  const _0 = find(scope, '[data-bf="0"]')

  // 2. Props extraction (with defaults)
  const { label = 'Click' } = props

  // 3. Early constants (no reactive deps)
  const baseClass = 'btn'

  // 4. Signals and memos
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)

  // 5. Controlled signal sync
  createEffect(() => { ... })

  // 6. Local functions / handlers
  function handleClick() { setCount(n => n + 1) }

  // 7. Late constants (reactive deps)

  // 8. Dynamic text updates
  createEffect(() => { _0.textContent = String(count()) })

  // 9. Reactive attribute updates
  createEffect(() => { _1.className = count() > 0 ? 'active' : '' })

  // 10. Conditional updates
  insert(_2, () => isOpen() ? panelHtml : null)

  // 11. Loop updates
  reconcileList(_3, items(), getKey, renderItem)

  // 12. Event handlers
  _0.addEventListener('click', handleClick)

  // 13. Ref callbacks
  inputRef(_4)

  // 14. User-defined effects and onMounts
  createEffect(() => { ... })
  onMount(() => { ... })
}
```

### 5. Import Detection

The generator scans the output code and includes only the `@barefootjs/dom` imports actually used:

```javascript
import { createSignal, createEffect, find, findScope } from '@barefootjs/dom'
```

### 6. Event Delegation in Loops

For loops that render elements with events, the compiler uses event delegation:

```javascript
// Parent container handles events
_loopSlot.addEventListener('click', (e) => {
  const el = e.target.closest('[data-bf="childSlot"]')
  if (!el) return
  const item = items().find(t => t.id === el.dataset.key)
  handleItemClick(item)
})
```

---

## Multi-Component Files

When a file exports multiple components, the compiler:

1. Detects all exports via `listExportedComponents()`
2. Compiles each component independently (separate IR, separate client JS)
3. Merges templates — deduplicates shared imports and type definitions
4. Merges client JS — combines imports by source module

```tsx
// Both compiled from the same file
export function Button(props: ButtonProps) { ... }
export function IconButton(props: IconButtonProps) { ... }
```

---

## Debugging Tips

### View the IR

```typescript
const result = compileJSXSync(source, 'file.tsx', { adapter })
console.log(JSON.stringify(result.ir, null, 2))
```

### View generated client JS

```typescript
console.log(result.clientJs)
```

### Common compilation issues

| Symptom | Likely Cause |
|---------|-------------|
| No client JS generated | Component has no reactive elements |
| Element not updating | Expression not detected as reactive (check signal name pattern) |
| Hydration mismatch | Server template and client JS disagree on slot IDs |
| BF021 on filter/sort | Predicate too complex for SSR — use `/* @client */` |
