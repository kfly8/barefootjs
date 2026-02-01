/**
 * BarefootJS Documentation Routes
 *
 * Shared route definitions for both Bun (development) and Cloudflare Workers (production).
 * This module contains only the page routes, not static file serving.
 */

import { Hono } from 'hono'
import { renderer } from './renderer'

// Component pages
import { BadgePage } from './pages/badge'
import { ButtonPage } from './pages/button'
import { CardPage } from './pages/card'
import { CheckboxPage } from './pages/checkbox'
import { InputPage } from './pages/input'
import { SwitchPage } from './pages/switch'
import { AccordionPage } from './pages/accordion'
import { TabsPage } from './pages/tabs'
import { DialogPage } from './pages/dialog'
import { DropdownPage } from './pages/dropdown'
import { ToastPage } from './pages/toast'
import { TooltipPage } from './pages/tooltip'
import { SelectPage } from './pages/select'
import { PortalPage } from './pages/portal'

// Form pattern pages
import { ControlledInputPage } from './pages/forms/controlled-input'
import { ValidationPage } from './pages/forms/validation'
import { SubmitPage } from './pages/forms/submit'
import { FieldArraysPage } from './pages/forms/field-arrays'

// Navigation data for the home page
const components = [
  { name: 'Badge', path: '/docs/components/badge', description: 'Displays a badge or a component that looks like a badge.' },
  { name: 'Button', path: '/docs/components/button', description: 'Displays a button or a component that looks like a button.' },
  { name: 'Card', path: '/docs/components/card', description: 'Displays a card with header, content, and footer.' },
  { name: 'Checkbox', path: '/docs/components/checkbox', description: 'A control that allows the user to toggle between checked and unchecked states.' },
  { name: 'Input', path: '/docs/components/input', description: 'Displays an input field for user text entry.' },
  { name: 'Portal', path: '/docs/components/portal', description: 'Renders children into a different part of the DOM tree.' },
  { name: 'Switch', path: '/docs/components/switch', description: 'A control that allows the user to toggle between checked and not checked.' },
  { name: 'Accordion', path: '/docs/components/accordion', description: 'A vertically stacked set of interactive headings that each reveal content.' },
  { name: 'Tabs', path: '/docs/components/tabs', description: 'A set of layered sections of content displayed one at a time.' },
  { name: 'Dialog', path: '/docs/components/dialog', description: 'A modal dialog that displays content in a layer above the page.' },
  { name: 'Dropdown', path: '/docs/components/dropdown', description: 'A select-like dropdown menu for choosing from a list of options.' },
  { name: 'Toast', path: '/docs/components/toast', description: 'A non-blocking notification that displays brief messages to users.' },
  { name: 'Tooltip', path: '/docs/components/tooltip', description: 'A popup that displays contextual information on hover or focus.' },
  { name: 'Select', path: '/docs/components/select', description: 'A dropdown for choosing from a list of options.' },
]

const formPatterns = [
  { name: 'Controlled Input', path: '/docs/forms/controlled-input', description: 'Two-way binding between signals and input values.' },
  { name: 'Form Validation', path: '/docs/forms/validation', description: 'Error state management and multi-field validation patterns.' },
  { name: 'Form Submit', path: '/docs/forms/submit', description: 'Async submit handling with loading, success, and error states.' },
  { name: 'Field Arrays', path: '/docs/forms/field-arrays', description: 'Dynamic list of form inputs with add/remove and per-item validation.' },
]

// Reusable link card component for the home page
function NavLink({ name, path, description }: { name: string; path: string; description: string }) {
  return (
    <a
      href={path}
      className="block p-4 border border-border rounded-lg hover:border-ring hover:bg-accent transition-colors"
    >
      <h2 className="font-semibold text-foreground">{name}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </a>
  )
}

/**
 * Create the documentation app with all routes.
 * Static file serving should be added by the caller (Bun or Workers specific).
 */
export function createApp() {
  const app = new Hono()

  app.use(renderer)

  // Home - Components list
  app.get('/', (c) => {
    return c.render(
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Components</h1>
          <p className="text-muted-foreground text-lg">
            Beautifully designed components built with BarefootJS and UnoCSS.
          </p>
        </div>

        <div className="grid gap-4">
          {components.map((c) => <NavLink {...c} />)}
        </div>

        <div className="space-y-2 mt-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Form Patterns</h2>
          <p className="text-muted-foreground">
            Common patterns for building forms with BarefootJS.
          </p>
        </div>

        <div className="grid gap-4">
          {formPatterns.map((p) => <NavLink {...p} />)}
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

  // Portal documentation
  app.get('/docs/components/portal', (c) => {
    return c.render(<PortalPage />)
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

  return app
}
