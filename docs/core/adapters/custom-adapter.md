# Writing a Custom Adapter

This guide walks through building a custom adapter for a new backend template language. We will build a minimal Jinja2 adapter as a running example.


## Step 1: Implement `TemplateAdapter`

Start by creating a class that implements the `TemplateAdapter` interface, or extends `BaseAdapter`:

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
} from '@barefootjs/jsx'
import { BaseAdapter, type AdapterOutput } from '@barefootjs/jsx'

export class Jinja2Adapter extends BaseAdapter {
  name = 'jinja2'
  extension = '.html.j2'

  generate(ir: ComponentIR): AdapterOutput {
    const body = this.renderNode(ir.root)
    const template = `{# ${ir.metadata.componentName} #}\n{% macro ${ir.metadata.componentName}(props) %}\n${body}\n{% endmacro %}`

    return {
      template,
      extension: this.extension,
    }
  }

  // ... node rendering methods (see below)
}
```


## Step 2: Implement `renderNode()`

The dispatcher routes each IR node to the correct rendering method:

```typescript
renderNode(node: IRNode): string {
  switch (node.type) {
    case 'element':    return this.renderElement(node)
    case 'text':       return (node as IRText).value
    case 'expression': return this.renderExpression(node)
    case 'conditional': return this.renderConditional(node)
    case 'loop':       return this.renderLoop(node)
    case 'component':  return this.renderComponent(node)
    case 'fragment':   return this.renderChildren((node as IRFragment).children)
    case 'slot':       return '{{ caller() }}'
    default:           return ''
  }
}
```


## Step 3: Implement Element Rendering

Elements are the most common node type. You need to:

1. Render the HTML tag and attributes
2. Insert hydration markers (`data-bf-scope`, `data-bf`)
3. Render children recursively

```typescript
renderElement(element: IRElement): string {
  const tag = element.tag
  let attrs = ''

  // Hydration markers
  if (element.needsScope) {
    attrs += ' data-bf-scope="{{ scope_id }}"'
  }
  if (element.slotId) {
    attrs += ` data-bf="${element.slotId}"`
  }

  // Regular attributes
  for (const attr of element.attrs) {
    if (attr.dynamic) {
      attrs += ` ${attr.name}="{{ ${this.toJinja(attr.value)} }}"`
    } else if (attr.value === null) {
      attrs += ` ${attr.name}`
    } else {
      attrs += ` ${attr.name}="${attr.value}"`
    }
  }

  // Event handlers are skipped — they only exist in client JS

  const children = this.renderChildren(element.children)

  if (children) {
    return `<${tag}${attrs}>${children}</${tag}>`
  }
  return `<${tag}${attrs} />`
}
```

**Important:** Event handlers (`element.events`) are not rendered in the server template. They exist only in the client JS.


## Step 4: Implement Expression Rendering

Expressions convert JavaScript syntax to the target template language:

```typescript
renderExpression(expr: IRExpression): string {
  if (expr.clientOnly) {
    return ''  // @client expressions are skipped server-side
  }

  const jinjaExpr = this.toJinja(expr.expr)

  if (expr.slotId) {
    // Reactive expression — wrap in a span with hydration marker
    return `<span data-bf="${expr.slotId}">{{ ${jinjaExpr} }}</span>`
  }

  return `{{ ${jinjaExpr} }}`
}

private toJinja(jsExpr: string): string {
  // Convert JS property access to Jinja2 syntax
  // props.name → props.name (Jinja2 uses dot access too)
  // count()    → count (initial value, not a function call)
  return jsExpr.replace(/\(\)/g, '')
}
```


## Step 5: Implement Conditional Rendering

```typescript
renderConditional(cond: IRConditional): string {
  const condition = this.toJinja(cond.condition)
  const whenTrue = this.renderNode(cond.whenTrue)
  const whenFalse = this.renderNode(cond.whenFalse)

  if (cond.slotId) {
    // Reactive conditional — add hydration marker
    return `{% if ${condition} %}<span data-bf-cond="${cond.slotId}">${whenTrue}</span>{% else %}<span data-bf-cond="${cond.slotId}">${whenFalse}</span>{% endif %}`
  }

  return `{% if ${condition} %}${whenTrue}{% else %}${whenFalse}{% endif %}`
}
```


## Step 6: Implement Loop Rendering

```typescript
renderLoop(loop: IRLoop): string {
  const array = this.toJinja(loop.array)
  const param = loop.param
  const children = this.renderChildren(loop.children)

  if (loop.index) {
    return `{% for ${param}, ${loop.index} in ${array} %}${children}{% endfor %}`
  }
  return `{% for ${param} in ${array} %}${children}{% endfor %}`
}
```


## Step 7: Implement Component Rendering

Nested components are rendered by calling the child component's template:

```typescript
renderComponent(comp: IRComponent): string {
  const props = comp.props
    .map(p => `${p.name}=${p.dynamic ? p.value : `"${p.value}"`}`)
    .join(', ')

  const children = this.renderChildren(comp.children)

  if (children) {
    return `{% call ${comp.name}(${props}) %}${children}{% endcall %}`
  }
  return `{{ ${comp.name}(${props}) }}`
}
```


## Step 8: Implement Hydration Markers

```typescript
renderScopeMarker(instanceIdExpr: string): string {
  return `data-bf-scope="{{ ${instanceIdExpr} }}"`
}

renderSlotMarker(slotId: string): string {
  return `data-bf="${slotId}"`
}

renderCondMarker(condId: string): string {
  return `data-bf-cond="${condId}"`
}
```


## Optional: Type Generation

If your backend language is typed, implement `generateTypes()`:

```typescript
generateTypes(ir: ComponentIR): string | null {
  // Return type definitions in the target language,
  // or null if not applicable
  return null
}
```


## Testing Your Adapter

Use the compiler's test infrastructure to verify your adapter output:

```typescript
import { compileJsxToIR } from '@barefootjs/jsx'
import { Jinja2Adapter } from './jinja2-adapter'

const source = `
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter({ initial = 0 }) {
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
const adapter = new Jinja2Adapter()
const output = adapter.generate(ir)

console.log(output.template)
```


## Checklist

When building a custom adapter, ensure you handle:

- [ ] All IR node types (`element`, `text`, `expression`, `conditional`, `loop`, `component`, `fragment`, `slot`)
- [ ] Hydration markers (`data-bf-scope`, `data-bf`, `data-bf-cond`) on interactive elements
- [ ] Static vs. dynamic attributes
- [ ] Boolean HTML attributes (`disabled`, `checked`, etc.)
- [ ] Signal getter stubs for server-side initial values
- [ ] Props serialization (`<script data-bf-props>` tag) for client hydration
- [ ] Script registration for client JS loading
- [ ] `/* @client */` directive (skip client-only expressions server-side)
- [ ] Spread attributes (`{...props}`)
- [ ] Nested component scope passing

See the [TestAdapter](https://github.com/nicholasgriffintn/barefootjs/blob/main/packages/jsx/src/adapters/test-adapter.ts) for a minimal reference implementation.
