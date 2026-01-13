/**
 * Toast Documentation Page
 */

import {
  ToastBasicDemo,
  ToastSuccessDemo,
  ToastErrorDemo,
  ToastWarningDemo,
  ToastInfoDemo,
  ToastWithActionDemo,
  ToastVariantsDemo,
} from '@/components/toast-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add toast`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'

export default function Page() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 5000)
  }

  return (
    <div>
      <button onClick={showToast}>Show Toast</button>
      <ToastProvider position="bottom-right">
        <Toast open={open()}>
          <div class="flex-1">
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>This is a toast message.</ToastDescription>
          </div>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}`

const basicCode = `const [open, setOpen] = createSignal(false)

const showToast = () => {
  setOpen(true)
  setTimeout(() => setOpen(false), 5000)
}

<Button onClick={showToast}>Show Toast</Button>
<ToastProvider position="bottom-right">
  <Toast open={open()}>
    <div class="flex-1">
      <ToastTitle>Notification</ToastTitle>
      <ToastDescription>This is a basic toast message.</ToastDescription>
    </div>
    <ToastClose onClick={() => setOpen(false)} />
  </Toast>
</ToastProvider>`

const successCode = `<Toast variant="success" open={open()}>
  <div class="flex-1">
    <ToastTitle>Success</ToastTitle>
    <ToastDescription>Your changes have been saved.</ToastDescription>
  </div>
  <ToastClose onClick={() => setOpen(false)} />
</Toast>`

const errorCode = `<Toast variant="error" open={open()}>
  <div class="flex-1">
    <ToastTitle>Error</ToastTitle>
    <ToastDescription>Something went wrong. Please try again.</ToastDescription>
  </div>
  <ToastClose onClick={() => setOpen(false)} />
</Toast>`

const withActionCode = `<Toast open={open()}>
  <div class="flex-1">
    <ToastTitle>Item deleted</ToastTitle>
    <ToastDescription>The item has been removed from your list.</ToastDescription>
  </div>
  <div class="flex gap-2">
    <ToastAction altText="Undo deletion" onClick={handleUndo}>
      Undo
    </ToastAction>
    <ToastClose onClick={() => setOpen(false)} />
  </div>
</Toast>`

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
    description: 'Event handler called when the open state changes.',
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

const toastCloseProps: PropDefinition[] = [
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the close button is clicked.',
  },
]

const toastActionProps: PropDefinition[] = [
  {
    name: 'altText',
    type: 'string',
    description: 'Alternative text for accessibility.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the action button is clicked.',
  },
]

export function ToastPage() {
  return (
    <DocPage slug="toast" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Toast"
          description="A non-blocking notification that displays brief messages to users. Supports auto-dismiss, multiple variants, and action buttons."
          {...getNavLinks('toast')}
        />

        {/* Preview */}
        <Example title="" code={`<Toast variant="success" open={open()}>...</Toast>`}>
          <div class="flex gap-4">
            <ToastVariantsDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Auto-dismiss</strong> - Toasts automatically disappear after a timeout</li>
            <li><strong class="text-foreground">Manual dismiss</strong> - Close button to dismiss immediately</li>
            <li><strong class="text-foreground">Variants</strong> - default, success, error, warning, info</li>
            <li><strong class="text-foreground">Position options</strong> - top-right, top-left, bottom-right, bottom-left</li>
            <li><strong class="text-foreground">Action buttons</strong> - Optional action button for undo/retry operations</li>
            <li><strong class="text-foreground">Accessibility</strong> - role="status", aria-live="polite" (assertive for errors)</li>
            <li><strong class="text-foreground">Stackable</strong> - Multiple toasts can be displayed simultaneously</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Basic Toast" code={basicCode}>
              <ToastBasicDemo />
            </Example>

            <Example title="Success Variant" code={successCode}>
              <ToastSuccessDemo />
            </Example>

            <Example title="Error Variant" code={errorCode}>
              <ToastErrorDemo />
            </Example>

            <Example title="Warning Variant" code={`<Toast variant="warning" open={open()}>...</Toast>`}>
              <ToastWarningDemo />
            </Example>

            <Example title="Info Variant" code={`<Toast variant="info" open={open()}>...</Toast>`}>
              <ToastInfoDemo />
            </Example>

            <Example title="With Action Button" code={withActionCode}>
              <ToastWithActionDemo />
            </Example>

            <Example title="All Variants" code={`<Toast variant="default|success|error|warning|info" open={open()}>...</Toast>`}>
              <ToastVariantsDemo />
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Live Regions</strong> - role="status" with aria-live="polite" for non-critical toasts</li>
            <li><strong class="text-foreground">Assertive Alerts</strong> - Error toasts use aria-live="assertive" for immediate announcement</li>
            <li><strong class="text-foreground">Action Accessibility</strong> - Action buttons include altText for screen reader descriptions</li>
            <li><strong class="text-foreground">Close Button</strong> - Close button has aria-label="Close" for screen readers</li>
            <li><strong class="text-foreground">Timing</strong> - Toasts auto-dismiss with sufficient time for users to read</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">ToastProvider</h3>
              <PropsTable props={toastProviderProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">Toast</h3>
              <PropsTable props={toastProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">ToastTitle</h3>
              <PropsTable props={toastTitleProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">ToastDescription</h3>
              <PropsTable props={toastDescriptionProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">ToastClose</h3>
              <PropsTable props={toastCloseProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">ToastAction</h3>
              <PropsTable props={toastActionProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
