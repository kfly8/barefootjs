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

`.filter().map()` chains work when the predicate is simple (single expression):

```tsx
// ✅ Simple predicate — works
{todos().filter(t => !t.done).map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

Complex predicates (block bodies, multiple statements) require [`/* @client */`](./client-directive.md):

```tsx
// ❌ Block body predicate — needs @client
{/* @client */ todos().filter(t => {
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

BarefootJS compiles JSX into server templates (Go `html/template`, Hono JSX, etc.) **and** client JS. Some JavaScript expressions cannot be translated into server template syntax. These patterns require the [`/* @client */` directive](./client-directive.md) to evaluate on the client only.

### Expressions that need `/* @client */`

**Chained higher-order methods that produce a scalar value:**

```tsx
<strong>{/* @client */ todos().filter(t => !t.done).length}</strong>
{/* @client */ todos().filter(t => !t.done).length === 1 ? 'item' : 'items'}
```

**`.every()` / `.some()` as attribute values:**

```tsx
<input type="checkbox" checked={/* @client */ todos().every(t => t.done)} />
```

**Conditional rendering based on filtered results:**

```tsx
{/* @client */ todos().filter(t => t.done).length > 0 && (
  <button onClick={handleClearCompleted}>Clear completed</button>
)}
```

### Patterns that are not supported

The following patterns cannot be compiled and will produce an error:

- **Nested higher-order methods:** `items().filter(x => x.sub.filter(...))`
- **Unsupported array methods:** `.find()`, `.reduce()`, `.forEach()`, `.flatMap()`, `.sort()`
- **Function expressions:** `function(x) { return x }`
- **Destructuring in predicates:** `.filter(({done}) => done)`

Use `/* @client */` as the workaround for all of these.

See the [TodoApp example](https://github.com/kfly8/barefootjs/blob/main/examples/shared/components/TodoApp.tsx) for a real-world component using `/* @client */` throughout.
