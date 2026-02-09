/**
 * Toast Documentation Page
 */

import {
  ToastSimpleDemo,
  ToastWithTitleDemo,
  ToastDestructiveDemo,
  ToastWithActionDemo,
  ToastVariantsDemo,
} from '@/components/toast-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  getHighlightedCommands,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'simple', title: 'Simple', branch: 'start' },
  { id: 'with-title', title: 'With Title', branch: 'child' },
  { id: 'destructive', title: 'Destructive', branch: 'child' },
  { id: 'with-action', title: 'With Action', branch: 'end' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const simpleCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import {
  ToastProvider,
  Toast,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'

function ToastSimple() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add to calendar</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastDescription>Event has been created.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}`

const withTitleCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'

function ToastWithTitle() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Show Notification</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>Your changes have been saved successfully.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}`

const destructiveCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
} from '@/components/ui/toast'

function ToastDestructive() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="destructive" onClick={() => setOpen(true)}>Show Error</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="error" open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Uh oh! Something went wrong.</ToastTitle>
            <ToastDescription>There was a problem with your request.</ToastDescription>
          </div>
          <ToastAction altText="Try again">Try again</ToastAction>
        </Toast>
      </ToastProvider>
    </div>
  )
}`

const withActionCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from '@/components/ui/toast'

function ToastWithAction() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Delete Item</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen} duration={10000}>
          <div className="flex-1">
            <ToastTitle>Item deleted</ToastTitle>
            <ToastDescription>The item has been removed from your list.</ToastDescription>
          </div>
          <div className="flex gap-2">
            <ToastAction altText="Undo deletion">Undo</ToastAction>
            <ToastClose />
          </div>
        </Toast>
      </ToastProvider>
    </div>
  )
}`

// Props definitions
const toastProviderProps: PropDefinition[] = [
  {
    name: 'position',
    type: "'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'",
    defaultValue: "'bottom-right'",
    description: 'Position of the toast container on the viewport.',
  },
]

const toastProps: PropDefinition[] = [
  {
    name: 'variant',
    type: "'default' | 'success' | 'error' | 'warning' | 'info'",
    defaultValue: "'default'",
    description: 'Visual variant of the toast.',
  },
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the toast is visible.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Callback when the open state changes (e.g., on auto-dismiss or close).',
  },
  {
    name: 'duration',
    type: 'number',
    defaultValue: '5000',
    description: 'Auto-dismiss duration in milliseconds. Set to 0 to disable auto-dismiss.',
  },
]

const toastTitleProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'Child',
    description: 'The title text to display.',
  },
]

const toastDescriptionProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'Child',
    description: 'The description text to display.',
  },
]

const toastCloseProps: PropDefinition[] = []

const toastActionProps: PropDefinition[] = [
  {
    name: 'altText',
    type: 'string',
    description: 'Alternative text for accessibility.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Click handler called before auto-dismiss.',
  },
]

export function ToastPage() {
  const installCommands = getHighlightedCommands('barefoot add toast')

  return (
    <DocPage slug="toast" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Toast"
          description="A non-blocking notification that displays brief messages to users. Supports auto-dismiss, multiple variants, and action buttons."
          {...getNavLinks('toast')}
        />

        {/* Preview */}
        <Example title="" code={`<Toast variant="success" open={open()}>...</Toast>`}>
          <div className="flex gap-4">
            <ToastVariantsDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add toast" highlightedCommands={installCommands} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Auto-dismiss</strong> - Toasts automatically disappear after a configurable duration</li>
            <li><strong className="text-foreground">Manual dismiss</strong> - Close button to dismiss immediately via context</li>
            <li><strong className="text-foreground">Variants</strong> - default, success, error, warning, info</li>
            <li><strong className="text-foreground">Position options</strong> - top-right, top-left, bottom-right, bottom-left</li>
            <li><strong className="text-foreground">Action buttons</strong> - Optional action button for undo/retry operations</li>
            <li><strong className="text-foreground">Portal rendering</strong> - Toast container portals to document.body to avoid z-index issues</li>
            <li><strong className="text-foreground">Accessibility</strong> - role="status", aria-live="polite" (assertive for errors)</li>
            <li><strong className="text-foreground">Stackable</strong> - Multiple toasts can be displayed simultaneously</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Simple" code={simpleCode}>
              <ToastSimpleDemo />
            </Example>

            <Example title="With Title" code={withTitleCode}>
              <ToastWithTitleDemo />
            </Example>

            <Example title="Destructive" code={destructiveCode}>
              <ToastDestructiveDemo />
            </Example>

            <Example title="With Action" code={withActionCode}>
              <ToastWithActionDemo />
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Live Regions</strong> - role="status" with aria-live="polite" for non-critical toasts</li>
            <li><strong className="text-foreground">Assertive Alerts</strong> - Error toasts use aria-live="assertive" for immediate announcement</li>
            <li><strong className="text-foreground">Action Accessibility</strong> - Action buttons include altText for screen reader descriptions</li>
            <li><strong className="text-foreground">Close Button</strong> - Close button has aria-label="Close" for screen readers</li>
            <li><strong className="text-foreground">Timing</strong> - Toasts auto-dismiss with sufficient time for users to read</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">ToastProvider</h3>
              <PropsTable props={toastProviderProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Toast</h3>
              <PropsTable props={toastProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">ToastTitle</h3>
              <PropsTable props={toastTitleProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">ToastDescription</h3>
              <PropsTable props={toastDescriptionProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">ToastClose</h3>
              <PropsTable props={toastCloseProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">ToastAction</h3>
              <PropsTable props={toastActionProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
