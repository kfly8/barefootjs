/**
 * Form Validation Documentation Page
 *
 * Demonstrates error state management and multi-field validation patterns.
 */

import { Input } from '@/components/ui/input'
import {
  RequiredFieldDemo,
  EmailValidationDemo,
  PasswordConfirmationDemo,
  MultiFieldFormDemo,
} from '@/components/validation-demo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  type TocItem,
} from '../../components/shared/docs'
import { TableOfContents } from '@/components/table-of-contents'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'pattern-overview', title: 'Pattern Overview' },
  { id: 'examples', title: 'Examples' },
  { id: 'key-points', title: 'Key Points' },
]

// Code examples
const requiredFieldCode = `import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@/components/ui/input'

const [name, setName] = createSignal('')
const [touched, setTouched] = createSignal(false)
const error = createMemo(() => {
  if (!touched()) return ''
  return name().trim() === '' ? 'Name is required' : ''
})

<Input
  inputValue={name()}
  onInput={(e) => setName(e.target.value)}
  onBlur={() => setTouched(true)}
  inputPlaceholder="Enter your name"
/>
<p class="text-red-400">{error()}</p>`

const emailValidationCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const [email, setEmail] = createSignal('')
const [touched, setTouched] = createSignal(false)
const error = createMemo(() => {
  if (!touched()) return ''
  if (email().trim() === '') return 'Email is required'
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email())) return 'Invalid email format'
  return ''
})
const isValid = createMemo(() => touched() && error() === '')

<Input
  inputType="email"
  inputValue={email()}
  onInput={(e) => setEmail(e.target.value)}
  onBlur={() => setTouched(true)}
/>
<p class="text-red-400">{error()}</p>
{isValid() ? <span class="text-green-400">Valid</span> : null}`

const passwordConfirmCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const [password, setPassword] = createSignal('')
const [confirmPassword, setConfirmPassword] = createSignal('')
const [passwordTouched, setPasswordTouched] = createSignal(false)
const [confirmTouched, setConfirmTouched] = createSignal(false)

const passwordError = createMemo(() => {
  if (!passwordTouched()) return ''
  if (password().length === 0) return 'Password is required'
  if (password().length < 8) return 'Password must be at least 8 characters'
  return ''
})

const confirmError = createMemo(() => {
  if (!confirmTouched()) return ''
  if (confirmPassword().length === 0) return 'Please confirm your password'
  if (password() !== confirmPassword()) return 'Passwords do not match'
  return ''
})

const isValid = createMemo(() =>
  passwordTouched() && confirmTouched() &&
  passwordError() === '' && confirmError() === ''
)`

const multiFieldFormCode = `import { createSignal, createMemo } from '@barefootjs/dom'

// Field values
const [name, setName] = createSignal('')
const [email, setEmail] = createSignal('')
const [password, setPassword] = createSignal('')
const [confirmPassword, setConfirmPassword] = createSignal('')

// Touched states
const [nameTouched, setNameTouched] = createSignal(false)
// ... other touched states

// Field validations (createMemo for each field)
const nameError = createMemo(() => {
  if (!nameTouched()) return ''
  if (name().trim() === '') return 'Name is required'
  if (name().trim().length < 2) return 'Name must be at least 2 characters'
  return ''
})
// ... other field validations

// Form-level validity
const isFormValid = createMemo(() => {
  const nameValid = name().trim().length >= 2
  const emailValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email())
  const passwordValid = password().length >= 8
  const confirmValid = password() === confirmPassword()
  return nameValid && emailValid && passwordValid && confirmValid
})

const handleSubmit = () => {
  if (isFormValid()) {
    // Submit form
  }
}`

export function ValidationPage() {
  return (
    <div class="flex gap-10">
      <div class="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Form Validation"
          description="Demonstrates error state management and multi-field validation patterns using signals and memos."
        />

        {/* Preview - Static example */}
        <Example title="" code={requiredFieldCode}>
          <div class="max-w-sm">
            <Input inputPlaceholder="Enter your name" />
            <p class="text-sm text-muted-foreground mt-2">
              See interactive examples below.
            </p>
          </div>
        </Example>

        {/* Pattern Overview */}
        <Section id="pattern-overview" title="Pattern Overview">
          <div class="prose prose-invert max-w-none">
            <p class="text-muted-foreground">
              Form validation in BarefootJS uses <code class="text-foreground">createSignal</code> for field values and{' '}
              <code class="text-foreground">createMemo</code> for derived error states.
              This pattern provides reactive validation that automatically updates when field values change.
            </p>
            <p class="text-muted-foreground mt-2">
              Key concepts:
            </p>
            <ul class="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li><strong>Field value signal</strong>: Stores the current input value</li>
              <li><strong>Touched signal</strong>: Tracks if user has interacted with the field</li>
              <li><strong>Error memo</strong>: Computes error message based on value and touched state</li>
              <li><strong>Form validity memo</strong>: Computes overall form validity from all fields</li>
            </ul>
          </div>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Required Field" code={requiredFieldCode}>
              <div class="max-w-sm">
                <RequiredFieldDemo />
              </div>
            </Example>

            <Example title="Email Format Validation" code={emailValidationCode}>
              <div class="max-w-sm">
                <EmailValidationDemo />
              </div>
            </Example>

            <Example title="Password Confirmation" code={passwordConfirmCode}>
              <div class="max-w-sm">
                <PasswordConfirmationDemo />
              </div>
            </Example>

            <Example title="Multi-Field Form" code={multiFieldFormCode}>
              <div class="max-w-md">
                <MultiFieldFormDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Key Points */}
        <Section id="key-points" title="Key Points">
          <div class="space-y-4">
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Error State Management</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Use <code class="text-foreground">createSignal</code> for field values and touched states</li>
                <li>Use <code class="text-foreground">createMemo</code> for computed error messages</li>
                <li>Only show errors after field is touched (better UX)</li>
                <li>Return empty string for valid state, error message for invalid</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Validation Timing</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>On blur</strong>: Show errors when user leaves field (recommended)</li>
                <li><strong>On submit</strong>: Validate all fields before form submission</li>
                <li><strong>Real-time</strong>: For instant feedback (e.g., password strength)</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Field Dependencies</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Access other field signals within a memo for cross-field validation</li>
                <li>Example: <code class="text-foreground">{'password() !== confirmPassword()'}</code></li>
                <li>The memo automatically re-evaluates when either signal changes</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Form-Level Validity</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Combine field validations in a single <code class="text-foreground">createMemo</code></li>
                <li>Use for enabling/disabling submit button</li>
                <li>No need for a separate form library - signals are sufficient</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
