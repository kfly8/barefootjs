/**
 * BarefootJS Components Server
 *
 * Serves component documentation with Hono.
 */

import { Hono } from 'hono'
import { initHighlighter } from './components/shared/highlighter'

// Initialize syntax highlighter at startup
await initHighlighter()
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
import { SubmitPage } from './pages/forms/submit'
import { FieldArraysPage } from './pages/forms/field-arrays'

const app = new Hono()

app.use(renderer)

app.use('/static/*', serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => path.replace('/static', ''),
}))

// Registry routes - serve static JSON files
app.use('/r/*', serveStatic({
  root: './dist',
}))

// Home - Components list
app.get('/', (c) => {
  return c.render(
    <div class="space-y-8">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">Components</h1>
        <p class="text-muted-foreground text-lg">
          Beautifully designed components built with BarefootJS and UnoCSS.
        </p>
      </div>

      <div class="grid gap-4">
        <a
          href="/docs/components/badge"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Badge</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Displays a badge or a component that looks like a badge.
          </p>
        </a>
        <a
          href="/docs/components/button"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Button</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Displays a button or a component that looks like a button.
          </p>
        </a>
        <a
          href="/docs/components/card"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Card</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Displays a card with header, content, and footer.
          </p>
        </a>
        <a
          href="/docs/components/checkbox"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Checkbox</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A control that allows the user to toggle between checked and unchecked states.
          </p>
        </a>
        <a
          href="/docs/components/input"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Input</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Displays an input field for user text entry.
          </p>
        </a>
        <a
          href="/docs/components/switch"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Switch</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A control that allows the user to toggle between checked and not checked.
          </p>
        </a>
        <a
          href="/docs/components/counter"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Counter</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A numeric input with increment and decrement buttons.
          </p>
        </a>
        <a
          href="/docs/components/accordion"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Accordion</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A vertically stacked set of interactive headings that each reveal content.
          </p>
        </a>
        <a
          href="/docs/components/tabs"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Tabs</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A set of layered sections of content displayed one at a time.
          </p>
        </a>
        <a
          href="/docs/components/dialog"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Dialog</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A modal dialog that displays content in a layer above the page.
          </p>
        </a>
        <a
          href="/docs/components/dropdown"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Dropdown</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A select-like dropdown menu for choosing from a list of options.
          </p>
        </a>
        <a
          href="/docs/components/toast"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Toast</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A non-blocking notification that displays brief messages to users.
          </p>
        </a>
        <a
          href="/docs/components/tooltip"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Tooltip</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A popup that displays contextual information on hover or focus.
          </p>
        </a>
        <a
          href="/docs/components/select"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Select</h2>
          <p class="text-sm text-muted-foreground mt-1">
            A dropdown for choosing from a list of options.
          </p>
        </a>
      </div>

      <div class="space-y-2 mt-8">
        <h2 class="text-2xl font-bold tracking-tight text-foreground">Form Patterns</h2>
        <p class="text-muted-foreground">
          Common patterns for building forms with BarefootJS.
        </p>
      </div>

      <div class="grid gap-4">
        <a
          href="/docs/forms/controlled-input"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Controlled Input</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Two-way binding between signals and input values.
          </p>
        </a>
        <a
          href="/docs/forms/validation"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Form Validation</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Error state management and multi-field validation patterns.
          </p>
        </a>
        <a
          href="/docs/forms/submit"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Form Submit</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Async submit handling with loading, success, and error states.
          </p>
        </a>
        <a
          href="/docs/forms/field-arrays"
          class="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
        >
          <h2 class="font-semibold text-foreground">Field Arrays</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Dynamic list of form inputs with add/remove and per-item validation.
          </p>
        </a>
      </div>
    </div>
  )
})

// Badge documentation
app.get('/docs/components/badge', (c) => {
  return c.render(<BadgePage />)
})

// Button documentation
app.get('/docs/components/button', (c) => {
  return c.render(<ButtonPage />, {
    title: 'Button - barefootjs/ui',
    description: 'Displays a button or a component that looks like a button.',
  })
})

// Card documentation
app.get('/docs/components/card', (c) => {
  return c.render(<CardPage />)
})

// Checkbox documentation
app.get('/docs/components/checkbox', (c) => {
  return c.render(<CheckboxPage />)
})

// Input documentation
app.get('/docs/components/input', (c) => {
  return c.render(<InputPage />)
})

// Switch documentation
app.get('/docs/components/switch', (c) => {
  return c.render(<SwitchPage />)
})

// Counter documentation
app.get('/docs/components/counter', (c) => {
  return c.render(<CounterPage />)
})

// Accordion documentation
app.get('/docs/components/accordion', (c) => {
  return c.render(<AccordionPage />)
})

// Tabs documentation
app.get('/docs/components/tabs', (c) => {
  return c.render(<TabsPage />)
})

// Dialog documentation
app.get('/docs/components/dialog', (c) => {
  return c.render(<DialogPage />)
})

// Dropdown documentation
app.get('/docs/components/dropdown', (c) => {
  return c.render(<DropdownPage />)
})

// Toast documentation
app.get('/docs/components/toast', (c) => {
  return c.render(<ToastPage />)
})

// Tooltip documentation
app.get('/docs/components/tooltip', (c) => {
  return c.render(<TooltipPage />)
})

// Select documentation
app.get('/docs/components/select', (c) => {
  return c.render(<SelectPage />)
})

// Controlled Input pattern documentation
app.get('/docs/forms/controlled-input', (c) => {
  return c.render(<ControlledInputPage />)
})

// Form Validation pattern documentation
app.get('/docs/forms/validation', (c) => {
  return c.render(<ValidationPage />)
})

// Form Submit pattern documentation
app.get('/docs/forms/submit', (c) => {
  return c.render(<SubmitPage />)
})

// Field Arrays pattern documentation
app.get('/docs/forms/field-arrays', (c) => {
  return c.render(<FieldArraysPage />)
})

export default { port: 3002, fetch: app.fetch }
