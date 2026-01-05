"use client"
/**
 * FieldArraysDemo Components
 *
 * Interactive demos for dynamic form field array patterns.
 * Demonstrates add/remove fields, per-item validation, and cross-field validation.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from './Input'
import { Button } from './Button'

type EmailField = {
  id: number
  value: string
  touched: boolean
  error: string
}

/**
 * Validates an email and returns error message
 */
function validateEmail(email: string): string {
  if (email.trim() === '') return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format'
  return ''
}

/**
 * Creates a field with computed error
 */
function createField(id: number, value: string = '', touched: boolean = false): EmailField {
  return {
    id,
    value,
    touched,
    error: touched ? validateEmail(value) : '',
  }
}

/**
 * Basic field array demo - add/remove email fields with per-field validation
 */
export function BasicFieldArrayDemo() {
  const [fields, setFields] = createSignal<EmailField[]>([
    { id: 1, value: '', touched: false, error: '' }
  ])
  const [nextId, setNextId] = createSignal(2)
  const [submitted, setSubmitted] = createSignal(false)

  const isFormValid = createMemo(() => {
    return fields().every(f => validateEmail(f.value) === '')
  })

  const handleAdd = () => {
    setFields([...fields(), createField(nextId())])
    setNextId(nextId() + 1)
  }

  const handleRemove = (id: number) => {
    if (fields().length > 1) {
      setFields(fields().filter(f => f.id !== id))
    }
  }

  const handleChange = (id: number, value: string) => {
    setFields(fields().map(f => {
      if (f.id !== id) return f
      const error = f.touched ? validateEmail(value) : ''
      return { ...f, value, error }
    }))
  }

  const handleBlur = (id: number) => {
    setFields(fields().map(f => {
      if (f.id !== id) return f
      return { ...f, touched: true, error: validateEmail(f.value) }
    }))
  }

  const handleSubmit = () => {
    setFields(fields().map(f => ({
      ...f,
      touched: true,
      error: validateEmail(f.value),
    })))
    if (isFormValid()) {
      setSubmitted(true)
    }
  }

  return (
    <div class="space-y-4">
      {submitted() ? (
        <div class="success-message p-4 bg-success/10 border border-success rounded-lg">
          <p class="text-success font-medium">Emails submitted successfully!</p>
          <p class="text-sm text-muted-foreground mt-2">{fields().map(f => f.value).join(', ')}</p>
        </div>
      ) : (
        <div class="space-y-4">
          <div class="field-list space-y-3">
            {fields().map((field, index) => (
              <div key={field.id} class="field-item flex gap-2 items-start">
                <div class="flex-1 space-y-1">
                  <Input
                    inputType="email"
                    inputValue={field.value}
                    inputPlaceholder={`Email ${index + 1}`}
                    onInput={(e) => handleChange(field.id, e.target.value)}
                    onBlur={() => handleBlur(field.id)}
                  />
                  <p class="field-error text-sm text-destructive min-h-5">{field.error}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  disabled={fields().length <= 1}
                  onClick={() => handleRemove(field.id)}
                >
                  X
                </Button>
              </div>
            ))}
          </div>

          <div class="flex gap-2">
            <Button variant="outline" onClick={handleAdd}>
              + Add Email
            </Button>
            <Button onClick={handleSubmit}>
              Submit
            </Button>
          </div>

          <p class="field-count text-sm text-muted-foreground">
            {fields().length} email(s) added
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Computes error for a field including duplicate check
 */
function computeFieldError(field: EmailField, allFields: EmailField[]): string {
  if (!field.touched) return ''
  const basicError = validateEmail(field.value)
  if (basicError) return basicError
  // Check for duplicates
  if (field.value.trim() !== '') {
    const isDuplicate = allFields.some(
      f => f.id !== field.id && f.value.toLowerCase() === field.value.toLowerCase()
    )
    if (isDuplicate) return 'Duplicate email'
  }
  return ''
}

/**
 * Updates all field errors (needed when duplicates change)
 */
function updateAllErrors(fields: EmailField[]): EmailField[] {
  return fields.map(f => ({
    ...f,
    error: computeFieldError(f, fields),
  }))
}

/**
 * Duplicate validation demo - cross-field validation for duplicates
 */
export function DuplicateValidationDemo() {
  const [fields, setFields] = createSignal<EmailField[]>([
    { id: 1, value: '', touched: false, error: '' },
    { id: 2, value: '', touched: false, error: '' }
  ])
  const [nextId, setNextId] = createSignal(3)

  const duplicateCount = createMemo(() => {
    const values = fields().map(f => f.value.toLowerCase().trim()).filter(v => v !== '')
    const uniqueValues = new Set(values)
    return values.length - uniqueValues.size
  })

  const handleAdd = () => {
    const newFields = [...fields(), createField(nextId())]
    setFields(updateAllErrors(newFields))
    setNextId(nextId() + 1)
  }

  const handleRemove = (id: number) => {
    if (fields().length > 1) {
      const newFields = fields().filter(f => f.id !== id)
      setFields(updateAllErrors(newFields))
    }
  }

  const handleChange = (id: number, value: string) => {
    const newFields = fields().map(f => {
      if (f.id !== id) return f
      return { ...f, value }
    })
    // Recompute all errors since duplicates may have changed
    setFields(updateAllErrors(newFields))
  }

  const handleBlur = (id: number) => {
    const newFields = fields().map(f => {
      if (f.id !== id) return f
      return { ...f, touched: true }
    })
    setFields(updateAllErrors(newFields))
  }

  return (
    <div class="space-y-4">
      <div class="field-list space-y-3">
        {fields().map((field, index) => (
          <div key={field.id} class="field-item flex gap-2 items-start">
            <div class="flex-1 space-y-1">
              <Input
                inputType="email"
                inputValue={field.value}
                inputPlaceholder={`Email ${index + 1}`}
                onInput={(e) => handleChange(field.id, e.target.value)}
                onBlur={() => handleBlur(field.id)}
              />
              <p class="field-error text-sm text-destructive min-h-5">{field.error}</p>
            </div>
            <Button
              variant="destructive"
              size="icon"
              disabled={fields().length <= 1}
              onClick={() => handleRemove(field.id)}
            >
              X
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={handleAdd}>
        + Add Email
      </Button>

      {duplicateCount() > 0 ? (
        <p class="duplicate-warning text-sm text-warning">
          {duplicateCount()} duplicate email(s) detected
        </p>
      ) : null}
    </div>
  )
}

/**
 * Min/max fields demo - enforce field count constraints
 */
export function MinMaxFieldsDemo() {
  const MIN_FIELDS = 1
  const MAX_FIELDS = 5

  const [fields, setFields] = createSignal<EmailField[]>([
    { id: 1, value: '', touched: false, error: '' }
  ])
  const [nextId, setNextId] = createSignal(2)

  const canAdd = createMemo(() => fields().length < MAX_FIELDS)
  const canRemove = createMemo(() => fields().length > MIN_FIELDS)

  const handleAdd = () => {
    if (canAdd()) {
      setFields([...fields(), createField(nextId())])
      setNextId(nextId() + 1)
    }
  }

  const handleRemove = (id: number) => {
    if (canRemove()) {
      setFields(fields().filter(f => f.id !== id))
    }
  }

  const handleChange = (id: number, value: string) => {
    setFields(fields().map(f => {
      if (f.id !== id) return f
      const error = f.touched ? validateEmail(value) : ''
      return { ...f, value, error }
    }))
  }

  const handleBlur = (id: number) => {
    setFields(fields().map(f => {
      if (f.id !== id) return f
      return { ...f, touched: true, error: validateEmail(f.value) }
    }))
  }

  return (
    <div class="space-y-4">
      <div class="field-list space-y-3">
        {fields().map((field, index) => (
          <div key={field.id} class="field-item flex gap-2 items-start">
            <div class="flex-1 space-y-1">
              <Input
                inputType="email"
                inputValue={field.value}
                inputPlaceholder={`Email ${index + 1}`}
                onInput={(e) => handleChange(field.id, e.target.value)}
                onBlur={() => handleBlur(field.id)}
              />
              <p class="field-error text-sm text-destructive min-h-5">{field.error}</p>
            </div>
            <Button
              variant="destructive"
              size="icon"
              disabled={!canRemove()}
              onClick={() => handleRemove(field.id)}
            >
              X
            </Button>
          </div>
        ))}
      </div>

      <div class="flex items-center gap-4">
        <Button variant="outline" onClick={handleAdd} disabled={!canAdd()}>
          + Add Email
        </Button>
        <p class="field-count text-sm text-muted-foreground">
          {fields().length} / {MAX_FIELDS} emails
        </p>
      </div>

      {!canAdd() ? (
        <p class="max-warning text-sm text-warning">
          Maximum {MAX_FIELDS} emails allowed
        </p>
      ) : null}
    </div>
  )
}
