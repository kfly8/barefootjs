/**
 * BarefootJS + Hono Todo SPA Server
 * 
 * REST API for todos with client-side rendering
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
import { TodoApp } from './dist/TodoApp'

const app = new Hono()

// In-memory todo storage (for demo purposes)
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

// Middleware
app.use(renderer)

app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// Web UI
app.get('/', (c) => {
  return c.render(
    <div>
      <h1>BarefootJS Todo SPA</h1>
      <TodoApp />
    </div>
  )
})

// REST API
app.get('/api/todos', (c) => {
  return c.json(todos)
})

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

app.put('/api/todos/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
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

app.delete('/api/todos/:id', (c) => {
  const id = parseInt(c.req.param('id'))
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
