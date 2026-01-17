# Compiler: Multi-Backend Architecture

## Vision

**"Reactive JSX for any backend"** - Enable Signal-based reactive JSX to generate Marked Templates + Client JS for any backend language (TypeScript, Go, Python, Perl, etc.).

## Design Goals

1. **Multi-backend support** - Generate templates for any backend language
2. **Type preservation** - Maintain full type information for statically typed targets
3. **Fast compilation** - Single-pass AST processing, future typescript-go compatibility
4. **Helpful errors** - Source location + suggestions for all compiler errors

---

## Current Architecture Problems

### 1. JSX/HTML Strings Mixed in IR

| Location | Field | Problem |
|----------|-------|---------|
| `types.ts:172-173` | `ConditionalElement.whenTrueTemplate/whenFalseTemplate` | HTML strings in IR |
| `types.ts:205-207` | `LocalFunction.tsxCode` | JSX string preserved |
| `types.ts:470` | `IRComponent.staticHtml` | Unused field |

### 2. Ad-hoc Branching

| Location | Issue |
|----------|-------|
| `jsx-to-ir.ts:235-244` | Special case for "complex JSX nodes" children |
| `jsx-to-ir.ts:259-268` | Event handler detection with unclear logic |
| `jsx-to-ir.ts:400-402, 1087-1089` | Duplicate `hasJsxBranch` logic |

### 3. Regex-based AST Manipulation

| Location | Issue |
|----------|-------|
| `ir-to-marked-jsx.ts:440-506` | `replaceSignalAndMemoCalls` uses regex |
| `template-generator.ts:219-259` | `substituteModuleConstantLookups` parses with regex |

### 4. Multiple Parse Passes

Current code parses AST multiple times across different extractors. Should be consolidated.

---

## New Architecture

### Pipeline

```
JSX Source
    ↓
[Phase 1] Single-pass AST → Pure IR (with full type info)
    ↓
    ├── *.ir.json (intermediate output)
    ↓
[Phase 2a] IR → Marked Template (language-specific adapter)
[Phase 2b] IR → Client JS (shared output)
    ↓
*.hono.tsx / *.go.tmpl / *.jinja2 / etc.
*.client.js
```

### Design Principles

1. **IR is JSX-independent** - Pure JSON tree structure
2. **Full type information** - All types preserved in IR
3. **Single AST pass** - Parse once, extract everything
4. **Control flow as placeholders** - Convertible to `{{#each}}`, `{% for %}`, etc.
5. **Components as separate partials** - Combined via include/partial
6. **Rich error reporting** - Source location + suggestions

---

## Pure IR Schema

### Node Types

```typescript
type IRNode =
  | IRElement
  | IRText
  | IRExpression
  | IRConditional
  | IRLoop
  | IRComponent
  | IRSlot

interface IRElement {
  type: 'element'
  tag: string
  attrs: IRAttribute[]
  events: IREvent[]
  ref: string | null
  children: IRNode[]
  slotId: string | null
  needsScope: boolean
  loc: SourceLocation           // Source location for errors
}

interface IRText {
  type: 'text'
  value: string
  loc: SourceLocation
}

interface IRExpression {
  type: 'expression'
  expr: string
  typeInfo: TypeInfo | null     // Full type information
  reactive: boolean
  slotId: string | null
  loc: SourceLocation
}

interface IRConditional {
  type: 'conditional'
  condition: string
  conditionType: TypeInfo | null
  reactive: boolean
  whenTrue: IRNode
  whenFalse: IRNode
  slotId: string | null
  loc: SourceLocation
}

interface IRLoop {
  type: 'loop'
  array: string
  arrayType: TypeInfo | null    // Array<T> type info
  itemType: TypeInfo | null     // T type info
  param: string
  index: string | null
  key: string | null
  children: IRNode[]
  slotId: string | null
  loc: SourceLocation
}

interface IRComponent {
  type: 'component'
  name: string
  props: IRProp[]
  propsType: TypeInfo | null    // Props interface/type
  children: IRNode[]
  template: string
  loc: SourceLocation
}

interface IRSlot {
  type: 'slot'
  name: string
  loc: SourceLocation
}
```

### Type Information

```typescript
interface TypeInfo {
  kind: 'primitive' | 'object' | 'array' | 'union' | 'function' | 'interface' | 'unknown'
  raw: string                   // Original TypeScript type string

  // For primitives
  primitive?: 'string' | 'number' | 'boolean' | 'null' | 'undefined'

  // For objects/interfaces
  properties?: PropertyInfo[]

  // For arrays
  elementType?: TypeInfo

  // For unions
  unionTypes?: TypeInfo[]

  // For functions
  params?: ParamInfo[]
  returnType?: TypeInfo
}

interface PropertyInfo {
  name: string
  type: TypeInfo
  optional: boolean
  readonly: boolean
}

interface ParamInfo {
  name: string
  type: TypeInfo
  optional: boolean
  defaultValue?: string
}
```

### Source Location (for Error Reporting)

```typescript
interface SourceLocation {
  file: string
  start: Position
  end: Position
}

interface Position {
  line: number      // 1-indexed
  column: number    // 0-indexed
}
```

### Full Metadata

```typescript
interface IRMetadata {
  componentName: string

  // All type definitions used
  typeDefinitions: TypeDefinition[]

  // Signals with full type info
  signals: SignalInfo[]

  // Memos with full type info
  memos: MemoInfo[]

  // User-written effects
  effects: EffectInfo[]

  // Imports needed
  imports: ImportInfo[]

  // Local functions (with JSX or not)
  localFunctions: FunctionInfo[]

  // Local constants
  localConstants: ConstantInfo[]

  // Props type definition
  propsType: TypeInfo | null
}

interface SignalInfo {
  getter: string
  setter: string
  initialValue: string
  type: TypeInfo
  loc: SourceLocation
}

interface MemoInfo {
  name: string
  computation: string
  type: TypeInfo
  deps: string[]
  loc: SourceLocation
}

interface TypeDefinition {
  kind: 'interface' | 'type'
  name: string
  definition: string          // Original TypeScript definition
  loc: SourceLocation
}
```

### Complete IR Output

```typescript
interface ComponentIR {
  version: '2.0'
  metadata: IRMetadata
  root: IRNode
  errors: CompilerError[]     // Non-fatal errors/warnings
}
```

---

## Error Reporting

### Error Structure

```typescript
interface CompilerError {
  code: string                // 'BF001', 'BF002', etc.
  severity: 'error' | 'warning' | 'info'
  message: string
  loc: SourceLocation
  codeFrame: string           // Highlighted source code snippet
  suggestion?: ErrorSuggestion
}

interface ErrorSuggestion {
  message: string
  replacement?: string        // Suggested code replacement
}
```

### Example Error Output

```
error[BF001]: 'use client' directive required for components with createSignal

  --> src/components/Counter.tsx:3:1
   |
 3 | import { createSignal } from '@barefootjs/dom'
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = help: Add 'use client' at the top of the file

  'use client'
  import { createSignal } from '@barefootjs/dom'
```

### Error Codes

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

---

## Adapter API

### Interface

```typescript
interface TemplateAdapter {
  name: string                // 'hono', 'go-template', 'jinja2'
  extension: string           // '.hono.tsx', '.go.tmpl', '.html'

  // Main entry point
  generate(ir: ComponentIR): AdapterOutput

  // Control flow
  renderLoop(loop: IRLoop, content: string): string
  renderConditional(cond: IRConditional, whenTrue: string, whenFalse: string): string

  // Component reference
  renderPartial(comp: IRComponent): string

  // Expression interpolation
  renderExpression(expr: IRExpression): string

  // Hydration markers
  renderScopeMarker(instanceIdExpr: string): string
  renderSlotMarker(slotId: string): string
  renderCondMarker(condId: string): string

  // Type generation (for typed languages)
  generateTypes?(ir: ComponentIR): string | null
}

interface AdapterOutput {
  template: string
  types?: string              // Generated types (for TS/Go)
  extension: string
}
```

### Hono Adapter (TypeScript)

```typescript
const honoAdapter: TemplateAdapter = {
  name: 'hono',
  extension: '.hono.tsx',

  generateTypes(ir) {
    // Preserve original Props interface
    // Add HydrationProps intersection
    return ir.metadata.typeDefinitions
      .map(t => t.definition)
      .join('\n')
  },

  renderLoop(loop, content) {
    const indexParam = loop.index ? `, ${loop.index}` : ''
    return `{${loop.array}.map((${loop.param}${indexParam}) => ${content})}`
  },

  renderExpression(expr) {
    return `{${expr.expr}}`
  },
  // ...
}
```

### Go Template Adapter

```typescript
const goTemplateAdapter: TemplateAdapter = {
  name: 'go-template',
  extension: '.go.tmpl',

  generateTypes(ir) {
    // Generate Go struct from Props type
    return generateGoStruct(ir.metadata.propsType)
  },

  renderLoop(loop, content) {
    return `{{range $${loop.param} := ${toGoExpr(loop.array)}}}${content}{{end}}`
  },

  renderExpression(expr) {
    return `{{${toGoExpr(expr.expr)}}}`
  },
  // ...
}
```

---

## Single-Pass AST Processing

### Current Problem

```typescript
// Currently: multiple passes
const signals = extractSignals(sourceFile)      // Pass 1
const memos = extractMemos(sourceFile)          // Pass 2
const effects = extractEffects(sourceFile)      // Pass 3
const props = extractProps(sourceFile)          // Pass 4
const imports = extractImports(sourceFile)      // Pass 5
const jsx = findJsxReturn(sourceFile)           // Pass 6
// ... more passes
```

### New Approach

```typescript
// Single pass: collect everything at once
interface ASTVisitorContext {
  signals: SignalInfo[]
  memos: MemoInfo[]
  effects: EffectInfo[]
  props: PropInfo[]
  imports: ImportInfo[]
  localFunctions: FunctionInfo[]
  localConstants: ConstantInfo[]
  typeDefinitions: TypeDefinition[]
  jsx: ts.JsxElement | null
  errors: CompilerError[]
}

function analyzeComponent(sourceFile: ts.SourceFile): ASTVisitorContext {
  const ctx: ASTVisitorContext = { /* init */ }

  function visit(node: ts.Node) {
    // Collect all information in one pass
    if (ts.isVariableDeclaration(node)) {
      collectSignalOrMemo(node, ctx)
      collectConstant(node, ctx)
    }
    if (ts.isCallExpression(node) && isCreateEffect(node)) {
      collectEffect(node, ctx)
    }
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      collectFunction(node, ctx)
    }
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      collectTypeDefinition(node, ctx)
    }
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      // Only collect top-level JSX return
      if (isReturnStatement(node.parent)) {
        ctx.jsx = node
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return ctx
}
```

### Benefits

1. **Faster compilation** - Parse AST once
2. **Consistent context** - All extractors see same AST state
3. **Better error collection** - Errors accumulated during single pass
4. **Future typescript-go ready** - Clean separation of AST access

---

## Example Transformation

### Input

```tsx
'use client'
import { createSignal } from '@barefootjs/dom'

interface CounterProps {
  initial?: number
  label: string
}

export function Counter({ initial = 0, label }: CounterProps) {
  const [count, setCount] = createSignal(initial)
  const doubled = createMemo(() => count() * 2)

  return (
    <div>
      <span>{label}: {count()}</span>
      <span>Doubled: {doubled()}</span>
      <button onClick={() => setCount(n => n + 1)}>+</button>
    </div>
  )
}
```

### IR Output (counter.ir.json)

```json
{
  "version": "2.0",
  "metadata": {
    "componentName": "Counter",
    "typeDefinitions": [
      {
        "kind": "interface",
        "name": "CounterProps",
        "definition": "interface CounterProps {\n  initial?: number\n  label: string\n}",
        "loc": { "file": "Counter.tsx", "start": { "line": 4, "column": 0 }, "end": { "line": 7, "column": 1 } }
      }
    ],
    "propsType": {
      "kind": "interface",
      "raw": "CounterProps",
      "properties": [
        { "name": "initial", "type": { "kind": "primitive", "primitive": "number", "raw": "number" }, "optional": true },
        { "name": "label", "type": { "kind": "primitive", "primitive": "string", "raw": "string" }, "optional": false }
      ]
    },
    "signals": [
      {
        "getter": "count",
        "setter": "setCount",
        "initialValue": "initial",
        "type": { "kind": "primitive", "primitive": "number", "raw": "number" },
        "loc": { "file": "Counter.tsx", "start": { "line": 10, "column": 2 }, "end": { "line": 10, "column": 47 } }
      }
    ],
    "memos": [
      {
        "name": "doubled",
        "computation": "() => count() * 2",
        "type": { "kind": "primitive", "primitive": "number", "raw": "number" },
        "deps": ["count"],
        "loc": { "file": "Counter.tsx", "start": { "line": 11, "column": 2 }, "end": { "line": 11, "column": 45 } }
      }
    ],
    "effects": [],
    "imports": [],
    "localFunctions": [],
    "localConstants": []
  },
  "root": {
    "type": "element",
    "tag": "div",
    "attrs": [],
    "events": [],
    "ref": null,
    "needsScope": true,
    "slotId": null,
    "children": [
      {
        "type": "element",
        "tag": "span",
        "children": [
          { "type": "expression", "expr": "label", "reactive": false, "slotId": null },
          { "type": "text", "value": ": " },
          { "type": "expression", "expr": "count()", "reactive": true, "slotId": "slot_0" }
        ],
        "slotId": "slot_0"
      },
      {
        "type": "element",
        "tag": "span",
        "children": [
          { "type": "text", "value": "Doubled: " },
          { "type": "expression", "expr": "doubled()", "reactive": true, "slotId": "slot_1" }
        ],
        "slotId": "slot_1"
      },
      {
        "type": "element",
        "tag": "button",
        "events": [{ "name": "click", "handler": "() => setCount(n => n + 1)" }],
        "children": [{ "type": "text", "value": "+" }],
        "slotId": "slot_2"
      }
    ]
  },
  "errors": []
}
```

---

## Migration Plan

### Phase 1: Define Pure IR Schema
- [ ] Create `packages/jsx/src/types.ts`
- [ ] Define JSON schema for validation
- [ ] Add SourceLocation to all nodes

### Phase 2: Single-Pass AST Analyzer
- [ ] Create `packages/jsx/src/analyzer.ts`
- [ ] Consolidate all extractors into single pass
- [ ] Collect full type information

### Phase 3: Implement JSX → Pure IR
- [ ] Refactor `jsx-to-ir.ts` to output Pure IR
- [ ] Remove HTML/JSX string generation
- [ ] Add `.ir.json` output

### Phase 4: Error Reporting System
- [ ] Create `packages/jsx/src/errors.ts`
- [ ] Define error codes and messages
- [ ] Implement code frame generation

### Phase 5: Adapter Layer
- [ ] Define `TemplateAdapter` interface
- [ ] Implement Hono adapter
- [ ] Verify Button page works

### PoC Goal
**Button page works with new architecture + helpful error messages.**

---

## Open Questions

1. **Type inference depth** - How deeply should we resolve types? (e.g., `Pick<T, K>`)
   - Current plan: Preserve raw TypeScript, let adapter handle

2. **typescript-go migration path** - When should we consider switching?
   - Wait for stability, design IR to be language-agnostic

3. **Incremental compilation** - Worth implementing for watch mode?
   - Future consideration after core is stable

4. **Source maps** - Should we generate source maps for Client JS?
   - Would improve debugging, consider for future release
