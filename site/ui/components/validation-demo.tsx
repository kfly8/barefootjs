"use client"
/**
 * ValidationDemo Components
 *
 * Interactive demos for form validation patterns.
 * Demonstrates error state management and multi-field validation.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@ui/components/ui/input'
import { Button } from '@ui/components/ui/button'

/**
 * Required field validation demo
 */
export function RequiredFieldDemo() {
  const [name, setName] = createSignal('')
  const [touched, setTouched] = createSignal(false)
  const error = createMemo(() => {
    if (!touched()) return ''
    return name().trim() === '' ? 'Name is required' : ''
  })

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Name *</label>
      <Input
        value={name()}
        onInput={(e) => setName(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Enter your name"
      />
      <p className="error-message text-sm text-destructive min-h-5">{error()}</p>
    </div>
  )
}

/**
 * Email format validation demo
 */
export function EmailValidationDemo() {
  const [email, setEmail] = createSignal('')
  const [touched, setTouched] = createSignal(false)
  const error = createMemo(() => {
    if (!touched()) return ''
    if (email().trim() === '') return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) return 'Invalid email format'
    return ''
  })
  const isValid = createMemo(() => touched() && error() === '')

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Email *</label>
      <Input
        type="email"
        value={email()}
        onInput={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Enter your email"
      />
      <div className="flex justify-between min-h-5">
        <p className="error-message text-sm text-destructive">{error()}</p>
        {isValid() ? <span className="valid-indicator text-sm text-success">Valid</span> : null}
      </div>
    </div>
  )
}

/**
 * Password confirmation demo - field dependency validation
 */
export function PasswordConfirmationDemo() {
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
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Password *</label>
        <Input
          type="password"
          value={password()}
          onInput={(e) => setPassword(e.target.value)}
          onBlur={() => setPasswordTouched(true)}
          placeholder="Enter password (min 8 chars)"
        />
        <p className="password-error text-sm text-destructive min-h-5">{passwordError()}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Confirm Password *</label>
        <Input
          type="password"
          value={confirmPassword()}
          onInput={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
          placeholder="Confirm your password"
        />
        <p className="confirm-error text-sm text-destructive min-h-5">{confirmError()}</p>
      </div>
      {isValid() ? (
        <p className="match-indicator text-sm text-success">Passwords match!</p>
      ) : null}
    </div>
  )
}

/**
 * Multi-field form demo with form-level validation
 */
export function MultiFieldFormDemo() {
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [confirmPassword, setConfirmPassword] = createSignal('')

  const [nameTouched, setNameTouched] = createSignal(false)
  const [emailTouched, setEmailTouched] = createSignal(false)
  const [passwordTouched, setPasswordTouched] = createSignal(false)
  const [confirmTouched, setConfirmTouched] = createSignal(false)

  const [submitted, setSubmitted] = createSignal(false)
  const [submitAttempted, setSubmitAttempted] = createSignal(false)

  // Field validations
  const nameError = createMemo(() => {
    if (!nameTouched() && !submitAttempted()) return ''
    if (name().trim() === '') return 'Name is required'
    if (name().trim().length < 2) return 'Name must be at least 2 characters'
    return ''
  })

  const emailError = createMemo(() => {
    if (!emailTouched() && !submitAttempted()) return ''
    if (email().trim() === '') return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) return 'Invalid email format'
    return ''
  })

  const passwordError = createMemo(() => {
    if (!passwordTouched() && !submitAttempted()) return ''
    if (password().length === 0) return 'Password is required'
    if (password().length < 8) return 'Password must be at least 8 characters'
    return ''
  })

  const confirmError = createMemo(() => {
    if (!confirmTouched() && !submitAttempted()) return ''
    if (confirmPassword().length === 0) return 'Please confirm your password'
    if (password() !== confirmPassword()) return 'Passwords do not match'
    return ''
  })

  // Form-level validity
  const isFormValid = createMemo(() => {
    const nameValid = name().trim().length >= 2
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())
    const passwordValid = password().length >= 8
    const confirmValid = password() === confirmPassword() && confirmPassword().length > 0
    return nameValid && emailValid && passwordValid && confirmValid
  })

  const handleSubmit = () => {
    setSubmitAttempted(true)
    setNameTouched(true)
    setEmailTouched(true)
    setPasswordTouched(true)
    setConfirmTouched(true)

    if (isFormValid()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="space-y-4">
      {submitted() ? (
        <div className="success-message p-4 bg-success/10 border border-success rounded-lg">
          <p className="text-success font-medium">Form submitted successfully!</p>
          <p className="text-sm text-muted-foreground mt-1">Name: {name()}, Email: {email()}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Name *</label>
            <Input
              value={name()}
              onInput={(e) => setName(e.target.value)}
              onBlur={() => setNameTouched(true)}
              placeholder="Enter your name (min 2 chars)"
            />
            <p className="name-error text-sm text-destructive min-h-5">{nameError()}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Email *</label>
            <Input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="Enter your email"
            />
            <p className="email-error text-sm text-destructive min-h-5">{emailError()}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Password *</label>
            <Input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              placeholder="Enter password (min 8 chars)"
            />
            <p className="password-error text-sm text-destructive min-h-5">{passwordError()}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Confirm Password *</label>
            <Input
              type="password"
              value={confirmPassword()}
              onInput={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
              placeholder="Confirm your password"
            />
            <p className="confirm-error text-sm text-destructive min-h-5">{confirmError()}</p>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitAttempted() && !isFormValid()}
            >
              Submit
            </Button>
          </div>

          {submitAttempted() && !isFormValid() ? (
            <p className="form-error text-sm text-destructive">Please fix the errors above</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
