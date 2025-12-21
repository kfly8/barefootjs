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

// Home
app.get('/', (c) => {
  return c.render(
    <div>
      <h1>BarefootJS + Hono Examples</h1>
      <nav>
        <ul>
          <li><a href="/counter">Counter</a></li>
          <li><a href="/toggle">Toggle</a></li>
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

export default {
  port: 3000,
  fetch: app.fetch,
}
