/**
 * Dropdown Documentation Page
 */

import { DropdownBasicDemo, DropdownWithDefaultDemo, DropdownDisabledDemo } from '@/components/DropdownDemo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add dropdown`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
} from '@/components/dropdown'

export default function Page() {
  const [open, setOpen] = createSignal(false)
  const [value, setValue] = createSignal('')

  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ]

  const selectedLabel = () => {
    const selected = options.find(opt => opt.value === value())
    return selected ? selected.label : ''
  }

  const handleSelect = (optionValue: string) => {
    setValue(optionValue)
    setOpen(false)
  }

  return (
    <Dropdown>
      <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
        {value() ? selectedLabel() : <DropdownLabel>Select...</DropdownLabel>}
      </DropdownTrigger>
      <DropdownContent open={open()} onClose={() => setOpen(false)}>
        {options.map(option => (
          <DropdownItem
            value={option.value}
            selected={value() === option.value}
            onClick={() => handleSelect(option.value)}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}`

const basicCode = `const [open, setOpen] = createSignal(false)
const [value, setValue] = createSignal('')

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
]

<Dropdown>
  <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
    {value() ? selectedLabel() : <DropdownLabel>Select a fruit</DropdownLabel>}
  </DropdownTrigger>
  <DropdownContent open={open()} onClose={() => setOpen(false)}>
    {options.map(option => (
      <DropdownItem
        value={option.value}
        selected={value() === option.value}
        onClick={() => handleSelect(option.value)}
      >
        {option.label}
      </DropdownItem>
    ))}
  </DropdownContent>
</Dropdown>`

const defaultValueCode = `const [open, setOpen] = createSignal(false)
const [value, setValue] = createSignal('medium') // Default value

const options = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
]

<Dropdown>
  <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
    {selectedLabel()}
  </DropdownTrigger>
  <DropdownContent open={open()} onClose={() => setOpen(false)}>
    {options.map(option => (
      <DropdownItem
        value={option.value}
        selected={value() === option.value}
        onClick={() => handleSelect(option.value)}
      >
        {option.label}
      </DropdownItem>
    ))}
  </DropdownContent>
</Dropdown>`

const disabledCode = `<Dropdown>
  <DropdownTrigger open={open()} onClick={() => setOpen(!open())} disabled>
    <DropdownLabel>Disabled</DropdownLabel>
  </DropdownTrigger>
  <DropdownContent open={open()} onClose={() => setOpen(false)}>
    <DropdownItem value="option1" onClick={() => {}}>
      Option 1
    </DropdownItem>
  </DropdownContent>
</Dropdown>`

// Props definitions
const dropdownTriggerProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the dropdown is open.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the trigger is disabled.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the trigger is clicked.',
  },
]

const dropdownContentProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the dropdown content is visible.',
  },
  {
    name: 'onClose',
    type: '() => void',
    description: 'Event handler called when the dropdown should close (ESC key).',
  },
]

const dropdownItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value of the item.',
  },
  {
    name: 'selected',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the item is selected.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the item is disabled.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the item is clicked.',
  },
]

const dropdownLabelProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'Child',
    description: 'The placeholder text to display.',
  },
]

export function DropdownPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Dropdown"
        description="A select-like dropdown menu for choosing from a list of options."
      />

      {/* Preview */}
      <Example title="" code={`<Dropdown><DropdownTrigger>...</DropdownTrigger><DropdownContent>...</DropdownContent></Dropdown>`}>
        <div class="flex gap-4">
          <DropdownBasicDemo />
        </div>
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Features */}
      <Section title="Features">
        <ul class="list-disc list-inside space-y-2 text-zinc-400">
          <li><strong class="text-zinc-200">Props-based state</strong> - Parent controls open/selected state with signals</li>
          <li><strong class="text-zinc-200">ESC key to close</strong> - Press Escape to close the dropdown</li>
          <li><strong class="text-zinc-200">Click to select</strong> - Click an item to select it</li>
          <li><strong class="text-zinc-200">Accessibility</strong> - role="combobox", role="listbox", role="option", aria-expanded, aria-selected</li>
          <li><strong class="text-zinc-200">Visual feedback</strong> - Selected item shows checkmark</li>
        </ul>
      </Section>

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Basic Dropdown" code={basicCode}>
            <DropdownBasicDemo />
          </Example>

          <Example title="With Default Value" code={defaultValueCode}>
            <DropdownWithDefaultDemo />
          </Example>

          <Example title="Disabled" code={disabledCode}>
            <DropdownDisabledDemo />
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DropdownTrigger</h3>
            <PropsTable props={dropdownTriggerProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DropdownContent</h3>
            <PropsTable props={dropdownContentProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DropdownItem</h3>
            <PropsTable props={dropdownItemProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">DropdownLabel</h3>
            <PropsTable props={dropdownLabelProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
