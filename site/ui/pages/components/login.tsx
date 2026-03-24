/**
 * Login Reference Page (/components/login)
 *
 * Block-level composition pattern: Card + Field + Input + Checkbox + Toast.
 * Compiler stress test for deep nesting, conditional rendering, and memo chains.
 */

import { LoginBasicDemo, LoginSocialDemo } from '@/components/login-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'social', title: 'Social Login', branch: 'end' },
]

const basicCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'

function LoginBasic() {
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [emailTouched, setEmailTouched] = createSignal(false)
  const [passwordTouched, setPasswordTouched] = createSignal(false)
  const [rememberMe, setRememberMe] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [success, setSuccess] = createSignal(false)

  const emailError = createMemo(() => {
    if (!emailTouched()) return ''
    if (email().trim() === '') return 'Email is required'
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email())) return 'Invalid email format'
    return ''
  })

  const passwordError = createMemo(() => {
    if (!passwordTouched()) return ''
    if (password() === '') return 'Password is required'
    if (password().length < 8) return 'Password must be at least 8 characters'
    return ''
  })

  const isFormValid = createMemo(() =>
    emailError() === '' && passwordError() === '' &&
    email().trim() !== '' && password() !== ''
  )

  const handleSubmit = async () => {
    if (!isFormValid() || loading()) return
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Field data-invalid={emailError() !== '' || undefined}>
            <FieldLabel for="email">Email</FieldLabel>
            <FieldContent>
              <Input id="email" type="email" value={email()} onInput={...} onBlur={...} />
              {emailError() !== '' ? <FieldError>{emailError()}</FieldError> : null}
            </FieldContent>
          </Field>
          {/* Password field, Checkbox, Button */}
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">Don't have an account? Sign up</p>
      </CardFooter>
      <ToastProvider position="bottom-right">
        <Toast variant="success" open={success()}>...</Toast>
      </ToastProvider>
    </Card>
  )
}`

const socialCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function LoginSocial() {
  // Same signal/memo pattern as basic...

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Choose your preferred sign-in method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline">Google</Button>
          <Button variant="outline">GitHub</Button>
        </div>
        <Separator />
        <form className="space-y-4">
          {/* Email + password fields + submit */}
        </form>
      </CardContent>
    </Card>
  )
}`

export function LoginRefPage() {
  return (
    <DocPage slug="login" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Login"
          description="A login form block combining Card, Field, Input, Checkbox, and Toast components with validation and loading states."
          {...getNavLinks('login')}
        />

        {/* Preview */}
        <Example title="" code={basicCode}>
          <LoginBasicDemo />
        </Example>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <LoginBasicDemo />
            </Example>

            <Example title="Social Login" code={socialCode}>
              <LoginSocialDemo />
            </Example>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
