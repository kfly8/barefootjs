/**
 * BarefootJS + Hono SSR Server
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
import { Counter } from './dist/Counter'

const app = new Hono()

app.use(renderer)

app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))


// SSR
app.get('/', (c) => {
  return c.render(
    <div>
      <h1>Hello, BarefootJS + Hono!</h1>
      <Counter />
    </div>
  )
})

export default {
  port: 3000,
  fetch: app.fetch,
}
