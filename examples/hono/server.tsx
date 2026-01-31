/**
 * BarefootJS + Hono/JSX SSR Server
 *
 * Uses hono/jsx with BarefootJS components.
 * Components are imported as JSX and rendered server-side.
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { Suspense } from 'hono/jsx/streaming'
import { renderer } from './renderer'
import Counter from '@/components/Counter'
import Toggle from '@/components/Toggle'
import TodoApp from '@/components/TodoApp'
import TodoAppSSR from '@/components/TodoAppSSR'
import ReactiveProps from '@/components/ReactiveProps'
import Form from '@/components/Form'
import { AsyncCounterWrapper } from './components/AsyncCounterWrapper'

const app = new Hono()

app.use(renderer)

app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// Serve shared styles
app.use('/shared/*', serveStatic({
  root: '../shared',
  rewriteRequestPath: (path) => path.replace('/shared', ''),
}))

// In-memory todo storage
type Todo = { id: number; text: string; done: boolean }
let todos: Todo[] = [
  { id: 1, text: 'Setup project', done: false },
  { id: 2, text: 'Create components', done: false },
  { id: 3, text: 'Write tests', done: true },
]
let nextId = 4

// Pages - using JSX components directly
app.get('/', (c) => {
  return c.render(
    <div>
      <h1>BarefootJS + Hono/JSX Examples</h1>
      <nav>
        <ul>
          <li><a href="/counter">Counter</a></li>
          <li><a href="/toggle">Toggle</a></li>
          <li><a href="/todos">Todo (@client)</a></li>
          <li><a href="/todos-ssr">Todo (no @client markers)</a></li>
          <li><a href="/async-counter">Async Counter (Suspense + BarefootJS)</a></li>
          <li><a href="/reactive-props">Reactive Props (Reactivity Model Test)</a></li>
          <li><a href="/form">Form (Checkbox + Button)</a></li>
        </ul>
      </nav>
    </div>
  )
})

app.get('/counter', (c) => {
  return c.render(
    <div>
      <h1>Counter Example</h1>
      <Counter />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

app.get('/toggle', (c) => {
  const toggleItems = [
    { label: 'Setting 1', defaultOn: true },
    { label: 'Setting 2', defaultOn: false },
    { label: 'Setting 3', defaultOn: false },
  ]
  return c.render(
    <div>
      <h1>Toggle Example</h1>
      <Toggle toggleItems={toggleItems} />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

app.get('/todos', (c) => {
  return c.render(
    <div id="app">
      <TodoApp initialTodos={todos} />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

app.get('/todos-ssr', (c) => {
  return c.render(
    <div id="app">
      <TodoAppSSR initialTodos={todos} />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Reactive Props test page (verifies reactivity model from spec/compiler.md)
app.get('/reactive-props', (c) => {
  return c.render(
    <div>
      <h1>Reactive Props Test</h1>
      <ReactiveProps />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Form example (checkbox + button interaction)
app.get('/form', (c) => {
  return c.render(
    <div>
      <h1>Form Example</h1>
      <Form />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Async Counter with Suspense + BarefootJS (streaming + interactivity)
app.get('/async-counter', (c) => {
  return c.render(
    <div>
      <h1>Async Counter with Suspense + BarefootJS</h1>
      <Suspense fallback={<p className="loading">Loading counter...</p>}>
        <AsyncCounterWrapper />
      </Suspense>
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// REST API
app.get('/api/todos', (c) => c.json(todos))

app.post('/api/todos', async (c) => {
  const body = await c.req.json()
  const newTodo: Todo = { id: nextId++, text: body.text, done: false }
  todos.push(newTodo)
  return c.json(newTodo, 201)
})

app.put('/api/todos/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const body = await c.req.json()
  const todo = todos.find(t => t.id === id)
  if (!todo) return c.json({ error: 'Todo not found' }, 404)

  if (body.text !== undefined) todo.text = body.text
  if (body.done !== undefined) todo.done = body.done
  return c.json(todo)
})

app.delete('/api/todos/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'Invalid ID' }, 400)

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) return c.json({ error: 'Todo not found' }, 404)

  todos.splice(index, 1)
  return c.json({ success: true })
})

// Reset todos to initial state (for testing)
app.post('/api/todos/reset', (c) => {
  todos = [
    { id: 1, text: 'Setup project', done: false },
    { id: 2, text: 'Create components', done: false },
    { id: 3, text: 'Write tests', done: true },
  ]
  nextId = 4
  return c.json({ success: true })
})

export default { port: 3001, fetch: app.fetch }
