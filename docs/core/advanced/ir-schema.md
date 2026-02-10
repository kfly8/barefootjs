# IR Schema Reference

The Intermediate Representation (IR) is a pure JSON tree structure that sits between JSX parsing and template/client-JS generation. It is **JSX-independent** — adapters consume IR without any knowledge of the original JSX syntax.

## Pipeline Position

```
JSX Source → [Phase 1: analyzer + jsx-to-ir] → IR → [Phase 2a: adapter] → Template
                                                   → [Phase 2b: ir-to-client-js] → Client JS
```

The IR can be output as `*.ir.json` for debugging by passing `outputIR: true` to the compiler. See [Debugging](#debugging) for details.

---

## Core Node Types

### IRElement

An HTML or SVG element.

```typescript
interface IRElement {
  type: 'element'
  tag: string                      // 'div', 'button', 'svg', etc.
  attributes: IRAttribute[]        // Static and dynamic attributes
  events: IREvent[]                // Event handlers
  children: IRNode[]               // Child nodes
  slotId?: string                  // Hydration marker ID (if interactive)
  needsScope?: boolean             // Root element of a component
  ref?: string                     // Ref callback name
}
```

An element gets a `slotId` when it has any of:
- Event handlers (`onClick`, etc.)
- Dynamic children (expressions, loops, conditionals)
- Reactive attributes
- Refs

### IRText

Static text content.

```typescript
interface IRText {
  type: 'text'
  value: string
}
```

### IRExpression

A dynamic expression — anything in `{braces}` in JSX.

```typescript
interface IRExpression {
  type: 'expression'
  value: string                    // The expression source code
  reactive: boolean                // References signals, memos, or props?
  slotId?: string                  // Hydration marker (if reactive)
  clientOnly?: boolean             // /* @client */ marked
}
```

**Reactivity classification:**

| Pattern | `reactive` | Reason |
|---------|-----------|--------|
| `count()` | `true` | Signal getter call |
| `doubled()` | `true` | Memo call |
| `props.count` | `true` | Props reference (may be getter) |
| `"static"` | `false` | Literal value |
| `CONSTANT` | `false` | No reactive dependencies |

### IRConditional

A ternary or logical expression that switches between two branches.

```typescript
interface IRConditional {
  type: 'conditional'
  condition: string                // The condition expression
  consequent: IRNode               // Truthy branch
  alternate: IRNode | null         // Falsy branch (null for logical &&)
  slotId?: string                  // Hydration marker for DOM switching
}
```

Generated from JSX like:

```tsx
{isOpen() ? <Panel /> : <Placeholder />}
{hasError() && <ErrorMessage />}
```

### IRLoop

An array `.map()` call, optionally with `.filter()` and `.sort()`.

```typescript
interface IRLoop {
  type: 'loop'
  array: string                    // Data source expression
  param: string                    // Loop variable name
  index?: string                   // Index variable name
  key?: string                     // Key expression for reconciliation
  children: IRNode[]               // Loop body
  slotId?: string                  // Container marker
  childComponent?: string          // If loop renders a single component
  nestedComponents?: NestedComponentInfo[]  // Components inside elements
  isStaticArray?: boolean          // No reconcileList needed
  filterPredicate?: ParsedFilterPredicate   // .filter() for SSR
  sortComparator?: ParsedSortComparator     // .sort() for SSR
}
```

**Filter predicates** are parsed for server-side evaluation:

```tsx
// Simple predicate — compiled to SSR template
{todos().filter(t => !t.done).map(t => <li>{t.name}</li>)}

// Complex predicate — requires /* @client */ or triggers BF021
{todos().filter(t => t.items.some(i => i.done)).map(...)}
```

**Sort comparators** support simple subtraction patterns:

```tsx
// Supported — ascending by price
{items().sort((a, b) => a.price - b.price).map(...)}

// Supported — descending by priority
{items().toSorted((a, b) => b.priority - a.priority).map(...)}
```

### IRComponent

A child component reference.

```typescript
interface IRComponent {
  type: 'component'
  name: string                     // Component name
  props: IRComponentProp[]         // Props passed to component
  children: IRNode[]               // Children (becomes props.children)
  slotId?: string                  // Hydration marker
}
```

### IRFragment

A JSX fragment (`<>...</>`).

```typescript
interface IRFragment {
  type: 'fragment'
  children: IRNode[]
}
```

### IRIfStatement

An early-return conditional inside a component body.

```typescript
interface IRIfStatement {
  type: 'if-statement'
  condition: string
  consequent: IRNode               // JSX returned in the if branch
}
```

Generated from:

```tsx
function Component(props: Props) {
  if (props.loading) return <Spinner />
  return <Content />
}
```

### IRProvider

A Context provider wrapping children.

```typescript
interface IRProvider {
  type: 'provider'
  contextName: string              // Context variable name
  value: string                    // Value expression
  children: IRNode[]
}
```

---

## Attributes & Events

### IRAttribute

```typescript
interface IRAttribute {
  name: string                     // Attribute name ('class', 'href', etc.)
  value: string | IRTemplateLiteral  // Static string or template literal
  dynamic?: boolean                // Expression value (not a literal)
  reactive?: boolean               // Value depends on signals/memos
}
```

**Template literals with ternaries:**

```tsx
<div class={`base ${isActive() ? 'active' : 'inactive'}`} />
```

Produces an `IRTemplateLiteral` with `ternary` parts, enabling the adapter to generate appropriate template syntax.

### IREvent

```typescript
interface IREvent {
  name: string                     // Event name ('click', 'input', etc.)
  handler: string                  // Handler expression or function name
}
```

---

## Component Metadata

Each compiled component includes metadata alongside the IR tree:

```typescript
interface ComponentIR {
  componentName: string
  exportType: 'named' | 'default'

  // Reactivity
  signals: SignalInfo[]            // createSignal declarations
  memos: MemoInfo[]                // createMemo declarations
  effects: EffectInfo[]            // createEffect calls
  onMounts: OnMountInfo[]          // onMount callbacks

  // Props
  propsParams: PropsParam          // Props type and parameter style
  propsType?: TypeInfo             // Full type definition

  // Code
  imports: ImportInfo[]            // All imports
  localConstants: ConstantInfo[]   // Local variables and functions
  localFunctions: FunctionInfo[]   // Helper functions

  // Type system
  typeDefinitions: TypeDefinition[] // Interfaces, type aliases

  // IR tree
  ir: IRNode                       // Root node
}
```

### SignalInfo

```typescript
interface SignalInfo {
  getterName: string               // e.g., 'count'
  setterName: string               // e.g., 'setCount'
  initialValue: string             // e.g., '0', 'props.initial ?? 0'
  type?: string                    // e.g., 'number'
}
```

### MemoInfo

```typescript
interface MemoInfo {
  name: string                     // e.g., 'doubled'
  computation: string              // e.g., '() => count() * 2'
  type?: string                    // e.g., 'number'
}
```

---

## Hydration Markers

The IR's `slotId` and `needsScope` fields map to HTML attributes in the rendered template:

| IR Field | HTML Output | Purpose |
|----------|------------|---------|
| `needsScope: true` | `data-bf-scope="ComponentName"` | Component root boundary |
| `slotId: "0"` | `data-bf="0"` | Interactive element reference |
| Conditional `slotId` | `data-bf-cond="1"` | Conditional branch anchor |

The client runtime uses these markers to locate elements during hydration without full DOM traversal.

---

## Debugging

Export IR as JSON for inspection by passing `outputIR: true`:

```typescript
import { compileJSXSync } from '@barefootjs/jsx'

const result = compileJSXSync(source, 'Counter.tsx', {
  adapter: new HonoAdapter(),
  outputIR: true,
})

// result.ir contains the full ComponentIR
console.log(JSON.stringify(result.ir, null, 2))

// result.additionalFiles includes the *.ir.json file
// e.g., { path: 'Counter.ir.json', content: '...' }
```
