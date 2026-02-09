# Props & Type Safety

Component props in BarefootJS are typed with TypeScript interfaces. The compiler preserves type information through compilation, and the adapter uses it to generate type-safe server templates.


## Defining Props

Define props as an interface or type alias and annotate the function parameter:

```tsx
interface GreetingProps {
  name: string
  greeting?: string
}

export function Greeting(props: GreetingProps) {
  return <h1>{props.greeting ?? 'Hello'}, {props.name}</h1>
}
```


## Default Values

Use nullish coalescing (`??`) or default parameter syntax for default values:

```tsx
// Nullish coalescing — works with props object access
function Button(props: { variant?: 'default' | 'primary'; children?: Child }) {
  const variant = props.variant ?? 'default'
  return <button className={variant}>{props.children}</button>
}

// Default parameters — works with destructuring
function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

> **Note:** Default parameter syntax destructures the prop, which captures the value once. This is fine when the value is used as an initial value for a signal. See the reactivity section below.


## Extending HTML Attributes

For components that wrap native elements, extend the corresponding HTML attribute type:

```tsx
import type { ButtonHTMLAttributes } from '@barefootjs/jsx'

interface ButtonProps extends ButtonHTMLAttributes {
  variant?: 'default' | 'primary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

function Button({ className = '', variant = 'default', size = 'md', ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest} />
}
```

This lets callers pass any standard button attribute (`type`, `disabled`, `aria-label`, etc.) alongside custom props.


## Rest Spreading

Use rest syntax to forward unknown props to the underlying element:

```tsx
function Card({ title, children, ...rest }: { title: string; children?: Child } & HTMLAttributes) {
  return (
    <div {...rest}>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

```tsx
// Caller can pass className, style, data-* attributes, etc.
<Card title="Dashboard" className="shadow-lg" data-testid="dashboard-card">
  <p>Content</p>
</Card>
```


## Props and Reactivity

How you access props determines whether reactive updates propagate. This is the most important behavioral difference from React.

### Direct Access — Reactive

Accessing props via `props.xxx` maintains reactivity. Each access calls the underlying getter:

```tsx
function Display(props: { value: number }) {
  createEffect(() => {
    console.log(props.value) // Re-runs when parent updates value
  })
  return <span>{props.value}</span>
}
```

### Destructuring — Captures Once

Destructuring calls the getter immediately and stores the result. The value does not update:

```tsx
function Display({ value }: { value: number }) {
  createEffect(() => {
    console.log(value) // Stale — captured at component init
  })
  return <span>{value}</span>
}
```

The compiler emits warning `BF043` when it detects destructuring in a client component:

```
warning[BF043]: Props destructuring breaks reactivity

  --> src/components/Display.tsx:1:18
   |
 1 | function Display({ value }: { value: number }) {
   |                  ^^^^^^^^^
   |
   = help: Access props via `props.value` to maintain reactivity
```

### When Destructuring Is Safe

Destructuring is fine when:

- The value is used as an **initial value** for a signal
- The value never changes (e.g., `id`, static label)

```tsx
// @bf-ignore props-destructuring
function Counter({ initial }: { initial: number }) {
  const [count, setCount] = createSignal(initial) // OK — initial value only
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

Use `@bf-ignore props-destructuring` to suppress the warning when destructuring is intentional.

### Summary

| Pattern | Reactive? | Use when |
|---------|-----------|----------|
| `props.value` | Yes | You need live updates from parent |
| `const { value } = props` | No | Value is used once (e.g., initial state) |
| `createSignal(props.value)` | `props.value` is reactive, signal is independent | Creating local state from a prop |

For more details, see [Props Reactivity](../reactivity/props-reactivity.md).


## How Props Are Compiled

When a parent passes a dynamic expression, the compiler transforms it into a getter on the props object:

```tsx
// Parent
<Child value={count()} />

// Compiled props object
{ get value() { return count() } }
```

- `props.value` calls the getter, which calls `count()`, so the dependency is tracked
- `const { value } = props` calls the getter once, stores the number, no further tracking

Static values (string literals, numbers, booleans) are passed directly without getters.


## Type Preservation

The compiler captures the full TypeScript type information for props and carries it through the IR. Adapters use this information to generate type-safe output:

<!-- tabs:adapter -->
<!-- tab:Hono -->
```tsx
// Props types are preserved in the Hono template
export function Greeting(props: { name: string; greeting?: string }) {
  return <h1 data-bf-scope="Greeting">{props.greeting ?? 'Hello'}, {props.name}</h1>
}
```
<!-- tab:Go Template -->
```go
// _types.go — Generated struct with correct Go types
type GreetingProps struct {
    Name     string  `json:"name"`
    Greeting *string `json:"greeting,omitempty"`
}
```
```go-template
{{define "Greeting"}}
<h1 data-bf-scope="{{.ScopeID}}">{{with .Greeting}}{{.}}{{else}}Hello{{end}}, {{.Name}}</h1>
{{end}}
```
<!-- /tabs -->

TypeScript `string` maps to Go `string`, `number` maps to `float64`, optional props map to pointer types, and union types map to Go type aliases. This means a type error in your JSX source is caught at compile time, and the generated server code is also type-safe.
