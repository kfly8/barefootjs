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
import Dashboard from '@/components/Dashboard'
import Game from '@/components/Game'
import FizzBuzzCounter from '@/components/FizzBuzzCounter'
import { AsyncUserList } from './components/AsyncUserList'
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
          <li><a href="/fizzbuzz">Conditional Counter</a></li>
          <li><a href="/toggle">Toggle</a></li>
          <li><a href="/todos">Todo (SSR + API)</a></li>
          <li><a href="/dashboard">Dashboard (All widgets)</a></li>
          <li><a href="/dashboard/counter-only">Dashboard (Counter only)</a></li>
          <li><a href="/dashboard/message-only">Dashboard (Message only)</a></li>
          <li><a href="/async">Async User List (Suspense)</a></li>
          <li><a href="/async-counter">Async Counter (Suspense + BarefootJS)</a></li>
          <li><a href="/game">Game (100x100 Grid Benchmark)</a></li>
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

app.get('/fizzbuzz', (c) => {
  return c.render(
    <div>
      <h1>Conditional Counter</h1>
      <p>Demonstrates conditional element switching:</p>
      <ul>
        <li>Toggle to switch between simple and detailed view</li>
        <li>Detailed view shows count and doubled value</li>
      </ul>
      <FizzBuzzCounter />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

app.get('/toggle', (c) => {
  return c.render(
    <div>
      <h1>Toggle Example</h1>
      <Toggle />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

app.get('/todos', (c) => {
  return c.render(
    <div>
      <TodoApp initialTodos={todos} />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Dashboard with feature flags - all widgets
app.get('/dashboard', (c) => {
  return c.render(
    <div>
      <Dashboard showCounter={true} showMessage={true} initialCount={10} message="Hello from server!" />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Dashboard - counter widget only
app.get('/dashboard/counter-only', (c) => {
  return c.render(
    <div>
      <Dashboard showCounter={true} showMessage={false} initialCount={5} />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Dashboard - message widget only
app.get('/dashboard/message-only', (c) => {
  return c.render(
    <div>
      <Dashboard showCounter={false} showMessage={true} message="Custom message!" />
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Async User List with Suspense (streaming)
app.get('/async', (c) => {
  return c.render(
    <div>
      <h1>Async Data Fetching with Suspense</h1>
      <Suspense fallback={<p class="loading">Loading users...</p>}>
        <AsyncUserList />
      </Suspense>
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Async Counter with Suspense + BarefootJS (streaming + interactivity)
app.get('/async-counter', (c) => {
  return c.render(
    <div>
      <h1>Async Counter with Suspense + BarefootJS</h1>
      <Suspense fallback={<p class="loading">Loading counter...</p>}>
        <AsyncCounterWrapper />
      </Suspense>
      <p><a href="/">← Back</a></p>
    </div>
  )
})

// Game (100x100 Grid Benchmark)
app.get('/game', (c) => {
  return c.render(
    <div>
      <Game />
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
