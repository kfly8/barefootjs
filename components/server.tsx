/**
 * BarefootJS Components Server
 *
 * Serves component documentation with Hono.
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
import { ButtonPage } from './dist/ButtonPage'

const app = new Hono()

app.use(renderer)

app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// Home - Components list
app.get('/', (c) => {
  return c.render(
    <div class="space-y-8">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-zinc-50">Components</h1>
        <p class="text-zinc-400 text-lg">
          Beautifully designed components built with BarefootJS and UnoCSS.
        </p>
      </div>

      <div class="grid gap-4">
        <a
          href="/components/button"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Button</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Displays a button or a component that looks like a button.
          </p>
        </a>
      </div>
    </div>
  )
})

// Button documentation
app.get('/components/button', (c) => {
  return c.render(<ButtonPage />)
})

export default { port: 3002, fetch: app.fetch }
