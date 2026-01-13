"use client"
/**
 * SubmitDemo Components
 *
 * Interactive demos for form submit handling patterns.
 * Demonstrates async state management with loading, success, and error states.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@ui/components/ui/input'
import { Button } from '@ui/components/ui/button'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '@ui/components/ui/toast'

/**
 * Basic submit demo - shows loading state and success feedback
 */
export function BasicSubmitDemo() {
  const [email, setEmail] = createSignal('')
  const [touched, setTouched] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [success, setSuccess] = createSignal(false)

  const error = createMemo(() => {
    if (!touched()) return ''
    if (email().trim() === '') return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) return 'Invalid email format'
    return ''
  })

  const isValid = createMemo(() => error() === '' && email().trim() !== '')

  const handleSubmit = async () => {
    if (!isValid() || loading()) return

    setLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setLoading(false)
    setSuccess(true)
    setEmail('')
    setTouched(false)

    // Auto-hide success toast
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm text-muted-foreground">Email *</label>
        <Input
          inputType="email"
          inputValue={email()}
          onInput={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          inputPlaceholder="Enter your email"
          inputDisabled={loading()}
        />
        <p class="error-message text-sm text-destructive min-h-5">{error()}</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid() || loading()}
      >
        <span class="button-text">{loading() ? 'Submitting...' : 'Subscribe'}</span>
      </Button>

      <ToastProvider position="bottom-right">
        <Toast variant="success" open={success()}>
          <div class="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>You have been subscribed successfully!</ToastDescription>
          </div>
          <ToastClose onClick={() => setSuccess(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Network error demo - shows error handling and retry functionality
 */
export function NetworkErrorDemo() {
  const [message, setMessage] = createSignal('')
  const [touched, setTouched] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [errorMsg, setErrorMsg] = createSignal('')
  const [success, setSuccess] = createSignal(false)
  const [attemptCount, setAttemptCount] = createSignal(0)

  const validationError = createMemo(() => {
    if (!touched()) return ''
    if (message().trim() === '') return 'Message is required'
    return ''
  })

  const isValid = createMemo(() => validationError() === '' && message().trim() !== '')

  const handleSubmit = async () => {
    if (!isValid() || loading()) return

    setLoading(true)
    setErrorMsg('')
    setAttemptCount(attemptCount() + 1)

    // Simulate API call that fails on first attempt
    await new Promise(resolve => setTimeout(resolve, 1500))

    setLoading(false)

    // Fail on first attempt, succeed on retry
    if (attemptCount() === 1) {
      setErrorMsg('Network error. Please try again.')
    } else {
      setSuccess(true)
      setMessage('')
      setTouched(false)
      setAttemptCount(0)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const handleRetry = () => {
    setErrorMsg('')
    handleSubmit()
  }

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm text-muted-foreground">Message *</label>
        <Input
          inputValue={message()}
          onInput={(e) => setMessage(e.target.value)}
          onBlur={() => setTouched(true)}
          inputPlaceholder="Enter your message"
          inputDisabled={loading()}
        />
        <p class="validation-error text-sm text-destructive min-h-5">{validationError()}</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid() || loading()}
      >
        <span class="button-text">{loading() ? 'Sending...' : 'Send Message'}</span>
      </Button>

      <ToastProvider position="bottom-right">
        <Toast variant="success" open={success()}>
          <div class="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Message sent successfully!</ToastDescription>
          </div>
          <ToastClose onClick={() => setSuccess(false)} />
        </Toast>
        <Toast variant="error" open={errorMsg() !== ''}>
          <div class="flex-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription class="error-description">{errorMsg()}</ToastDescription>
          </div>
          <div class="flex gap-2">
            <ToastAction altText="Retry sending" onClick={handleRetry}>
              Retry
            </ToastAction>
            <ToastClose onClick={() => setErrorMsg('')} />
          </div>
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Server validation error demo - shows server-side validation errors
 */
export function ServerValidationDemo() {
  const [email, setEmail] = createSignal('')
  const [touched, setTouched] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [serverError, setServerError] = createSignal('')
  const [success, setSuccess] = createSignal(false)

  const clientError = createMemo(() => {
    if (!touched()) return ''
    if (email().trim() === '') return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) return 'Invalid email format'
    return ''
  })

  const isValid = createMemo(() => clientError() === '' && email().trim() !== '')

  const handleSubmit = async () => {
    if (!isValid() || loading()) return

    setLoading(true)
    setServerError('')

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setLoading(false)

    // Simulate server validation error for specific email
    if (email().toLowerCase() === 'taken@example.com') {
      setServerError('This email is already registered')
    } else {
      setSuccess(true)
      setEmail('')
      setTouched(false)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm text-muted-foreground">Email *</label>
        <Input
          inputType="email"
          inputValue={email()}
          onInput={(e) => {
            setEmail(e.target.value)
            setServerError('')
          }}
          onBlur={() => setTouched(true)}
          inputPlaceholder="Enter your email"
          inputDisabled={loading()}
        />
        <p class="client-error text-sm text-destructive min-h-5">{clientError()}</p>
        {serverError() !== '' ? (
          <p class="server-error text-sm text-destructive">{serverError()}</p>
        ) : null}
      </div>

      <p class="text-xs text-muted-foreground">
        Try "taken@example.com" to see server validation error
      </p>

      <Button
        onClick={handleSubmit}
        disabled={!isValid() || loading()}
      >
        <span class="button-text">{loading() ? 'Registering...' : 'Register'}</span>
      </Button>

      <ToastProvider position="bottom-right">
        <Toast variant="success" open={success()}>
          <div class="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Registration successful!</ToastDescription>
          </div>
          <ToastClose onClick={() => setSuccess(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}
