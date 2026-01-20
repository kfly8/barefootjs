/**
 * Input Documentation Page
 */

import { Input } from '@/components/ui/input'
import { InputBindingDemo, InputFocusDemo } from '@/components/input-demo'
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
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add input`

const usageCode = `import { Input } from '@/components/ui/input'

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

export function InputPage() {
  return (
    <DocPage slug="input" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Input"
          description="Displays an input field for user text entry."
          {...getNavLinks('input')}
        />

        {/* Preview */}
        <Example title="" code={`<Input inputPlaceholder="Enter text..." />`}>
          <Input inputPlaceholder="Enter text..." />
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
          <div className="space-y-8">
            <Example title="Input Types" code={typesCode}>
              <div className="flex flex-col gap-2 max-w-sm">
                <Input inputType="text" inputPlaceholder="Text input" />
                <Input inputType="email" inputPlaceholder="Email address" />
                <Input inputType="password" inputPlaceholder="Password" />
                <Input inputType="number" inputPlaceholder="Number" />
              </div>
            </Example>

            <Example title="Disabled & Read-only" code={disabledCode}>
              <div className="flex flex-col gap-2 max-w-sm">
                <Input inputDisabled inputPlaceholder="Disabled input" />
                <Input inputReadOnly inputValue="Read-only value" />
              </div>
            </Example>

            <Example title="Value Binding" code={bindingCode}>
              <div className="max-w-sm">
                <InputBindingDemo />
              </div>
            </Example>

            <Example title="Focus State" code={`<Input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />`}>
              <div className="max-w-sm">
                <InputFocusDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={inputProps} />
        </Section>
      </div>
    </DocPage>
  )
}
