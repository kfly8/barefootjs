# JSX Compatibility

BarefootJS uses standard JSX syntax. If you have written React or SolidJS components, most patterns work as you expect.


## Control Flow

Standard JavaScript control flow in JSX works:

```tsx
// Ternary
{count() > 0 ? <p>{count()} items</p> : <p>No items</p>}

// Logical AND
{isLoggedIn() && <Dashboard />}

// Conditional return
if (status === 'empty') {
  return <p>No items yet.</p>
}
return <div>...</div>
```


## List Rendering

`.map()` renders lists:

```tsx
{todos().map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

`.filter().map()` chains work when the predicate uses supported expressions — simple single expressions and block bodies with variable declarations, `if`/`return` statements:

```tsx
// ✅ Simple predicate
{todos().filter(t => !t.done).map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}

// ✅ Block body with simple statements — also works
{todos().filter(t => {
  const f = filter()
  if (f === 'active') return !t.done
  if (f === 'completed') return t.done
  return true
}).map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```


## Event Handling

`on*` attributes bind event handlers. The handler receives the native DOM event:

```tsx
<button onClick={() => setCount(n => n + 1)}>+1</button>
<input onInput={(e) => setText((e.target as HTMLInputElement).value)} />
<input onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
```


## Dynamic Attributes

Expressions in attributes are reactive:

```tsx
<button disabled={!accepted()}>Submit</button>
<a className={filter() === 'all' ? 'selected' : ''}>All</a>
<div style={`background: ${accepted() ? '#4caf50' : '#ccc'}`}>...</div>
```


## Limitations

BarefootJS compiles JSX into server templates (Go `html/template`, Hono JSX, etc.) **and** client JS. Some JavaScript expressions cannot be translated into server template syntax.

When the compiler encounters an unsupported expression, it **silently falls back to client-only evaluation** — the same behavior as adding [`/* @client */`](./client-directive.md). No compile error is produced. The expression works correctly, but the server renders a placeholder instead of the initial value.

If you want to make this fallback explicit and intentional, add `/* @client */` to the expression. This documents the intent and makes it clear to other developers that the expression is client-only by design.

### Patterns that fall back to client-only

**Nested higher-order methods** — a higher-order method inside a predicate of another:

```tsx
// Falls back to client-only (server renders placeholder)
{items().filter(x => x.tags().filter(t => t.active).length > 0)}

// Make it explicit with /* @client */
{/* @client */ items().filter(x => x.tags().filter(t => t.active).length > 0)}
```

**Unsupported array methods** — `.find()`, `.reduce()`, `.forEach()`, `.flatMap()`, `.sort()` and others cannot be translated to server template syntax:

```tsx
// Falls back to client-only
{items().find(x => x.id === selectedId())?.name}
```

**Destructuring in predicate parameters** — the compiler requires a single named parameter:

```tsx
// Falls back to client-only
{items().filter(({done}) => done).map(...)}

// ✅ Use a named parameter instead
{items().filter(t => t.done).map(...)}
```

**Function expressions** — `function` keyword syntax is not supported:

```tsx
// Falls back to client-only
{items().filter(function(x) { return x.done })}

// ✅ Use arrow functions instead
{items().filter(x => x.done)}
```

See the [TodoApp example](https://github.com/kfly8/barefootjs/blob/main/examples/shared/components/TodoApp.tsx) for a real-world component using `/* @client */`.
