"use client"
/**
 * Checkbox Documentation Page
 */

import { createSignal } from '@barefootjs/dom'
import { Checkbox } from '@/components/Checkbox'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add checkbox`

const usageCode = `import { Checkbox } from '@/components/checkbox'

export default function Page() {
  return <Checkbox />
}`

const checkedCode = `<Checkbox />
<Checkbox checked />`

const disabledCode = `<Checkbox disabled />
<Checkbox checked disabled />`

const bindingCode = `import { createSignal } from '@barefootjs/dom'

const [checked, setChecked] = createSignal(false)

<Checkbox
  checked={checked()}
  onCheckedChange={setChecked}
/>
<p>{checked() ? 'Checked' : 'Unchecked'}</p>`

const withLabelCode = `<label class="flex items-center gap-2">
  <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
  <span>Accept terms and conditions</span>
</label>`

// Props definition
const checkboxProps: PropDefinition[] = [
  {
    name: 'checked',
    type: 'boolean',
    defaultValue: 'false',
    description: 'The controlled checked state of the checkbox.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the checkbox is disabled.',
  },
  {
    name: 'onCheckedChange',
    type: '(checked: boolean) => void',
    description: 'Event handler called when the checked state changes.',
  },
]

// Interactive binding example
function BindingExample() {
  const [checked, setChecked] = createSignal(false)
  return (
    <div class="space-y-2">
      <Checkbox
        checked={checked()}
        onCheckedChange={setChecked}
      />
      <p class="text-sm text-zinc-600">
        Status: <span class="checked-status font-medium">{checked() ? 'Checked' : 'Unchecked'}</span>
      </p>
    </div>
  )
}

// With label example
function WithLabelExample() {
  const [accepted, setAccepted] = createSignal(false)
  return (
    <div class="space-y-2">
      <label class="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
        <span class="text-sm">Accept terms and conditions</span>
      </label>
      <p class="text-sm text-zinc-600">
        Terms: <span class="terms-status font-medium">{accepted() ? 'Accepted' : 'Not accepted'}</span>
      </p>
    </div>
  )
}

export function CheckboxPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Checkbox"
        description="A control that allows the user to toggle between checked and unchecked states."
      />

      {/* Preview */}
      <Example title="" code={`<Checkbox />`}>
        <Checkbox />
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
          <Example title="Checked State" code={checkedCode}>
            <div class="flex gap-4">
              <Checkbox />
              <Checkbox checked={true} />
            </div>
          </Example>

          <Example title="Disabled" code={disabledCode}>
            <div class="flex gap-4">
              <Checkbox disabled={true} />
              <Checkbox checked={true} disabled={true} />
            </div>
          </Example>

          <Example title="State Binding" code={bindingCode}>
            <BindingExample />
          </Example>

          <Example title="With Label" code={withLabelCode}>
            <WithLabelExample />
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <PropsTable props={checkboxProps} />
      </Section>
    </div>
  )
}
