# Writing a Custom Adapter

This guide walks through building a custom adapter, using the Go Template adapter (`GoTemplateAdapter`) as a concrete, production-tested example. Each step maps to the actual implementation in `@barefootjs/go-template`.


## Step 1: Implement `TemplateAdapter`

Create a class that extends `BaseAdapter` (or implements `TemplateAdapter` directly):

```typescript
import type {
  ComponentIR,
  IRNode,
  IRElement,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRText,
  IRFragment,
  IRSlot,
} from '@barefootjs/jsx'
import { BaseAdapter, type AdapterOutput, type AdapterGenerateOptions } from '@barefootjs/jsx'

export interface GoTemplateAdapterOptions {
  packageName?: string
}

export class GoTemplateAdapter extends BaseAdapter {
  name = 'go-template'
  extension = '.tmpl'

  private componentName: string = ''
  private options: Required<GoTemplateAdapterOptions>

  constructor(options: GoTemplateAdapterOptions = {}) {
    super()
    this.options = {
      packageName: options.packageName ?? 'components',
    }
  }

  generate(ir: ComponentIR, options?: AdapterGenerateOptions): AdapterOutput {
    this.componentName = ir.metadata.componentName

    const templateBody = this.renderNode(ir.root)
    const scriptRegistrations = options?.skipScriptRegistration
      ? ''
      : this.generateScriptRegistrations(ir)

    const template = `{{define "${this.componentName}"}}\n${scriptRegistrations}${templateBody}\n{{end}}\n`
    const types = this.generateTypes(ir)

    return {
      template,
      types: types || undefined,
      extension: this.extension,
    }
  }

  // ... node rendering methods (see below)
}
```

The `generate()` method is the entry point. It receives the full `ComponentIR`, renders the IR tree into Go template syntax, and wraps it in a `{{define}}...{{end}}` block.


## Step 2: Implement `renderNode()`

The dispatcher routes each IR node to the correct rendering method. The Go Template adapter handles all standard node types:

```typescript
renderNode(node: IRNode): string {
  switch (node.type) {
    case 'element':     return this.renderElement(node)
    case 'text':        return (node as IRText).value
    case 'expression':  return this.renderExpression(node)
    case 'conditional': return this.renderConditional(node)
    case 'loop':        return this.renderLoop(node)
    case 'component':   return this.renderComponent(node)
    case 'fragment':    return this.renderChildren((node as IRFragment).children)
    case 'slot':        return this.renderSlot(node as IRSlot)
    case 'if-statement': return this.renderIfStatement(node)
    default:            return ''
  }
}
```


## Step 3: Implement Element Rendering

Elements are the most common node type. You need to:

1. Render the HTML tag and attributes
2. Insert hydration markers (`data-bf-scope`, `data-bf`)
3. Handle void elements (no closing tag)
4. Render children recursively

```typescript
renderElement(element: IRElement): string {
  const tag = element.tag
  const attrs = this.renderAttributes(element)
  const children = this.renderChildren(element.children)

  let hydrationAttrs = ''
  if (element.needsScope) {
    hydrationAttrs += ` ${this.renderScopeMarker('.ScopeID')}`
  }
  if (element.slotId) {
    hydrationAttrs += ` ${this.renderSlotMarker(element.slotId)}`
  }

  // Void elements have no closing tag
  const voidElements = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]

  if (voidElements.includes(tag.toLowerCase())) {
    return `<${tag}${attrs}${hydrationAttrs}>`
  }

  return `<${tag}${attrs}${hydrationAttrs}>${children}</${tag}>`
}
```

**Important:** Event handlers (`element.events`) are not rendered in the server template. They exist only in the client JS.

### Attributes

The `renderAttributes()` helper translates each attribute. Dynamic attributes use Go template syntax:

```typescript
private renderAttributes(element: IRElement): string {
  const parts: string[] = []

  for (const attr of element.attrs) {
    if (attr.name === '...') {
      // Spread attributes — expand known fields
      continue
    }
    if (attr.dynamic) {
      const goExpr = this.convertExpressionToGo(attr.value)
      parts.push(`${attr.name}="{{${goExpr}}}"`)
    } else if (attr.value === null) {
      // Boolean attribute (e.g., disabled)
      parts.push(attr.name)
    } else {
      parts.push(`${attr.name}="${attr.value}"`)
    }
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : ''
}
```


## Step 4: Implement Expression Rendering

Expressions are where the bulk of the translation work happens. JavaScript expressions must be converted to Go template syntax.

```typescript
renderExpression(expr: IRExpression): string {
  // @client expressions are skipped server-side
  if (expr.clientOnly) {
    if (expr.slotId) {
      return `{{bfComment "client:${expr.slotId}"}}`
    }
    return ''
  }

  const goExpr = this.convertExpressionToGo(expr.expr)

  if (expr.reactive && expr.slotId) {
    // Reactive expression — wrap in a <span> with hydration marker
    return `<span ${this.renderSlotMarker(expr.slotId)}>{{${goExpr}}}</span>`
  }

  return `{{${goExpr}}}`
}
```

### Expression Translation

The core of the Go Template adapter is converting JavaScript expressions to Go template syntax. Key transformations:

```typescript
private convertExpressionToGo(jsExpr: string): string {
  // Property access: props.name → .Name
  // Signal getter:   count()   → .Count
  // Comparison:      a === b   → eq .A .B
  // Arithmetic:      a + b     → bf_add .A .B
  // Logical:         a && b    → and .A .B
  // Negation:        !a        → not .A

  // The Go adapter uses parseExpression() to get a structured AST,
  // then renders each node in the AST to Go template syntax.
  const parsed = parseExpression(jsExpr)
  if (parsed && isSupported(parsed)) {
    return this.renderParsedExpr(parsed)
  }

  // Fallback for unsupported expressions
  return jsExpr
}
```

The `parseExpression()` utility from `@barefootjs/jsx` parses JavaScript expressions into a structured AST (`ParsedExpr`), which the adapter then renders node-by-node into Go template syntax.


## Step 5: Implement Conditional Rendering

Ternary expressions in JSX become `{{if}}...{{else}}...{{end}}` blocks:

```typescript
renderConditional(cond: IRConditional): string {
  // @client conditionals use comment markers
  if (cond.clientOnly) {
    if (cond.slotId) {
      return `{{bfComment "cond-start:${cond.slotId}"}}{{bfComment "cond-end:${cond.slotId}"}}`
    }
    return ''
  }

  const condition = this.convertExpressionToGo(cond.condition)
  const whenTrue = this.renderNode(cond.whenTrue)
  const whenFalse = this.renderNode(cond.whenFalse)

  return `{{if ${condition}}}${whenTrue}{{else}}${whenFalse}{{end}}`
}
```

**Input (JSX):**
```tsx
{isActive ? <span>Active</span> : <span>Inactive</span>}
```

**Output (Go Template):**
```go-template
{{if .IsActive}}<span>Active</span>{{else}}<span>Inactive</span>{{end}}
```


## Step 6: Implement Loop Rendering

Array `.map()` calls become `{{range}}...{{end}}` blocks. The Go adapter also handles `.filter().map()` and `.sort().map()` chains:

```typescript
renderLoop(loop: IRLoop): string {
  const children = this.renderChildren(loop.children)
  const array = this.convertExpressionToGo(loop.array)

  // .filter().map() → {{range bf_filter .Items "Field" value}}
  if (loop.filterPredicate) {
    const filterExpr = this.renderFilterExpression(loop)
    return `{{range ${filterExpr}}}${children}{{end}}`
  }

  // .sort().map() → {{range bf_sort .Items "Field" "asc"}}
  if (loop.sortComparator) {
    return `{{range bf_sort ${array} "${loop.sortComparator.field}" "${loop.sortComparator.direction}"}}${children}{{end}}`
  }

  // Plain .map() → {{range .Items}}
  return `{{range ${array}}}${children}{{end}}`
}
```

**Input (JSX):**
```tsx
{items.map(item => <li>{item.name}</li>)}
```

**Output (Go Template):**
```go-template
{{range .Items}}<li>{{.Name}}</li>{{end}}
```


## Step 7: Implement Component Rendering

Nested components are rendered using Go's `{{template}}` action:

```typescript
renderComponent(comp: IRComponent): string {
  // Render the child component using {{template "ChildName" .ChildProps}}
  // The Props struct contains a pre-built field for each child instance
  const fieldName = this.getComponentFieldName(comp)

  return `{{template "${comp.name}" .${fieldName}}}`
}
```

**Input (JSX):**
```tsx
<TodoItem task={item} />
```

**Output (Go Template):**
```go-template
{{template "TodoItem" .TodoItemSlot3}}
```

The parent's Go `Props` struct contains a `TodoItemSlot3` field of type `TodoItemProps`, pre-built by the `NewTodoListProps()` constructor.


## Step 8: Implement Hydration Markers

These methods generate the `data-bf-*` attributes in Go template syntax:

```typescript
renderScopeMarker(instanceIdExpr: string): string {
  return `data-bf-scope="{{${instanceIdExpr}}}"`
}

renderSlotMarker(slotId: string): string {
  return `data-bf="${slotId}"`
}

renderCondMarker(condId: string): string {
  return `data-bf-cond="${condId}"`
}
```

**Example output:**
```html
<div data-bf-scope="{{.ScopeID}}" data-bf="slot_0">...</div>
```


## Step 9: Implement Type Generation

For typed backend languages, `generateTypes()` produces type definitions. The Go adapter generates structs and a constructor function:

```typescript
generateTypes(ir: ComponentIR): string | null {
  const lines: string[] = []
  lines.push(`package ${this.options.packageName}`)
  lines.push('')

  const name = ir.metadata.componentName

  // Input struct — external API
  lines.push(`type ${name}Input struct {`)
  lines.push('\tScopeID string')
  for (const param of ir.metadata.propsParams) {
    const goType = this.typeInfoToGo(param.type, param.defaultValue)
    lines.push(`\t${this.capitalize(param.name)} ${goType}`)
  }
  lines.push('}')
  lines.push('')

  // Props struct — internal representation with hydration fields
  lines.push(`type ${name}Props struct {`)
  lines.push('\tScopeID string `json:"scopeID"`')
  lines.push('\tScripts *bf.ScriptCollector `json:"-"`')
  for (const param of ir.metadata.propsParams) {
    const goType = this.typeInfoToGo(param.type, param.defaultValue)
    lines.push(`\t${this.capitalize(param.name)} ${goType} \`json:"${param.name}"\``)
  }
  lines.push('}')
  lines.push('')

  // Constructor
  lines.push(`func New${name}Props(in ${name}Input) ${name}Props {`)
  lines.push('\tscopeID := in.ScopeID')
  lines.push('\tif scopeID == "" {')
  lines.push(`\t\tscopeID = "${name}_" + randomID(6)`)
  lines.push('\t}')
  lines.push(`\treturn ${name}Props{`)
  lines.push('\t\tScopeID: scopeID,')
  for (const param of ir.metadata.propsParams) {
    lines.push(`\t\t${this.capitalize(param.name)}: in.${this.capitalize(param.name)},`)
  }
  lines.push('\t}')
  lines.push('}')

  return lines.join('\n')
}
```

For dynamically-typed backends, return `null` from `generateTypes()`.


## Step 10: Script Registration

Client components need their JavaScript loaded in the browser. The Go adapter registers scripts at the beginning of each component template:

```typescript
private generateScriptRegistrations(ir: ComponentIR): string {
  if (!this.hasClientInteractivity(ir)) {
    return ''
  }

  const registrations: string[] = []
  registrations.push('{{.Scripts.Register "/static/client/barefoot.js"}}')
  registrations.push(`{{.Scripts.Register "/static/client/${ir.metadata.componentName}.client.js"}}`)

  return `{{if .Scripts}}${registrations.join('')}{{end}}\n`
}
```

The `ScriptCollector` on the Go server tracks which scripts are needed and ensures each is included at most once in the page output.


## Testing Your Adapter

Use the compiler's test infrastructure to verify your adapter output:

```typescript
import { compileJsxToIR } from '@barefootjs/jsx'
import { GoTemplateAdapter } from './go-template-adapter'

const source = `
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial)
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
    </div>
  )
}
`

const ir = compileJsxToIR(source)
const adapter = new GoTemplateAdapter()
const output = adapter.generate(ir)

console.log(output.template)
// {{define "Counter"}}
// {{if .Scripts}}{{.Scripts.Register "/static/client/barefoot.js"}}{{.Scripts.Register "/static/client/Counter.client.js"}}{{end}}
// <div data-bf-scope="{{.ScopeID}}"><p data-bf="slot_0">{{.Count}}</p><button data-bf="slot_1">+1</button>...</div>
// {{end}}

console.log(output.types)
// package components
//
// type CounterInput struct { ... }
// type CounterProps struct { ... }
// func NewCounterProps(in CounterInput) CounterProps { ... }
```


## Checklist

When building a custom adapter, ensure you handle:

- [ ] All IR node types (`element`, `text`, `expression`, `conditional`, `loop`, `component`, `fragment`, `slot`, `if-statement`, `provider`)
- [ ] Hydration markers (`data-bf-scope`, `data-bf`, `data-bf-cond`) on interactive elements
- [ ] Static vs. dynamic attributes
- [ ] Boolean HTML attributes (`disabled`, `checked`, etc.)
- [ ] Void HTML elements (`<input>`, `<br>`, `<img>`, etc.)
- [ ] Signal getter stubs for server-side initial values
- [ ] Props serialization (`<script data-bf-props>` tag) for client hydration
- [ ] Script registration for client JS loading
- [ ] `/* @client */` directive (skip client-only expressions server-side)
- [ ] Spread attributes (`{...props}`)
- [ ] Nested component scope passing
- [ ] Type generation (for typed backend languages)

### Reference Implementations

- **GoTemplateAdapter** (`packages/go-template/src/adapter/go-template-adapter.ts`) — Full production adapter with type generation, expression parsing, and array method translation
- **HonoAdapter** (`packages/hono/src/adapter/hono-adapter.ts`) — JSX-to-JSX adapter with script collection via Hono's request context
- **TestAdapter** (`packages/jsx/src/adapters/test-adapter.ts`) — Minimal reference implementation for testing
