"use client"
/**
 * Input Documentation Page
 */

import { createSignal } from '@barefootjs/dom'
import { Input } from '@/components/Input'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add input`

const usageCode = `import { Input } from '@/components/input'

export default function Page() {
  return <Input placeholder="Enter text..." />
}`

const typesCode = `<Input inputType="text" inputPlaceholder="Text input" />
<Input inputType="email" inputPlaceholder="Email address" />
<Input inputType="password" inputPlaceholder="Password" />
<Input inputType="number" inputPlaceholder="Number" />`

const disabledCode = `<Input inputDisabled inputPlaceholder="Disabled input" />
<Input inputReadOnly inputValue="Read-only value" />`

const bindingCode = `import { createSignal } from '@barefootjs/dom'

const [value, setValue] = createSignal('')

<Input
  inputValue={value()}
  onInput={(e) => setValue(e.target.value)}
  inputPlaceholder="Type something..."
/>
<p>You typed: {value()}</p>`

// Props definition
const inputProps: PropDefinition[] = [
  {
    name: 'inputType',
    type: "'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'",
    defaultValue: "'text'",
    description: 'The type of the input.',
  },
  {
    name: 'inputPlaceholder',
    type: 'string',
    description: 'Placeholder text shown when input is empty.',
  },
  {
    name: 'inputValue',
    type: 'string',
    description: 'The controlled value of the input.',
  },
  {
    name: 'inputDisabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the input is disabled.',
  },
  {
    name: 'inputReadOnly',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the input is read-only.',
  },
  {
    name: 'onInput',
    type: '(e: Event) => void',
    description: 'Event handler called on each input change.',
  },
  {
    name: 'onChange',
    type: '(e: Event) => void',
    description: 'Event handler called when input value changes and loses focus.',
  },
  {
    name: 'onBlur',
    type: '(e: Event) => void',
    description: 'Event handler called when input loses focus.',
  },
  {
    name: 'onFocus',
    type: '(e: Event) => void',
    description: 'Event handler called when input gains focus.',
  },
]

// Interactive binding example
function BindingExample() {
  const [value, setValue] = createSignal('')
  return (
    <div class="space-y-2">
      <Input
        inputValue={value()}
        onInput={(e) => setValue(e.target.value)}
        inputPlaceholder="Type something..."
      />
      <p class="text-sm text-zinc-600">You typed: <span class="typed-value font-medium">{value()}</span></p>
    </div>
  )
}

// Focus/blur example
function FocusExample() {
  const [focused, setFocused] = createSignal(false)
  return (
    <div class="space-y-2">
      <Input
        inputPlaceholder="Focus me..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <p class="text-sm">
        Status: <span class="focus-status font-medium">{focused() ? 'Focused' : 'Not focused'}</span>
      </p>
    </div>
  )
}

export function InputPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Input"
        description="Displays an input field for user text entry."
      />

      {/* Preview */}
      <Example title="" code={`<Input inputPlaceholder="Enter text..." />`}>
        <Input inputPlaceholder="Enter text..." />
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Input Types" code={typesCode}>
            <div class="flex flex-col gap-2 max-w-sm">
              <Input inputType="text" inputPlaceholder="Text input" />
              <Input inputType="email" inputPlaceholder="Email address" />
              <Input inputType="password" inputPlaceholder="Password" />
              <Input inputType="number" inputPlaceholder="Number" />
            </div>
          </Example>

          <Example title="Disabled & Read-only" code={disabledCode}>
            <div class="flex flex-col gap-2 max-w-sm">
              <Input inputDisabled inputPlaceholder="Disabled input" />
              <Input inputReadOnly inputValue="Read-only value" />
            </div>
          </Example>

          <Example title="Value Binding" code={bindingCode}>
            <div class="max-w-sm">
              <BindingExample />
            </div>
          </Example>

          <Example title="Focus State" code={`<Input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />`}>
            <div class="max-w-sm">
              <FocusExample />
            </div>
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <PropsTable props={inputProps} />
      </Section>
    </div>
  )
}
