# `/* @client */` Directive

The `/* @client */` comment directive marks a JSX expression for **client-only evaluation**. The server renders a placeholder; the browser evaluates the expression at runtime.

```tsx
{/* @client */ expression}
```


## When to Use

Use `/* @client */` when an expression cannot be compiled into a server template. This typically applies to complex JavaScript operations that have no equivalent in template languages like Go `html/template`.

Common cases:

- Nested higher-order methods (`.filter(x => x.items().filter(...))`)
- Unsupported array methods (`.find()`, `.reduce()`, `.forEach()`, etc.)
- Any pattern the compiler flags as unsupported


## How It Works

Without `/* @client */`, the compiler tries to translate the expression into both a server template value and a client-side effect. With the directive, the server outputs a comment marker and the client JS evaluates the expression entirely:

**Server output:**

```html
<!--bf-client:slot_5-->
```

**Client JS:**

```js
// The expression is evaluated on the client and inserted into the DOM
insert(scope, 'slot_5', () => todos().filter(t => !t.done).length)
```


## Examples

### Unsupported patterns

Patterns that the compiler cannot translate to server templates require `/* @client */`:

```tsx
// Nested higher-order methods
{/* @client */ items().filter(x => x.tags().filter(t => t.active).length > 0)}

// Unsupported array methods
{/* @client */ items().find(x => x.id === selectedId())}
```

### Explicit client-only evaluation

Even for patterns the compiler supports, you can use `/* @client */` to skip server evaluation. The [TodoApp example](https://github.com/kfly8/barefootjs/blob/main/examples/shared/components/TodoApp.tsx) uses this approach:

```tsx
// These expressions CAN compile without @client, but the developer
// chose client-only evaluation here
checked={/* @client */ todos().every(t => t.done)}

<strong>{/* @client */ todos().filter(t => !t.done).length}</strong>
```

Compare with the [TodoAppSSR version](https://github.com/kfly8/barefootjs/blob/main/examples/shared/components/TodoAppSSR.tsx), which omits `/* @client */` and lets the compiler generate server template equivalents for the same expressions.


## Trade-off

`/* @client */` means the expression has **no server-rendered content** — the user sees the placeholder until client JS loads and evaluates. Use it only when the compiler cannot generate a server template equivalent. For expressions that the compiler can handle, omit the directive to get server-rendered initial values.
