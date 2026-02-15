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
import { LabelPage } from './pages/label'
import { SliderPage } from './pages/slider'
import { SwitchPage } from './pages/switch'
import { AccordionPage } from './pages/accordion'
import { TabsPage } from './pages/tabs'
import { DialogPage } from './pages/dialog'
import { DropdownMenuPage } from './pages/dropdown-menu'
import { ToastPage } from './pages/toast'
import { TogglePage } from './pages/toggle'
import { TooltipPage } from './pages/tooltip'
import { SelectPage } from './pages/select'
import { TextareaPage } from './pages/textarea'
import { PortalPage } from './pages/portal'
import { RadioGroupPage } from './pages/radio-group'

// Form pattern pages
import { ControlledInputPage } from './pages/forms/controlled-input'
import { ValidationPage } from './pages/forms/validation'
import { SubmitPage } from './pages/forms/submit'
import { FieldArraysPage } from './pages/forms/field-arrays'


// Preview card for the home page component showcase
function PreviewCard({ name, path, children }: { name: string; path: string; children: any }) {
  return (
    <a
      href={path}
      className="group flex flex-col rounded-xl border border-border hover:border-ring transition-colors no-underline overflow-hidden"
    >
      <div className="flex-1 p-6 flex items-center justify-center bg-muted/30 border-b border-border min-h-40">
        {children}
      </div>
      <div className="px-4 py-3 h-11 flex items-center">
        <span className="text-sm font-medium text-foreground group-hover:text-foreground">{name}</span>
      </div>
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

  // Home - Hero + Components list
  app.get('/', (c) => {
    return c.render(
      <div className="space-y-12">
        {/* Hero */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            <span className="gradient-text">Ready-made</span> components for BarefootJS
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick a component. Copy the code. Make it yours.
          </p>
        </div>

        {/* Component Showcase */}
        <div className="space-y-6" id="components">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Button */}
            <PreviewCard name="Button" path="/docs/components/button">
              <div className="flex items-center gap-2">
                <span className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground">Primary</span>
                <span className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background text-foreground">Outline</span>
                <span className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground">Ghost</span>
              </div>
            </PreviewCard>

            {/* Card */}
            <PreviewCard name="Card" path="/docs/components/card">
              <div className="w-full max-w-48 bg-card rounded-lg border border-border shadow-sm p-4 space-y-2">
                <div className="text-sm font-semibold text-foreground">Card Title</div>
                <div className="text-xs text-muted-foreground">A short description of the card content.</div>
                <span className="h-7 px-3 inline-flex items-center justify-center rounded-md text-xs font-medium bg-primary text-primary-foreground">Action</span>
              </div>
            </PreviewCard>

            {/* Tabs */}
            <PreviewCard name="Tabs" path="/docs/components/tabs">
              <div className="w-full max-w-56">
                <div className="flex border-b border-border">
                  <span className="px-3 py-1.5 text-sm font-medium text-foreground border-b-2 border-primary">Account</span>
                  <span className="px-3 py-1.5 text-sm text-muted-foreground">Password</span>
                  <span className="px-3 py-1.5 text-sm text-muted-foreground">Settings</span>
                </div>
                <div className="p-3 text-xs text-muted-foreground">
                  Manage your account settings and preferences.
                </div>
              </div>
            </PreviewCard>

            {/* Slider */}
            <PreviewCard name="Slider" path="/docs/components/slider">
              <div className="w-full max-w-48 space-y-3">
                <div className="relative flex w-full items-center h-5">
                  <div className="bg-muted relative grow overflow-hidden rounded-full h-1.5 w-full">
                    <div className="bg-primary absolute h-full" style="width: 60%" />
                  </div>
                  <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 border-primary block size-4 rounded-full border bg-white shadow-sm" style="left: 60%" />
                </div>
              </div>
            </PreviewCard>

            {/* Switch */}
            <PreviewCard name="Switch" path="/docs/components/switch">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-5 bg-primary rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                  </div>
                  <span className="text-sm text-foreground">Enabled</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-5 bg-muted rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                  </div>
                  <span className="text-sm text-muted-foreground">Disabled</span>
                </div>
              </div>
            </PreviewCard>

            {/* Dialog */}
            <PreviewCard name="Dialog" path="/docs/components/dialog">
              <div className="w-full max-w-52 bg-card rounded-lg border border-border shadow-lg p-4 space-y-3">
                <div className="text-sm font-semibold text-foreground">Confirm</div>
                <div className="text-xs text-muted-foreground">Are you sure you want to continue?</div>
                <div className="flex justify-end gap-2">
                  <span className="h-7 px-3 inline-flex items-center justify-center rounded-md text-xs border border-input bg-background text-foreground">Cancel</span>
                  <span className="h-7 px-3 inline-flex items-center justify-center rounded-md text-xs bg-primary text-primary-foreground">Confirm</span>
                </div>
              </div>
            </PreviewCard>

            {/* Accordion */}
            <PreviewCard name="Accordion" path="/docs/components/accordion">
              <div className="w-full max-w-52 text-sm">
                <div className="border-b border-border py-2 flex justify-between items-center text-foreground font-medium">
                  <span>Section 1</span>
                  <span className="text-muted-foreground text-xs">−</span>
                </div>
                <div className="py-2 text-xs text-muted-foreground">
                  Content for the first section.
                </div>
                <div className="border-b border-border border-t py-2 flex justify-between items-center text-muted-foreground">
                  <span>Section 2</span>
                  <span className="text-xs">+</span>
                </div>
                <div className="border-b border-border py-2 flex justify-between items-center text-muted-foreground">
                  <span>Section 3</span>
                  <span className="text-xs">+</span>
                </div>
              </div>
            </PreviewCard>
          </div>
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

  // Label documentation
  app.get('/docs/components/label', (c) => {
    return c.render(<LabelPage />)
  })

  // Slider documentation
  app.get('/docs/components/slider', (c) => {
    return c.render(<SliderPage />)
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

  // Dropdown Menu documentation
  app.get('/docs/components/dropdown-menu', (c) => {
    return c.render(<DropdownMenuPage />)
  })

  // Toast documentation
  app.get('/docs/components/toast', (c) => {
    return c.render(<ToastPage />)
  })

  // Toggle documentation
  app.get('/docs/components/toggle', (c) => {
    return c.render(<TogglePage />)
  })

  // Tooltip documentation
  app.get('/docs/components/tooltip', (c) => {
    return c.render(<TooltipPage />)
  })

  // Select documentation
  app.get('/docs/components/select', (c) => {
    return c.render(<SelectPage />)
  })

  // Textarea documentation
  app.get('/docs/components/textarea', (c) => {
    return c.render(<TextareaPage />)
  })

  // Portal documentation
  app.get('/docs/components/portal', (c) => {
    return c.render(<PortalPage />)
  })

  // Radio Group documentation
  app.get('/docs/components/radio-group', (c) => {
    return c.render(<RadioGroupPage />)
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
