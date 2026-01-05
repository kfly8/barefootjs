/**
 * Select Documentation Page
 */

import { Select } from '@/components/Select'
import { SelectBindingDemo, SelectFocusDemo } from '@/components/SelectDemo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../_shared/docs'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add select`

const usageCode = `import { Select } from '@/components/select'

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
]

export default function Page() {
  return <Select options={options} selectPlaceholder="Select a fruit..." />
}`

const basicOptions = [
  { value: 'option-a', label: 'Option A' },
  { value: 'option-b', label: 'Option B' },
  { value: 'option-c', label: 'Option C' },
]

const disabledOptionsExample = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable (disabled)', disabled: true },
  { value: 'coming-soon', label: 'Coming Soon' },
]

const disabledCode = `<Select selectDisabled options={options} selectPlaceholder="Disabled select" />

// With disabled option
const options = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable', disabled: true },
]`

const bindingCode = `import { createSignal } from '@barefootjs/dom'

const [value, setValue] = createSignal('')

<Select
  options={options}
  selectValue={value()}
  selectPlaceholder="Select a fruit..."
  onChange={(e) => setValue(e.target.value)}
/>
<p>Selected: {value()}</p>`

// Props definition
const selectProps: PropDefinition[] = [
  {
    name: 'options',
    type: 'SelectOption[]',
    description: 'Array of options to display. Each option has value, label, and optional disabled.',
  },
  {
    name: 'selectValue',
    type: 'string',
    description: 'The controlled value of the select.',
  },
  {
    name: 'selectPlaceholder',
    type: 'string',
    description: 'Placeholder text shown when no option is selected.',
  },
  {
    name: 'selectDisabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the select is disabled.',
  },
  {
    name: 'onChange',
    type: '(e: Event) => void',
    description: 'Event handler called when selection changes.',
  },
  {
    name: 'onFocus',
    type: '(e: Event) => void',
    description: 'Event handler called when select gains focus.',
  },
  {
    name: 'onBlur',
    type: '(e: Event) => void',
    description: 'Event handler called when select loses focus.',
  },
]

export function SelectPage() {
  return (
    <DocPage slug="select" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Select"
          description="Displays a select dropdown for choosing from a list of options."
        />

        {/* Preview */}
        <Example title="" code={`<Select options={options} selectPlaceholder="Select an option..." />`}>
          <Select options={basicOptions} selectPlaceholder="Select an option..." />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Basic Select" code={`<Select options={options} selectPlaceholder="Select an option..." />`}>
              <div class="max-w-sm">
                <Select options={basicOptions} selectPlaceholder="Select an option..." />
              </div>
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div class="flex flex-col gap-2 max-w-sm">
                <Select selectDisabled options={basicOptions} selectPlaceholder="Disabled select" />
                <Select options={disabledOptionsExample} selectPlaceholder="With disabled option" />
              </div>
            </Example>

            <Example title="Value Binding" code={bindingCode}>
              <div class="max-w-sm">
                <SelectBindingDemo />
              </div>
            </Example>

            <Example title="Focus State" code={`<Select onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />`}>
              <div class="max-w-sm">
                <SelectFocusDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={selectProps} />
        </Section>
      </div>
    </DocPage>
  )
}
