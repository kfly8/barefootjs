/**
 * BarefootJS Components Server
 *
 * Serves component documentation with Hono.
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { renderer } from './renderer'
// All pages imported from source
// Pages import compiled components via @/components (dist/components)
import { BadgePage } from './pages/badge'
import { ButtonPage } from './pages/button'
import { CardPage } from './pages/card'
import { CheckboxPage } from './pages/checkbox'
import { InputPage } from './pages/input'
import { SwitchPage } from './pages/switch'
import { CounterPage } from './pages/counter'
import { AccordionPage } from './pages/accordion'
import { TabsPage } from './pages/tabs'
import { DialogPage } from './pages/dialog'
import { DropdownPage } from './pages/dropdown'
import { ToastPage } from './pages/toast'
import { TooltipPage } from './pages/tooltip'
import { SelectPage } from './pages/select'
import { ControlledInputPage } from './pages/forms/controlled-input'
import { ValidationPage } from './pages/forms/validation'

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
          href="/components/badge"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Badge</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Displays a badge or a component that looks like a badge.
          </p>
        </a>
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
          href="/components/card"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Card</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Displays a card with header, content, and footer.
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
        <a
          href="/components/switch"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Switch</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A control that allows the user to toggle between checked and not checked.
          </p>
        </a>
        <a
          href="/components/counter"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Counter</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A numeric input with increment and decrement buttons.
          </p>
        </a>
        <a
          href="/components/accordion"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Accordion</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A vertically stacked set of interactive headings that each reveal content.
          </p>
        </a>
        <a
          href="/components/tabs"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Tabs</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A set of layered sections of content displayed one at a time.
          </p>
        </a>
        <a
          href="/components/dialog"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Dialog</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A modal dialog that displays content in a layer above the page.
          </p>
        </a>
        <a
          href="/components/dropdown"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Dropdown</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A select-like dropdown menu for choosing from a list of options.
          </p>
        </a>
        <a
          href="/components/toast"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Toast</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A non-blocking notification that displays brief messages to users.
          </p>
        </a>
        <a
          href="/components/tooltip"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Tooltip</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A popup that displays contextual information on hover or focus.
          </p>
        </a>
        <a
          href="/components/select"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Select</h2>
          <p class="text-sm text-zinc-400 mt-1">
            A dropdown for choosing from a list of options.
          </p>
        </a>
      </div>

      <div class="space-y-2 mt-8">
        <h2 class="text-2xl font-bold tracking-tight text-zinc-50">Form Patterns</h2>
        <p class="text-zinc-400">
          Common patterns for building forms with BarefootJS.
        </p>
      </div>

      <div class="grid gap-4">
        <a
          href="/forms/controlled-input"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Controlled Input</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Two-way binding between signals and input values.
          </p>
        </a>
        <a
          href="/forms/validation"
          class="block p-4 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-900 transition-colors"
        >
          <h2 class="font-semibold text-zinc-100">Form Validation</h2>
          <p class="text-sm text-zinc-400 mt-1">
            Error state management and multi-field validation patterns.
          </p>
        </a>
      </div>
    </div>
  )
})

// Badge documentation
app.get('/components/badge', (c) => {
  return c.render(<BadgePage />)
})

// Button documentation
app.get('/components/button', (c) => {
  return c.render(<ButtonPage />)
})

// Card documentation
app.get('/components/card', (c) => {
  return c.render(<CardPage />)
})

// Checkbox documentation
app.get('/components/checkbox', (c) => {
  return c.render(<CheckboxPage />)
})

// Input documentation
app.get('/components/input', (c) => {
  return c.render(<InputPage />)
})

// Switch documentation
app.get('/components/switch', (c) => {
  return c.render(<SwitchPage />)
})

// Counter documentation
app.get('/components/counter', (c) => {
  return c.render(<CounterPage />)
})

// Accordion documentation
app.get('/components/accordion', (c) => {
  return c.render(<AccordionPage />)
})

// Tabs documentation
app.get('/components/tabs', (c) => {
  return c.render(<TabsPage />)
})

// Dialog documentation
app.get('/components/dialog', (c) => {
  return c.render(<DialogPage />)
})

// Dropdown documentation
app.get('/components/dropdown', (c) => {
  return c.render(<DropdownPage />)
})

// Toast documentation
app.get('/components/toast', (c) => {
  return c.render(<ToastPage />)
})

// Tooltip documentation
app.get('/components/tooltip', (c) => {
  return c.render(<TooltipPage />)
})

// Select documentation
app.get('/components/select', (c) => {
  return c.render(<SelectPage />)
})

// Controlled Input pattern documentation
app.get('/forms/controlled-input', (c) => {
  return c.render(<ControlledInputPage />)
})

// Form Validation pattern documentation
app.get('/forms/validation', (c) => {
  return c.render(<ValidationPage />)
})

export default { port: 3002, fetch: app.fetch }
