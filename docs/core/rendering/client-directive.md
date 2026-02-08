# `/* @client */` Directive

The `/* @client */` comment directive marks a JSX expression for **client-only evaluation**. The server renders a placeholder; the browser evaluates the expression at runtime.

```tsx
{/* @client */ expression}
```


## When to Use

Use `/* @client */` when an expression cannot be compiled into a server template. This typically applies to complex JavaScript operations that have no equivalent in template languages like Go `html/template`.

Common cases:

- Filter predicates with multiple statements
- Chained methods that produce scalar values (`.filter().length`)
- `.every()` / `.some()` in attributes
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

All examples are from a TodoApp component. See the full source at [`examples/shared/components/TodoApp.tsx`](https://github.com/kfly8/barefootjs/blob/main/examples/shared/components/TodoApp.tsx).

### Text content

```tsx
<strong>{/* @client */ todos().filter(t => !t.done).length}</strong>
```

The server renders `<strong><!--bf-client:slot_5--></strong>`. The client evaluates the filter and inserts the count.

### Attribute value

```tsx
<input
  type="checkbox"
  checked={/* @client */ todos().every(t => t.done)}
/>
```

The server renders the checkbox without the `checked` attribute. The client evaluates `.every()` and sets it.

### List rendering with complex filter

```tsx
{/* @client */ todos().filter(t => {
  const f = filter()
  if (f === 'active') return !t.done
  if (f === 'completed') return t.done
  return true
}).map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

The server renders a comment marker. The client evaluates the filter, renders the list, and manages updates.

### Conditional rendering

```tsx
{/* @client */ todos().filter(t => t.done).length > 0 && (
  <button onClick={handleClearCompleted}>Clear completed</button>
)}
```

The server renders comment markers. The client evaluates the condition and inserts or removes the button.


## Trade-off

`/* @client */` means the expression has **no server-rendered content** — the user sees the placeholder until client JS loads and evaluates. Use it only when the compiler cannot generate a server template equivalent. For expressions that the compiler can handle, omit the directive to get server-rendered initial values.
