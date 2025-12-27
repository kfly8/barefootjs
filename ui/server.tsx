/**
 * BarefootJS Components Server
 *
 * Serves component documentation with Hono.
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
import { ButtonPage } from './dist/pages/button'
import { CheckboxPage } from './dist/pages/checkbox'
import { InputPage } from './dist/pages/input'

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
        <a
          href="/components/checkbox"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Checkbox</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A control that allows the user to toggle between checked and unchecked states.
          </p>
        </a>
        <a
          href="/components/input"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Input</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Displays an input field for user text entry.
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

// Checkbox documentation
app.get('/components/checkbox', (c) => {
  return c.render(<CheckboxPage />)
})

// Input documentation
app.get('/components/input', (c) => {
  return c.render(<InputPage />)
})

export default { port: 3002, fetch: app.fetch }
