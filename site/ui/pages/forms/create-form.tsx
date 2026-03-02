/**
 * createForm Documentation Page
 *
 * Demonstrates schema-driven form management using createForm with Standard Schema validation.
 */

import {
  ProfileFormDemo,
  LoginFormDemo,
  NotificationsFormDemo,
  ServerErrorFormDemo,
} from '@/components/create-form-demo'
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
  { id: 'overview', title: 'Overview' },
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'profile-form', title: 'Profile Form', branch: 'start' },
  { id: 'login-form', title: 'Login Form', branch: 'child' },
  { id: 'notifications', title: 'Notifications', branch: 'child' },
  { id: 'server-errors', title: 'Server Errors', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// --- Code examples ---

const profileFormCode = `"use client"

import { createForm } from '@barefootjs/form'
import { z } from 'zod'

function ProfileForm() {
  const form = createForm({
    schema: z.object({
      username: z.string()
        .min(1, 'Username is required')
        .max(30, 'Username must be at most 30 characters'),
    }),
    defaultValues: { username: '' },
    onSubmit: async (data) => {
      await fetch('/api/profile', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  })

  const username = form.field('username')

  return (
    <form onSubmit={form.handleSubmit}>
      <label>Username</label>
      <input
        value={username.value()}
        onInput={username.handleInput}
        onBlur={username.handleBlur}
      />
      <p>{username.error()}</p>
      <button type="submit" disabled={form.isSubmitting()}>
        {form.isSubmitting() ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}`

const valibotSchemaCode = `import { createForm } from '@barefootjs/form'
import * as v from 'valibot'

// Just swap the schema — everything else stays the same
const form = createForm({
  schema: v.object({
    username: v.pipe(
      v.string(),
      v.minLength(1, 'Username is required'),
      v.maxLength(30, 'Username must be at most 30 characters'),
    ),
  }),
  defaultValues: { username: '' },
  onSubmit: async (data) => { /* ... */ },
})`

const arktypeSchemaCode = `import { createForm } from '@barefootjs/form'
import { type } from 'arktype'

const form = createForm({
  schema: type({
    username: '1 <= string <= 30',
  }),
  defaultValues: { username: '' },
  onSubmit: async (data) => { /* ... */ },
})`

const loginFormCode = `"use client"

import { createForm } from '@barefootjs/form'
import { z } from 'zod'

function LoginForm() {
  const form = createForm({
    schema: z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    }),
    defaultValues: { email: '', password: '' },
    validateOn: 'blur',       // Validate when user leaves field
    revalidateOn: 'input',    // Re-validate on every keystroke after first error
    onSubmit: async (data) => {
      await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  })

  const email = form.field('email')
  const password = form.field('password')

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email.value()}
          onInput={email.handleInput}
          onBlur={email.handleBlur}
        />
        <p>{email.error()}</p>
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password.value()}
          onInput={password.handleInput}
          onBlur={password.handleBlur}
        />
        <p>{password.error()}</p>
      </div>
      <button type="submit" disabled={form.isSubmitting()}>
        {form.isSubmitting() ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}`

const notificationsFormCode = `"use client"

import { createForm } from '@barefootjs/form'
import { Switch } from './ui/switch'
import { z } from 'zod'

function NotificationsForm() {
  const form = createForm({
    schema: z.object({
      marketing: z.boolean(),
      security: z.boolean(),
    }),
    defaultValues: { marketing: false, security: true },
    onSubmit: async (data) => {
      await fetch('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  })

  const marketing = form.field('marketing')
  const security = form.field('security')

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Use setValue() for custom components like Switch */}
      <Switch
        checked={marketing.value()}
        onCheckedChange={(checked) => marketing.setValue(checked)}
      />
      <Switch
        checked={security.value()}
        onCheckedChange={(checked) => security.setValue(checked)}
      />
      <button type="submit" disabled={form.isSubmitting() || !form.isDirty()}>
        Save preferences
      </button>
      {form.isDirty() ? (
        <button type="button" onClick={() => form.reset()}>
          Reset
        </button>
      ) : null}
    </form>
  )
}`

const serverErrorCode = `"use client"

import { createForm } from '@barefootjs/form'
import { z } from 'zod'

function RegisterForm() {
  const form = createForm({
    schema: z.object({
      email: z.string().email('Please enter a valid email address'),
      username: z.string().min(1, 'Username is required'),
    }),
    defaultValues: { email: '', username: '' },
    validateOn: 'blur',
    revalidateOn: 'input',
    onSubmit: async (data) => {
      const res = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errors = await res.json()
        // Set server-side errors on specific fields
        if (errors.email) form.setError('email', errors.email)
        if (errors.username) form.setError('username', errors.username)
        return
      }
    },
  })

  const email = form.field('email')
  const username = form.field('username')

  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email.value()}
          onInput={email.handleInput}
          onBlur={email.handleBlur}
        />
        <p>{email.error()}</p>
      </div>
      <div>
        <label>Username</label>
        <input
          value={username.value()}
          onInput={username.handleInput}
          onBlur={username.handleBlur}
        />
        <p>{username.error()}</p>
      </div>
      <button type="submit" disabled={form.isSubmitting()}>
        {form.isSubmitting() ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}`

const installCode = `# With Zod
bun add @barefootjs/form zod

# With Valibot
bun add @barefootjs/form valibot

# With ArkType
bun add @barefootjs/form arktype`

export function CreateFormPage() {
  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="createForm"
          description="Schema-driven form management with Standard Schema validation. Replaces manual signal wiring with a declarative API."
        />

        {/* Preview */}
        <Example title="" code={profileFormCode}>
          <div className="max-w-sm">
            <ProfileFormDemo />
          </div>
        </Example>

        {/* Overview */}
        <Section id="overview" title="Overview">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              <code className="text-foreground">createForm</code> provides schema-driven form management using{' '}
              <a href="https://github.com/standard-schema/standard-schema" className="text-foreground underline underline-offset-4">Standard Schema</a> for validation.
              It works with any schema library that implements the Standard Schema spec — Zod, Valibot, ArkType, and more.
            </p>
            <p className="text-muted-foreground mt-2">
              Key features:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li><strong>Any Standard Schema validator</strong>: Zod, Valibot, ArkType — just swap the schema, everything else stays the same</li>
              <li><strong>Configurable timing</strong>: <code className="text-foreground">validateOn</code> and <code className="text-foreground">revalidateOn</code> control when validation runs</li>
              <li><strong>Field controllers</strong>: <code className="text-foreground">form.field("name")</code> returns value, error, touched, dirty, and handlers</li>
              <li><strong>Server errors</strong>: <code className="text-foreground">form.setError()</code> for server-side validation feedback</li>
              <li><strong>Dirty tracking</strong>: <code className="text-foreground">form.isDirty()</code> compares current values against defaults</li>
            </ul>
          </div>
        </Section>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <div id="profile-form">
              <Example title="Profile Form" code={profileFormCode}>
                <div className="max-w-sm">
                  <ProfileFormDemo />
                </div>
              </Example>
              <p className="text-sm text-muted-foreground mt-2">
                Basic usage: one field with schema validation. The form validates on submit by default.
              </p>

              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-foreground">Using other validators</h4>
                <p className="text-sm text-muted-foreground">
                  <code className="text-foreground">createForm</code> accepts any{' '}
                  <a href="https://github.com/standard-schema/standard-schema" className="text-foreground underline underline-offset-4">Standard Schema</a> validator.
                  Just swap the schema definition — the rest of the component stays exactly the same.
                </p>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valibot</p>
                  <CodeBlock code={valibotSchemaCode} lang="tsx" />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ArkType</p>
                  <CodeBlock code={arktypeSchemaCode} lang="tsx" />
                </div>
              </div>
            </div>

            <div id="login-form">
              <Example title="Login Form" code={loginFormCode}>
                <div className="max-w-sm">
                  <LoginFormDemo />
                </div>
              </Example>
              <p className="text-sm text-muted-foreground mt-2">
                Multiple fields with <code className="text-foreground">validateOn: "blur"</code> and{' '}
                <code className="text-foreground">revalidateOn: "input"</code>.
                Errors appear when you leave a field, then clear as you type.
              </p>
            </div>

            <div id="notifications">
              <Example title="Notifications (Switch + setValue)" code={notificationsFormCode}>
                <div className="max-w-md">
                  <NotificationsFormDemo />
                </div>
              </Example>
              <p className="text-sm text-muted-foreground mt-2">
                Use <code className="text-foreground">field.setValue()</code> for non-input components.
                The submit button is disabled until the form is dirty.
              </p>
            </div>

            <div id="server-errors">
              <Example title="Server Errors (setError)" code={serverErrorCode}>
                <div className="max-w-sm">
                  <ServerErrorFormDemo />
                </div>
              </Example>
              <p className="text-sm text-muted-foreground mt-2">
                Use <code className="text-foreground">form.setError()</code> inside <code className="text-foreground">onSubmit</code> to
                display server-side validation errors on specific fields.
              </p>
            </div>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">createForm(options)</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="text-foreground">schema</code> — Standard Schema object (Zod, Valibot, ArkType, etc.)</li>
                <li><code className="text-foreground">defaultValues</code> — Initial field values</li>
                <li><code className="text-foreground">validateOn</code> — When to first validate: <code className="text-foreground">"input"</code> | <code className="text-foreground">"blur"</code> | <code className="text-foreground">"submit"</code> (default: <code className="text-foreground">"submit"</code>)</li>
                <li><code className="text-foreground">revalidateOn</code> — When to re-validate after first error: <code className="text-foreground">"input"</code> | <code className="text-foreground">"blur"</code> | <code className="text-foreground">"submit"</code> (default: <code className="text-foreground">"input"</code>)</li>
                <li><code className="text-foreground">onSubmit</code> — Async callback called with validated data</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Form Return</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="text-foreground">field(name)</code> — Get a field controller (memoized)</li>
                <li><code className="text-foreground">handleSubmit</code> — Form submit handler (pass to <code className="text-foreground">{'<form onSubmit={...}>'}</code>)</li>
                <li><code className="text-foreground">isSubmitting()</code> — Whether submission is in progress</li>
                <li><code className="text-foreground">isDirty()</code> — Whether any field differs from defaults</li>
                <li><code className="text-foreground">isValid()</code> — Whether all fields pass validation</li>
                <li><code className="text-foreground">errors()</code> — All current errors keyed by field name</li>
                <li><code className="text-foreground">reset()</code> — Reset all fields to defaults and clear errors</li>
                <li><code className="text-foreground">setError(name, message)</code> — Set an error on a field manually</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">Field Return</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="text-foreground">value()</code> — Current field value</li>
                <li><code className="text-foreground">error()</code> — Current validation error message</li>
                <li><code className="text-foreground">touched()</code> — Whether the field has been interacted with</li>
                <li><code className="text-foreground">dirty()</code> — Whether the value differs from default</li>
                <li><code className="text-foreground">setValue(value)</code> — Set the field value directly</li>
                <li><code className="text-foreground">handleInput</code> — Input event handler (reads <code className="text-foreground">e.target.value</code>)</li>
                <li><code className="text-foreground">handleBlur</code> — Blur event handler (marks touched)</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
