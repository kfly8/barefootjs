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
} from '@/components/ToastDemo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add toast`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/toast'

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
    <div class="space-y-12">
      <PageHeader
        title="Toast"
        description="A non-blocking notification that displays brief messages to users. Supports auto-dismiss, multiple variants, and action buttons."
      />

      {/* Preview */}
      <Example title="" code={`<Toast variant="success" open={open()}>...</Toast>`}>
        <div class="flex gap-4">
          <ToastVariantsDemo />
        </div>
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Features */}
      <Section title="Features">
        <ul class="list-disc list-inside space-y-2 text-zinc-400">
          <li><strong class="text-zinc-200">Auto-dismiss</strong> - Toasts automatically disappear after a timeout</li>
          <li><strong class="text-zinc-200">Manual dismiss</strong> - Close button to dismiss immediately</li>
          <li><strong class="text-zinc-200">Variants</strong> - default, success, error, warning, info</li>
          <li><strong class="text-zinc-200">Position options</strong> - top-right, top-left, bottom-right, bottom-left</li>
          <li><strong class="text-zinc-200">Action buttons</strong> - Optional action button for undo/retry operations</li>
          <li><strong class="text-zinc-200">Accessibility</strong> - role="status", aria-live="polite" (assertive for errors)</li>
          <li><strong class="text-zinc-200">Stackable</strong> - Multiple toasts can be displayed simultaneously</li>
        </ul>
      </Section>

      {/* Examples */}
      <Section title="Examples">
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

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">ToastProvider</h3>
            <PropsTable props={toastProviderProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">Toast</h3>
            <PropsTable props={toastProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">ToastTitle</h3>
            <PropsTable props={toastTitleProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">ToastDescription</h3>
            <PropsTable props={toastDescriptionProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">ToastClose</h3>
            <PropsTable props={toastCloseProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">ToastAction</h3>
            <PropsTable props={toastActionProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
