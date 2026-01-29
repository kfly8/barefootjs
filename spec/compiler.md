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

## Open Questions

1. **Type inference depth** - How deeply to resolve types like `Pick<T, K>`?
2. **Source maps** - Generate source maps for Client JS debugging?
