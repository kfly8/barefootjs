/**
 * BarefootJS + Hono SSR Server
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
import { Counter } from './dist/Counter'
import { Toggle } from './dist/Toggle'
import { TodoApp } from './dist/TodoApp'

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
          <li><a href="/todos">Todo (SSR + API)</a></li>
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

// Todo - Web UI
app.get('/todos', (c) => {
  return c.render(
    <div>
      <TodoApp initialTodos={todos} />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// REST API - Get all todos
app.get('/api/todos', (c) => {
  return c.json(todos)
})

// REST API - Create todo
app.post('/api/todos', async (c) => {
  const body = await c.req.json()
  const newTodo: Todo = {
    id: nextId++,
    text: body.text,
    done: false,
  }
  todos.push(newTodo)
  return c.json(newTodo, 201)
})

// REST API - Update todo
app.put('/api/todos/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  const body = await c.req.json()
  const todo = todos.find(t => t.id === id)
  
  if (!todo) {
    return c.json({ error: 'Todo not found' }, 404)
  }
  
  if (body.text !== undefined) {
    todo.text = body.text
  }
  if (body.done !== undefined) {
    todo.done = body.done
  }
  
  return c.json(todo)
})

// REST API - Delete todo
app.delete('/api/todos/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  const index = todos.findIndex(t => t.id === id)
  
  if (index === -1) {
    return c.json({ error: 'Todo not found' }, 404)
  }
  
  todos.splice(index, 1)
  return c.json({ success: true })
})

export default {
  port: 3000,
  fetch: app.fetch,
}
