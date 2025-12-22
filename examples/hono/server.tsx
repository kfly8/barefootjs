/**
 * BarefootJS + Hono SSR Server
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
import { Counter } from './dist/Counter'
import { Toggle } from './dist/Toggle'

const app = new Hono()

app.use(renderer)

app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// In-memory todo storage
type Todo = {
  id: number
  text: string
  done: boolean
}

let todos: Todo[] = [
  { id: 1, text: 'Setup project', done: false },
  { id: 2, text: 'Create components', done: false },
  { id: 3, text: 'Write tests', done: true },
]
let nextId = 4

// Home
app.get('/', (c) => {
  return c.render(
    <div>
      <h1>BarefootJS + Hono Examples</h1>
      <nav>
        <ul>
          <li><a href="/counter">Counter</a></li>
          <li><a href="/toggle">Toggle</a></li>
          <li><a href="/todos">Todo (SSR)</a></li>
        </ul>
      </nav>
    </div>
  )
})

// Counter
app.get('/counter', (c) => {
  return c.render(
    <div>
      <h1>Counter Example</h1>
      <Counter />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Toggle
app.get('/toggle', (c) => {
  return c.render(
    <div>
      <h1>Toggle Example</h1>
      <Toggle />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Todo - GET (render todo list)
app.get('/todos', (c) => {
  const doneCount = todos.filter(t => t.done).length
  const totalCount = todos.length
  
  return c.render(
    <div>
      <h1>BarefootJS Todo (SSR)</h1>

      <p class="status">
        Done: <span class="count">{doneCount}</span> / <span class="total">{totalCount}</span>
      </p>

      <form method="POST" action="/todos/add" class="add-form">
        <input
          type="text"
          name="text"
          class="new-todo-input"
          placeholder="Enter new todo..."
          required
        />
        <button type="submit" class="add-btn">Add</button>
      </form>

      <ul class="todo-list">
        {todos.map(todo => (
          <li class={todo.done ? 'todo-item done' : 'todo-item'}>
            <span class="todo-text">{todo.text}</span>
            <form method="POST" action={`/todos/toggle/${todo.id}`} style="display: inline;">
              <button type="submit" class="toggle-btn">
                {todo.done ? 'Undo' : 'Done'}
              </button>
            </form>
            <form method="POST" action={`/todos/delete/${todo.id}`} style="display: inline;">
              <button type="submit" class="delete-btn">Delete</button>
            </form>
          </li>
        ))}
      </ul>
      
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Todo - POST add
app.post('/todos/add', async (c) => {
  const formData = await c.req.formData()
  const text = formData.get('text') as string
  
  if (text && text.trim()) {
    todos.push({ id: nextId++, text: text.trim(), done: false })
  }
  
  return c.redirect('/todos')
})

// Todo - POST toggle
app.post('/todos/toggle/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const todo = todos.find(t => t.id === id)
  if (todo) {
    todo.done = !todo.done
  }
  return c.redirect('/todos')
})

// Todo - POST delete
app.post('/todos/delete/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  todos = todos.filter(t => t.id !== id)
  return c.redirect('/todos')
})

export default {
  port: 3000,
  fetch: app.fetch,
}
