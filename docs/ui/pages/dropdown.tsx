/**
 * Dropdown Documentation Page
 */

import { DropdownBasicDemo, DropdownWithDefaultDemo, DropdownDisabledDemo, DropdownWithTransformDemo } from '@/components/dropdown-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add dropdown`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
} from '@/components/ui/dropdown'

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

const transformCode = `// Dropdown works correctly inside CSS transformed containers
<div class="transform scale-100 translate-x-0">
  <Dropdown>
    <DropdownTrigger open={open()} onClick={() => setOpen(!open())}>
      {selectedLabel() || <DropdownLabel>Select option</DropdownLabel>}
    </DropdownTrigger>
    <DropdownContent open={open()} onClose={() => setOpen(false)}>
      <DropdownItem value="option1">Option 1</DropdownItem>
      <DropdownItem value="option2">Option 2</DropdownItem>
    </DropdownContent>
  </Dropdown>
</div>`

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
    <DocPage slug="dropdown" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Dropdown"
          description="A select-like dropdown menu for choosing from a list of options."
          {...getNavLinks('dropdown')}
        />

        {/* Preview */}
        <Example title="" code={`<Dropdown><DropdownTrigger>...</DropdownTrigger><DropdownContent>...</DropdownContent></Dropdown>`}>
          <div class="flex gap-4">
            <DropdownBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Props-based state</strong> - Parent controls open/selected state with signals</li>
            <li><strong class="text-foreground">ESC key to close</strong> - Press Escape to close the dropdown</li>
            <li><strong class="text-foreground">Click to select</strong> - Click an item to select it</li>
            <li><strong class="text-foreground">Accessibility</strong> - role="combobox", role="listbox", role="option", aria-expanded, aria-selected</li>
            <li><strong class="text-foreground">Visual feedback</strong> - Selected item shows checkmark</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
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

            <Example title="With CSS Transform" code={transformCode}>
              <div class="space-y-4">
                <p class="text-sm text-muted-foreground">Dropdown inside a scaled container:</p>
                <div class="transform scale-100 bg-muted p-4 rounded-lg" data-transform-container>
                  <DropdownWithTransformDemo />
                </div>
                <p class="text-sm text-muted-foreground">Dropdown inside a rotated container:</p>
                <div class="transform rotate-0 bg-muted p-4 rounded-lg" data-transform-container-rotate>
                  <DropdownWithTransformDemo />
                </div>
                <p class="text-sm text-muted-foreground">Dropdown inside a translated container:</p>
                <div class="transform translate-x-4 bg-muted p-4 rounded-lg" data-transform-container-translate>
                  <DropdownWithTransformDemo />
                </div>
              </div>
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Keyboard Navigation</strong> - Arrow Up/Down to navigate, Home/End to jump, Enter/Space to select</li>
            <li><strong class="text-foreground">Focus Return</strong> - Focus returns to trigger after selection</li>
            <li><strong class="text-foreground">ESC to Close</strong> - Press Escape to close the dropdown</li>
            <li><strong class="text-foreground">ARIA</strong> - role="combobox" on trigger, role="listbox" on content, role="option" on items</li>
            <li><strong class="text-foreground">State Attributes</strong> - aria-expanded, aria-haspopup, aria-selected, aria-disabled</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">DropdownTrigger</h3>
              <PropsTable props={dropdownTriggerProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">DropdownContent</h3>
              <PropsTable props={dropdownContentProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">DropdownItem</h3>
              <PropsTable props={dropdownItemProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">DropdownLabel</h3>
              <PropsTable props={dropdownLabelProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
