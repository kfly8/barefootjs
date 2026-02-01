# Compiler Specification

## Vision

**"Reactive JSX for any backend"** - Enable Signal-based reactive JSX to generate Marked Templates + Client JS for any backend language (TypeScript, Go, Python, Perl, etc.).

## Design Goals

1. **Multi-backend support** - Generate templates for any backend language
2. **Type preservation** - Maintain full type information for statically typed targets
3. **Fast compilation** - Single-pass AST processing
4. **Helpful errors** - Source location + suggestions for all compiler errors

---

## Architecture

### Pipeline

```
JSX Source
    ↓
[Phase 1] Single-pass AST → Pure IR (with full type info)
    ↓
    ├── *.ir.json (intermediate output, optional)
    ↓
[Phase 2a] IR → Marked Template (via adapter)
[Phase 2b] IR → Client JS
    ↓
*.tsx (hono/jsx)
*.client.js
```

### Design Principles

1. **IR is JSX-independent** - Pure JSON tree structure
2. **Full type information** - All types preserved in IR
3. **Single AST pass** - Parse once, extract everything
4. **Adapter-based output** - IR can be rendered to different template formats
5. **Rich error reporting** - Source location + suggestions

---

## Reactivity Model

BarefootJS uses SolidJS-style fine-grained reactivity with automatic dependency tracking.

### Signals

Signals follow the SolidJS pattern - **getter function calls**:

```tsx
const [count, setCount] = createSignal(0)

// Read: call getter function
count()           // ✅ Correct - returns current value

// Write: call setter function
setCount(5)       // Direct value
setCount(n => n + 1)  // Updater function
```

**Key difference from React:**

| BarefootJS (SolidJS-style) | React |
|----------------------------|-------|
| `count()` - function call | `count` - direct variable |
| Automatic dependency tracking | Manual `[deps]` array |
| Fine-grained updates | Component re-render |

### Props Access

Props use **destructuring at definition** but may need **getter calls at usage**:

```tsx
// ✅ Destructuring at component definition is OK
function Counter({ initial, onChange }: Props) {
  const [count, setCount] = createSignal(initial)
  // ...
}
```

**Compiler transformation for child component props:**

```tsx
// Parent component
<Counter value={count()} onChange={handleChange} />

// Generated client JS (getter-based for reactive props)
const propsForInit = {
  get value() { return count() },  // Dynamic: wrapped as getter
  onChange: handleChange           // Callback: passed directly
}
```

### Props Access Patterns

| Pattern | Behavior | Use Case |
|---------|----------|----------|
| `props.value` | Direct access (may be getter) | In event handlers |
| `props.value()` | Explicit getter call | When prop is reactive |
| `const { value } = props` | Destructure once | Static props only |

**⚠️ Important:** Destructuring reactive props breaks reactivity:

```tsx
// ❌ BAD: Loses reactivity (value captured once)
function Child({ value }: Props) {
  const captured = value  // If parent passes count(), this is stale
  return <p>{captured}</p>
}

// ✅ GOOD: Maintains reactivity
function Child(props: Props) {
  return <p>{props.value()}</p>  // Re-evaluates on each access
}

// ✅ ALSO GOOD: Use in effect
function Child({ value }: Props) {
  const [local, setLocal] = createSignal(value)
  // value is used as initial value, local signal is reactive
  return <p>{local()}</p>
}
```

### Comparison with SolidJS and React

| Aspect | BarefootJS | SolidJS | React |
|--------|-----------|---------|-------|
| Signal access | `count()` | `count()` | `count` (useState) |
| Props access | Getter-based | Getter-based | Direct access |
| Destructuring props | ⚠️ Careful | ⚠️ Careful | ✅ Safe |
| Dependency tracking | Automatic | Automatic | Manual arrays |
| Rendering | Server template + Client hydration | All in JS | All in JS |

### Memos

Derived values use `createMemo`:

```tsx
const doubled = createMemo(() => count() * 2)

// Usage: also a getter call
doubled()  // Returns computed value
```

### Effects

Side effects use `createEffect`:

```tsx
createEffect(() => {
  // Runs when any accessed signal changes
  console.log('Count is:', count())
  localStorage.setItem('count', count().toString())
})
```

---

## Transformation Rules

### Categories

| Prefix | Category | Description |
|--------|----------|-------------|
| JSX-XXX | Basic JSX | Elements, text, fragments |
| ATTR-XXX | Attributes | Static, dynamic, spread |
| EXPR-XXX | Expressions | Signals, memos, dynamic content |
| CTRL-XXX | Control Flow | Conditionals, lists |
| COMP-XXX | Components | Props, children, composition |
| EVT-XXX | Events | Event handlers, delegation |
| REF-XXX | Refs | Ref callbacks |
| EDGE-XXX | Edge Cases | Whitespace, SVG, forms |
| DIR-XXX | Directives | "use client" validation |
| PATH-XXX | Element Paths | DOM traversal optimization |
| TYPE-XXX | Type Preservation | Interface/type handling |
| OOS-XXX | Out of Scope | Intentionally not supported |

### Output Types

| Type | Meaning |
|------|---------|
| `preserve` | Input is preserved as-is (input = output) |
| `markedTemplate` | Input is transformed to marked template (adds hydration markers) |
| `clientJs` | Client-side JavaScript is generated |
| `both` | Both marked template and client JS are generated |
| `error` | Compilation error is expected |
| `n/a` | Not applicable (Out of Scope items) |

### Hydration Markers

1. **Marked Template**: Server-side template with hydration markers
   - `data-bf-scope="ComponentName"` - Component root
   - `data-bf="id"` - Interactive element
   - `data-bf-cond="id"` - Conditional element

2. **Client JS**: Minimal JavaScript for reactivity
   - Uses `createEffect` for reactive updates
   - Event delegation for lists
   - DOM switching for conditionals

---

## IR Schema

The Intermediate Representation (IR) is a pure JSON tree structure. Full type definitions are in `packages/jsx/src/types.ts`.

### Core Node Types

- `IRElement` - HTML/SVG elements with attrs, events, children
- `IRText` - Static text content
- `IRExpression` - Dynamic expressions (reactive or static)
- `IRConditional` - Ternary/logical conditionals
- `IRLoop` - Array mapping (.map())
- `IRComponent` - Child component references
- `IRSlot` - Slot placeholders

### Metadata

Each compiled component includes metadata:
- Component name and export info
- Type definitions (interfaces, type aliases)
- Signals, memos, effects
- Imports and local functions/constants
- Props type information

---

## Adapter API

Adapters transform IR into backend-specific templates.

```typescript
interface TemplateAdapter {
  name: string
  extension: string

  generate(ir: ComponentIR): AdapterOutput

  // Node rendering
  renderElement(element: IRElement): string
  renderExpression(expr: IRExpression): string
  renderConditional(cond: IRConditional): string
  renderLoop(loop: IRLoop): string
  renderComponent(comp: IRComponent): string

  // Optional: type generation for typed languages
  generateTypes?(ir: ComponentIR): string | null
}
```

### Available Adapters

- **HonoAdapter** (`@barefootjs/hono`) - Generates hono/jsx compatible TSX
- **GoTemplateAdapter** (`@barefootjs/go-template`) - Generates Go html/template files

---

## Error Codes

| Code | Description |
|------|-------------|
| BF001 | Missing 'use client' directive |
| BF002 | Invalid directive position |
| BF003 | Client component importing server component |
| BF010 | Unknown signal reference |
| BF011 | Signal used outside component |
| BF020 | Invalid JSX expression |
| BF021 | Unsupported JSX pattern |
| BF030 | Type inference failed |
| BF031 | Props type mismatch |

### Error Format

```
error[BF001]: 'use client' directive required for components with createSignal

  --> src/components/Counter.tsx:3:1
   |
 3 | import { createSignal } from '@barefootjs/dom'
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = help: Add 'use client' at the top of the file
```

---

## Reactivity Model

This section documents the current reactive behavior of the compiler.

### Overview

Barefoot.js uses **fine-grained reactivity** similar to SolidJS:
- Components execute **once** (not on every render like React)
- Reactivity flows through **signal getter calls** and **property access**
- JSX expressions are wrapped in `createEffect` for reactive updates

---

### Reactivity Classification

| Pattern | Reactive? | Reason |
|---------|-----------|--------|
| `count()` (signal getter) | Yes | Signal call detected |
| `doubled()` (memo call) | Yes | Memo call detected |
| `props.count` | Yes | Props reference |
| `count` (destructured prop) | Yes* | Props parameter (*see caveats) |
| `"static string"` | No | Literal value |
| `CONSTANT` (no reactive deps) | No | Pure constant |
| `classes` (depends on signal) | Yes | Transitive dependency |

---

### Props Access Patterns

#### Pattern A: Destructured Props

```tsx
// Source
function Counter({ count }: { count: number }) {
  return <div>{count}</div>
}

// Generated Client JS
const count = props.count  // Captured ONCE at hydration
createEffect(() => {
  if (_slot_0) _slot_0.textContent = String(count)
})
```

**Behavior**: Value captured at hydration. Does NOT update when parent changes.

#### Pattern B: Direct Props Access

```tsx
// Source
function Counter(props: { count: number }) {
  return <div>{props.count}</div>
}

// Generated Client JS
createEffect(() => {
  if (_slot_0) _slot_0.textContent = String(props.count)
})
```

**Behavior**: Accessed inside effect. Updates when parent passes new value via getter.

#### Pattern C: Props in Memo/Effect (SolidJS-style)

```tsx
// Source - use props.xxx directly for reactivity
function Checkbox(props: { checked?: boolean }) {
  const isControlled = createMemo(() => props.checked !== undefined)
}

// Generated Client JS - preserved as-is
const isControlled = createMemo(() => props.checked !== undefined)
```

**Behavior**: Props accessed via `props.xxx` maintain reactivity. **No implicit transformation** - you must write `props.xxx` explicitly.

#### Pattern D: Props Passed to Child

```tsx
// Parent
function Parent() {
  const [value, setValue] = createSignal(false)
  return <Checkbox checked={value()} />
}

// Generated: getter for reactivity
initChild('Checkbox', _slot_0, {
  get checked() { return value() }
})
```

**Behavior**: Dynamic props wrapped in getters for SolidJS-style reactivity.

---

### Context-Dependent Behavior Summary

| Context | Pattern | Reactive? | Notes |
|---------|---------|-----------|-------|
| **JSX expression** | `{count()}` | Yes | Wrapped in `createEffect` |
| **JSX expression** | `{props.value}` | Yes | Wrapped in `createEffect` |
| **Memo body** | `props.checked` | Yes | Props accessed via object maintain reactivity |
| **Memo body** | `checked` (destructured) | No | Value captured at definition |
| **Effect body** | `props.checked` | Yes | Props accessed via object maintain reactivity |
| **Effect body** | `checked` (destructured) | No | Value captured at definition |
| **Child props** | `<C val={x()}/>` | Yes | Getter: `get val() { return x() }` |
| **Constant def** | `const c = x()` | No | Evaluated once (late if depends on signal) |

**Rule**: Use `props.xxx` to maintain reactivity. Destructured props capture the value once.

---

### Comparison with SolidJS and React

#### SolidJS

| Aspect | SolidJS | Barefoot.js |
|--------|---------|-------------|
| Component execution | Once | Once (hydration) |
| Props access style | Always `props.xxx` | Destructured or `props.xxx` |
| Reactivity trigger | Signal getter call | Signal getter call |
| Prop reactivity | Via proxy/getters | Via getters (child) or effects (JSX) |

**Key Difference**: SolidJS **discourages destructuring props**. Barefoot.js allows it but with caveats.

```tsx
// SolidJS - idiomatic
function Counter(props) {
  return <div>{props.count}</div>  // Always reactive
}

// Barefoot.js - works but has edge cases
function Counter({ count }) {
  return <div>{count}</div>  // Reactive in JSX, static elsewhere
}
```

#### React

| Aspect | React | Barefoot.js |
|--------|-------|-------------|
| Component execution | Every render | Once (hydration) |
| Props access | Any style works | Style affects reactivity |
| State update | Re-renders component | Triggers effects only |

**Key Difference**: React re-runs the entire component. Barefoot.js runs once and updates via effects.

```tsx
// React - props always fresh
function Counter({ count }) {
  console.log(count)  // Fresh on every render
  return <div>{count}</div>
}

// Barefoot.js - props captured once
function Counter({ count }) {
  console.log(count)  // Only logs INITIAL value
  return <div>{count}</div>  // JSX updates via effect
}
```

---

### Known Inconsistencies

#### 1. Destructuring vs Direct Access (SolidJS Rule)

```tsx
// BROKEN: value captured at hydration, loses reactivity
function Checkbox({ checked }) {
  const isControlled = checked !== undefined  // Always initial value
  const x = createMemo(() => checked !== undefined)  // Also broken - checked is captured
}

// WORKS: use props object directly
function Checkbox(props) {
  const isControlled = createMemo(() => props.checked !== undefined)
  // props.checked is reactive - updates when parent changes
}
```

**SolidJS-style Rule**: Destructured props lose reactivity. Use `props.xxx` to maintain reactivity.

#### 2. Constant Ordering

```tsx
const classes = `btn ${isActive() && 'on'}`  // Uses memo
const isActive = createMemo(() => selected() === id)
```

Compiler must detect dependency and reorder. This is fragile.

---

### Underlying Principle

**Reactivity flows through function calls and property access, not variable capture.**

| Access Pattern | Reactive? | Why |
|----------------|-----------|-----|
| `signal()` | Yes | Function call re-evaluated in effect |
| `props.xxx` | Potentially | Property access can use getter |
| `const x = signal()` | No | Value captured at definition |
| `const x = props.xxx` | No | Value captured at definition |

---

### Reactivity Rule (SolidJS-style)

**Adopted Approach**: Destructured props lose reactivity. Use `props.xxx` for reactive access.

```tsx
// ✅ GOOD: Reactive props access
function Component(props: Props) {
  const derived = createMemo(() => props.value * 2)  // Reactive
  return <div>{props.name}</div>  // Reactive in JSX
}

// ❌ BAD: Loses reactivity
function Component({ value, name }: Props) {
  const derived = createMemo(() => value * 2)  // Captured once, not reactive
  return <div>{name}</div>  // Still works in JSX due to createEffect wrapper
}
```

This matches SolidJS behavior where props must be accessed via the props object to maintain reactivity.

---

## Open Questions

1. **Type inference depth** - How deeply to resolve types like `Pick<T, K>`?
2. **Source maps** - Generate source maps for Client JS debugging?
3. **Constant ordering** - How to handle dependencies more robustly?
4. **Lint rule** - Add ESLint rule to warn about destructured props in reactive contexts?
