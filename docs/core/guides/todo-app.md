# Building a Todo App

This tutorial builds a complete Todo app from scratch, covering signals, lists, forms, conditionals, and persistence. By the end you'll have a working app with add, complete, filter, and local storage.

## What We're Building

A todo app with:
- Add new todos via form input
- Toggle todo completion
- Filter: All / Active / Completed
- Persist to `localStorage`
- Server-rendered with client hydration

---

## Setup

Create a new project with Hono:

<!-- tabs:pm -->
<!-- tab:npm -->
```bash
mkdir todo-app && cd todo-app
npm init -y
npm install hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
```
<!-- tab:bun -->
```bash
mkdir todo-app && cd todo-app
bun init
bun add hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
```
<!-- tab:pnpm -->
```bash
mkdir todo-app && cd todo-app
pnpm init
pnpm add hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
```
<!-- tab:yarn -->
```bash
mkdir todo-app && cd todo-app
yarn init -y
yarn add hono @barefootjs/jsx @barefootjs/dom @barefootjs/hono
```
<!-- /tabs -->

---

## Step 1: Define the Data Model

```tsx
// types.ts
export interface Todo {
  id: string
  text: string
  done: boolean
}

export type Filter = 'all' | 'active' | 'completed'
```

---

## Step 2: Build the TodoApp Component

```tsx
// components/TodoApp.tsx
"use client"
import { createSignal, createMemo, createEffect, onMount } from '@barefootjs/dom'

interface Todo {
  id: string
  text: string
  done: boolean
}

type Filter = 'all' | 'active' | 'completed'

export function TodoApp() {
  // State
  const [todos, setTodos] = createSignal<Todo[]>([])
  const [filter, setFilter] = createSignal<Filter>('all')
  const [newText, setNewText] = createSignal('')

  // Derived state
  const filteredTodos = createMemo(() => {
    const f = filter()
    return todos().filter(t =>
      f === 'all' ? true :
      f === 'active' ? !t.done :
      t.done
    )
  })

  const activeCount = createMemo(() =>
    todos().filter(t => !t.done).length
  )

  // Actions
  function addTodo() {
    const text = newText().trim()
    if (!text) return
    setTodos(prev => [...prev, { id: crypto.randomUUID(), text, done: false }])
    setNewText('')
  }

  function toggleTodo(id: string) {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
    )
  }

  function removeTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  // Persistence
  onMount(() => {
    const saved = localStorage.getItem('todos')
    if (saved) setTodos(JSON.parse(saved))
  })

  createEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos()))
  })

  return (
    <div class="todo-app">
      <h1>Todos</h1>

      {/* Add form */}
      <form onSubmit={(e) => { e.preventDefault(); addTodo() }}>
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newText()}
          onInput={(e) => setNewText(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {/* Filter tabs */}
      <div class="filters">
        <button
          class={filter() === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >All</button>
        <button
          class={filter() === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >Active</button>
        <button
          class={filter() === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >Completed</button>
      </div>

      {/* Todo list */}
      <ul class="todo-list">
        {filteredTodos().map(todo => (
          <li key={todo.id} class={todo.done ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <p class="count">{activeCount()} items left</p>
    </div>
  )
}
```

---

## Step 3: Understand What the Compiler Does

Let's trace through the compilation of this component.

### Signals and Memos Detected

| Name | Type | Initial Value |
|------|------|---------------|
| `todos` | `Signal<Todo[]>` | `[]` |
| `filter` | `Signal<Filter>` | `'all'` |
| `newText` | `Signal<string>` | `''` |
| `filteredTodos` | `Memo<Todo[]>` | (computed) |
| `activeCount` | `Memo<number>` | (computed) |

### Reactive Expressions

| Expression | Reactive? | Generated Code |
|-----------|-----------|----------------|
| `{newText()}` | Yes | `createEffect` for `value` attr |
| `{filter() === 'all' ? 'active' : ''}` | Yes | `createEffect` for `className` |
| `{filteredTodos().map(...)}` | Yes | `reconcileList` |
| `{activeCount()}` | Yes | `createEffect` for text |
| `{todo.text}` | No | Static text in loop template |

### Generated Output

**Server template:** Full HTML with hydration markers (`data-bf-scope`, `data-bf`). The list is server-rendered empty (initial state is `[]`).

**Client JS:**
1. Creates signals (`todos`, `filter`, `newText`)
2. Creates memos (`filteredTodos`, `activeCount`)
3. Binds form submit, input events, filter button clicks
4. Sets up `reconcileList` for the todo list
5. Sets up effects for reactive class names and text
6. Runs `onMount` to load from localStorage
7. Runs persistence effect

---

## Step 4: Create the Server

<!-- tabs:adapter -->
<!-- tab:Hono -->
```tsx
// server.tsx
import { Hono } from 'hono'
import { TodoApp } from './dist/components/TodoApp'

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <title>Todo App</title>
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <TodoApp />
        <script type="module" src="/static/components/barefoot.js"></script>
        <script type="module" src="/static/components/TodoApp.js"></script>
      </body>
    </html>
  )
})

export default app
```
<!-- tab:Go Template -->
```go
package main

import (
    "html/template"
    "net/http"
)

var tmpl = template.Must(template.ParseGlob("templates/*.tmpl"))

func main() {
    http.Handle("/static/", http.StripPrefix("/static/",
        http.FileServer(http.Dir("static"))))

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        tmpl.ExecuteTemplate(w, "page", nil)
    })

    http.ListenAndServe(":8080", nil)
}
```
<!-- /tabs -->

---

## Step 5: Add Styles

```css
/* styles.css */
.todo-app {
  max-width: 500px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
}

.todo-app form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.todo-app input[type="text"] {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filters {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.filters button {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.filters button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.todo-list li.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-list li span {
  flex: 1;
}

.todo-list li button {
  background: none;
  border: none;
  color: #cc0000;
  cursor: pointer;
  font-size: 1.2rem;
}

.count {
  color: #666;
  font-size: 0.9rem;
}
```

---

## Step 6: Build and Run

```bash
# Compile components
npm run build

# Start dev server
npm run dev
```

Open http://localhost:3000 and try:
1. Type a todo and press Enter or click "Add"
2. Click the checkbox to toggle completion
3. Use the filter buttons to switch views
4. Refresh the page — todos persist via localStorage

---

## Key Takeaways

### Signals vs React State

In React, you'd need `useCallback` for `addTodo`, `toggleTodo`, `removeTodo` to avoid stale closures. In BarefootJS, signals always return the current value — no stale closures:

```tsx
// BarefootJS — always reads current value
function addTodo() {
  const text = newText().trim()  // Always current
  setTodos(prev => [...prev, { id: crypto.randomUUID(), text, done: false }])
}
```

### Auto-Tracked Effects

The persistence effect automatically re-runs when `todos()` changes:

```tsx
createEffect(() => {
  localStorage.setItem('todos', JSON.stringify(todos()))
  // No dependency array needed — todos() is auto-tracked
})
```

### Efficient List Updates

`reconcileList` uses key-based reconciliation. When you toggle a single todo:
- Only that list item's DOM is updated
- Other items are untouched
- Focused inputs retain focus

### Filter is a Memo

`filteredTodos` is a `createMemo` that depends on both `todos()` and `filter()`. Changing either re-computes the filtered list and triggers `reconcileList`.

---

## Exercises

Extend the app on your own:

1. **Clear completed** — Add a button to remove all completed todos
2. **Edit in place** — Double-click a todo to edit its text
3. **Drag to reorder** — Implement drag-and-drop reordering
4. **Server persistence** — Replace localStorage with a REST API
5. **Multiple lists** — Add a sidebar with named todo lists
