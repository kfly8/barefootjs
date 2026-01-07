/**
 * Form Submit Documentation Page
 *
 * Demonstrates async submit handling with loading, success, and error states.
 */

import { Input } from '@/components/ui/input'
import {
  BasicSubmitDemo,
  NetworkErrorDemo,
  ServerValidationDemo,
} from '@/components/docs/submit-demo'
import {
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../_shared/docs'
import { TableOfContents } from '@/components/docs/table-of-contents'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'pattern-overview', title: 'Pattern Overview' },
  { id: 'examples', title: 'Examples' },
  { id: 'key-points', title: 'Key Points' },
]

// Code examples
const basicSubmitCode = `import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toast, ToastProvider, ToastTitle, ToastDescription } from '@/components/ui/toast'

const [email, setEmail] = createSignal('')
const [loading, setLoading] = createSignal(false)
const [success, setSuccess] = createSignal(false)

const isValid = createMemo(() => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email()))

const handleSubmit = async () => {
  if (!isValid() || loading()) return

  setLoading(true)

  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email: email() })
    })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  } finally {
    setLoading(false)
  }
}

<Input
  inputValue={email()}
  onInput={(e) => setEmail(e.target.value)}
  inputDisabled={loading()}
/>
<Button onClick={handleSubmit} disabled={!isValid() || loading()}>
  {loading() ? 'Submitting...' : 'Subscribe'}
</Button>
<ToastProvider>
  <Toast variant="success" open={success()}>
    <ToastTitle>Success</ToastTitle>
    <ToastDescription>Subscribed!</ToastDescription>
  </Toast>
</ToastProvider>`

const errorHandlingCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const [loading, setLoading] = createSignal(false)
const [errorMsg, setErrorMsg] = createSignal('')
const [success, setSuccess] = createSignal(false)

const handleSubmit = async () => {
  setLoading(true)
  setErrorMsg('')

  try {
    const res = await fetch('/api/submit', { method: 'POST', ... })
    if (!res.ok) throw new Error('Request failed')
    setSuccess(true)
  } catch (err) {
    setErrorMsg(err.message || 'Network error. Please try again.')
  } finally {
    setLoading(false)
  }
}

const handleRetry = () => {
  setErrorMsg('')
  handleSubmit()
}

<Toast variant="error" open={errorMsg() !== ''}>
  <ToastTitle>Error</ToastTitle>
  <ToastDescription>{errorMsg()}</ToastDescription>
  <ToastAction onClick={handleRetry}>Retry</ToastAction>
</Toast>`

const serverValidationCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const [email, setEmail] = createSignal('')
const [serverError, setServerError] = createSignal('')

// Client-side validation
const clientError = createMemo(() => {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email())) return 'Invalid email'
  return ''
})

const handleSubmit = async () => {
  const res = await fetch('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email: email() })
  })

  if (!res.ok) {
    const data = await res.json()
    // Display server validation error
    setServerError(data.error) // e.g., "Email already registered"
    return
  }

  // Success handling...
}

// Clear server error when user modifies input
<Input
  onInput={(e) => {
    setEmail(e.target.value)
    setServerError('')
  }}
/>
{serverError() && <p class="text-red-400">{serverError()}</p>}`

export function SubmitPage() {
  return (
    <div class="flex gap-10">
      <div class="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Form Submit"
          description="Demonstrates async submit handling with loading, success, and error states."
        />

        {/* Preview - Static example */}
        <Example title="" code={basicSubmitCode}>
          <div class="max-w-sm">
            <Input inputPlaceholder="Enter your email" />
            <p class="text-sm text-muted-foreground mt-2">
              See interactive examples below.
            </p>
          </div>
        </Example>

        {/* Pattern Overview */}
        <Section id="pattern-overview" title="Pattern Overview">
          <div class="prose prose-invert max-w-none">
            <p class="text-muted-foreground">
              Form submission in BarefootJS uses signals to manage async state transitions:
              <code class="text-foreground">idle → loading → success/error</code>.
              This pattern provides reactive feedback without external state machines.
            </p>
            <p class="text-muted-foreground mt-2">
              Key concepts:
            </p>
            <ul class="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li><strong>Loading signal</strong>: Tracks submission in progress</li>
              <li><strong>Error signal</strong>: Stores error message from failed requests</li>
              <li><strong>Success signal</strong>: Triggers success feedback (toast, message)</li>
              <li><strong>Disabled state</strong>: Prevents double submission and shows loading</li>
            </ul>
          </div>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Basic Submit with Loading" code={basicSubmitCode}>
              <div class="max-w-sm">
                <BasicSubmitDemo />
              </div>
            </Example>

            <Example title="Network Error and Retry" code={errorHandlingCode}>
              <div class="max-w-sm">
                <NetworkErrorDemo />
              </div>
            </Example>

            <Example title="Server Validation Error" code={serverValidationCode}>
              <div class="max-w-sm">
                <ServerValidationDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Key Points */}
        <Section id="key-points" title="Key Points">
          <div class="space-y-4">
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Async State Management</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Use <code class="text-foreground">loading</code> signal to track submission state</li>
                <li>Disable form inputs and button during submission</li>
                <li>Show loading text in button: <code class="text-foreground">{'loading() ? "Submitting..." : "Submit"'}</code></li>
                <li>Signals are sufficient for typical forms - no state machine needed</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Error Handling</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Store error message in signal: <code class="text-foreground">setErrorMsg(err.message)</code></li>
                <li>Display errors via Toast (error variant) or inline message</li>
                <li>Provide retry action for network errors</li>
                <li>Clear error when user modifies input or retries</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Success Feedback</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Use Toast (success variant) for non-blocking feedback</li>
                <li>Auto-dismiss success toast: <code class="text-foreground">setTimeout(() =&gt; setSuccess(false), 3000)</code></li>
                <li>Reset form after successful submission if appropriate</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Server Validation</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Separate client-side and server-side validation signals</li>
                <li>Display server errors inline near the relevant field</li>
                <li>Clear server error when user modifies the field</li>
                <li>Example: "Email already registered" from server response</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
