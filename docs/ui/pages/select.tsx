/**
 * Select Documentation Page
 */

import { Select } from '@/components/ui/select'
import { SelectBindingDemo, SelectFocusDemo } from '@/components/select-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  getHighlightedCommands,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'disabled', title: 'Disabled', branch: 'child' },
  { id: 'value-binding', title: 'Value Binding', branch: 'child' },
  { id: 'focus-state', title: 'Focus State', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Options for examples
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

// Code examples
const basicCode = `"use client"

import { Select } from '@/components/ui/select'

const options = [
  { value: 'option-a', label: 'Option A' },
  { value: 'option-b', label: 'Option B' },
  { value: 'option-c', label: 'Option C' },
]

function SelectBasic() {
  return (
    <Select options={options} placeholder="Select an option..." />
  )
}`

const disabledCode = `"use client"

import { Select } from '@/components/ui/select'

const options = [
  { value: 'available', label: 'Available' },
  { value: 'unavailable', label: 'Unavailable', disabled: true },
  { value: 'coming-soon', label: 'Coming Soon' },
]

function SelectDisabled() {
  return (
    <div className="flex flex-col gap-2 max-w-sm">
      <Select disabled options={options} placeholder="Disabled select" />
      <Select options={options} placeholder="With disabled option" />
    </div>
  )
}`

const bindingCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Select } from '@/components/ui/select'

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

function SelectBinding() {
  const [value, setValue] = createSignal('')

  return (
    <div className="max-w-sm space-y-2">
      <Select
        options={options}
        value={value()}
        placeholder="Select a fruit..."
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="text-sm text-muted-foreground">
        Selected: {value() || 'none'}
      </p>
    </div>
  )
}`

const focusCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Select } from '@/components/ui/select'

const options = [
  { value: 'option-a', label: 'Option A' },
  { value: 'option-b', label: 'Option B' },
]

function SelectFocus() {
  const [focused, setFocused] = createSignal(false)

  return (
    <div className="max-w-sm space-y-2">
      <Select
        options={options}
        placeholder="Focus me..."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <p className="text-sm text-muted-foreground">
        {focused() ? 'Select is focused' : 'Select is not focused'}
      </p>
    </div>
  )
}`

// Props definition
const selectProps: PropDefinition[] = [
  {
    name: 'options',
    type: 'SelectOption[]',
    description: 'Array of options to display. Each option has value, label, and optional disabled.',
  },
  {
    name: 'value',
    type: 'string',
    description: 'The controlled value of the select.',
  },
  {
    name: 'placeholder',
    type: 'string',
    description: 'Placeholder text shown when no option is selected.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the select is disabled.',
  },
  {
    name: 'error',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the select is in an error state.',
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
  const installCommands = getHighlightedCommands('barefoot add select')

  return (
    <DocPage slug="select" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Select"
          description="Displays a select dropdown for choosing from a list of options."
          {...getNavLinks('select')}
        />

        {/* Preview */}
        <Example title="" code={`<Select options={options} placeholder="Select an option..." />`}>
          <Select options={basicOptions} placeholder="Select an option..." />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add select" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <div className="max-w-sm">
                <Select options={basicOptions} placeholder="Select an option..." />
              </div>
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div className="flex flex-col gap-2 max-w-sm">
                <Select disabled options={basicOptions} placeholder="Disabled select" />
                <Select options={disabledOptionsExample} placeholder="With disabled option" />
              </div>
            </Example>

            <Example title="Value Binding" code={bindingCode}>
              <div className="max-w-sm">
                <SelectBindingDemo />
              </div>
            </Example>

            <Example title="Focus State" code={focusCode}>
              <div className="max-w-sm">
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
