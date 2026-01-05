/**
 * Field Arrays Documentation Page
 *
 * Demonstrates dynamic list of form inputs pattern.
 */

import { Input } from '@/components/Input'
import {
  BasicFieldArrayDemo,
  DuplicateValidationDemo,
  MinMaxFieldsDemo,
} from '@/components/FieldArraysDemo'
import {
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../_shared/docs'
import { TableOfContents } from '@/components/TableOfContents'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'pattern-overview', title: 'Pattern Overview' },
  { id: 'examples', title: 'Examples' },
  { id: 'key-points', title: 'Key Points' },
]

// Code examples
const basicFieldArrayCode = `import { createSignal, createMemo } from '@barefootjs/dom'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

type EmailField = {
  id: number
  value: string
  touched: boolean
}

const [fields, setFields] = createSignal<EmailField[]>([
  { id: 1, value: '', touched: false }
])
const [nextId, setNextId] = createSignal(2)

const validateEmail = (email: string): string => {
  if (email.trim() === '') return 'Email is required'
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return 'Invalid email format'
  return ''
}

const handleAdd = () => {
  setFields([...fields(), { id: nextId(), value: '', touched: false }])
  setNextId(nextId() + 1)
}

const handleRemove = (id: number) => {
  if (fields().length > 1) {
    setFields(fields().filter(f => f.id !== id))
  }
}

const handleChange = (id: number, value: string) => {
  setFields(fields().map(f => f.id === id ? { ...f, value } : f))
}

{fields().map((field, index) => (
  <div key={field.id}>
    <Input
      inputValue={field.value}
      onInput={(e) => handleChange(field.id, e.target.value)}
    />
    <Button onClick={() => handleRemove(field.id)}>Remove</Button>
  </div>
))}
<Button onClick={handleAdd}>+ Add Email</Button>`

const duplicateValidationCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const isDuplicate = (id: number, value: string): boolean => {
  if (value.trim() === '') return false
  return fields().some(f => f.id !== id && f.value.toLowerCase() === value.toLowerCase())
}

const getFieldError = (field: EmailField): string => {
  if (!field.touched) return ''
  const basicError = validateEmail(field.value)
  if (basicError) return basicError
  if (isDuplicate(field.id, field.value)) return 'Duplicate email'
  return ''
}

const duplicateCount = createMemo(() => {
  const values = fields().map(f => f.value.toLowerCase().trim()).filter(v => v !== '')
  const uniqueValues = new Set(values)
  return values.length - uniqueValues.size
})

{duplicateCount() > 0 && (
  <p class="text-amber-400">{duplicateCount()} duplicate(s) detected</p>
)}`

const minMaxFieldsCode = `import { createSignal, createMemo } from '@barefootjs/dom'

const MIN_FIELDS = 1
const MAX_FIELDS = 5

const canAdd = createMemo(() => fields().length < MAX_FIELDS)
const canRemove = createMemo(() => fields().length > MIN_FIELDS)

const handleAdd = () => {
  if (canAdd()) {
    setFields([...fields(), { id: nextId(), value: '', touched: false }])
    setNextId(nextId() + 1)
  }
}

const handleRemove = (id: number) => {
  if (canRemove()) {
    setFields(fields().filter(f => f.id !== id))
  }
}

<Button onClick={handleAdd} disabled={!canAdd()}>
  + Add Email
</Button>
<p>{fields().length} / {MAX_FIELDS} emails</p>`

export function FieldArraysPage() {
  return (
    <div class="flex gap-10">
      <div class="flex-1 min-w-0 space-y-12">
        <PageHeader
          title="Field Arrays"
          description="Demonstrates dynamic list of form inputs with add/remove and per-item validation."
        />

        {/* Preview - Static example */}
        <Example title="" code={basicFieldArrayCode}>
          <div class="max-w-md">
            <div class="space-y-2">
              <Input inputPlaceholder="Email 1" />
              <Input inputPlaceholder="Email 2" />
            </div>
            <p class="text-sm text-muted-foreground mt-2">
              See interactive examples below.
            </p>
          </div>
        </Example>

        {/* Pattern Overview */}
        <Section id="pattern-overview" title="Pattern Overview">
          <div class="prose prose-invert max-w-none">
            <p class="text-muted-foreground">
              Field arrays in BarefootJS use a <code class="text-foreground">createSignal</code> containing an array of field objects.
              Each field has a unique ID for proper list reconciliation, and its own value and touched state.
            </p>
            <p class="text-muted-foreground mt-2">
              Key concepts:
            </p>
            <ul class="list-disc list-inside text-muted-foreground space-y-1 mt-2">
              <li><strong>Field object</strong>: Contains id, value, and touched state</li>
              <li><strong>Unique ID</strong>: Each field has a unique ID for stable key management</li>
              <li><strong>Per-field validation</strong>: Validate each field independently</li>
              <li><strong>Cross-field validation</strong>: Check duplicates or dependencies across fields</li>
              <li><strong>Immutable updates</strong>: Use map/filter to update the array signal</li>
            </ul>
          </div>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Basic Field Array" code={basicFieldArrayCode}>
              <div class="max-w-md">
                <BasicFieldArrayDemo />
              </div>
            </Example>

            <Example title="Duplicate Detection" code={duplicateValidationCode}>
              <div class="max-w-md">
                <DuplicateValidationDemo />
              </div>
            </Example>

            <Example title="Min/Max Field Constraints" code={minMaxFieldsCode}>
              <div class="max-w-md">
                <MinMaxFieldsDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Key Points */}
        <Section id="key-points" title="Key Points">
          <div class="space-y-4">
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Array State Management</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Store field array in a single signal: <code class="text-foreground">{'createSignal<Field[]>([])'}</code></li>
                <li>Each field object contains: id, value, touched (and any other state)</li>
                <li>Use immutable operations: <code class="text-foreground">map()</code>, <code class="text-foreground">filter()</code>, spread operator</li>
                <li>Maintain a separate counter signal for generating unique IDs</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Key Management</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Always use <code class="text-foreground">key={'{field.id}'}</code> for list items</li>
                <li>Never use array index as key (causes issues on reorder/delete)</li>
                <li>Generate unique IDs with incrementing counter: <code class="text-foreground">nextId()</code></li>
                <li>Unique keys ensure proper DOM reconciliation</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Per-Item Validation</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Create a validation function that takes the field value</li>
                <li>Check touched state before showing errors</li>
                <li>Update touched state on blur: <code class="text-foreground">{'onBlur={() => handleBlur(field.id)}'}</code></li>
                <li>Each field error is computed independently</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Cross-Field Validation</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Access entire array in validation: <code class="text-foreground">fields().some()</code></li>
                <li>Use <code class="text-foreground">createMemo</code> for derived validations (e.g., duplicate count)</li>
                <li>Exclude current field when checking duplicates: <code class="text-foreground">f.id !== id</code></li>
                <li>Show summary warnings for array-level issues</li>
              </ul>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-semibold text-foreground mb-2">Add/Remove Operations</h3>
              <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>Add</strong>: Spread existing array and append new field</li>
                <li><strong>Remove</strong>: Filter out field by ID</li>
                <li>Enforce min/max constraints with <code class="text-foreground">createMemo</code> for canAdd/canRemove</li>
                <li>Disable buttons when constraints are reached</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>
      <TableOfContents items={tocItems} />
    </div>
  )
}
