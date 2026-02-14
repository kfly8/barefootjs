/**
 * Textarea Documentation Page
 */

import { Textarea } from '@/components/ui/textarea'
import { TextareaBindingDemo } from '@/components/textarea-demo'
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
  { id: 'value-binding', title: 'Value Binding', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { Textarea } from '@/components/ui/textarea'

function TextareaBasic() {
  return (
    <div className="max-w-sm">
      <Textarea placeholder="Type your message here." />
    </div>
  )
}`

const disabledCode = `"use client"

import { Textarea } from '@/components/ui/textarea'

function TextareaDisabled() {
  return (
    <div className="flex flex-col gap-2 max-w-sm">
      <Textarea disabled placeholder="Disabled textarea" />
      <Textarea readOnly value="Read-only content" />
    </div>
  )
}`

const bindingCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Textarea } from '@/components/ui/textarea'

function TextareaBinding() {
  const [value, setValue] = createSignal('')

  return (
    <div className="max-w-sm space-y-2">
      <Textarea
        value={value()}
        onInput={(e) => setValue(e.target.value)}
        placeholder="Type your message here."
      />
      <p className="text-sm text-muted-foreground">
        {value().length} characters
      </p>
    </div>
  )
}`

// Props definition
const textareaProps: PropDefinition[] = [
  {
    name: 'placeholder',
    type: 'string',
    description: 'Placeholder text shown when textarea is empty.',
  },
  {
    name: 'value',
    type: 'string',
    description: 'The controlled value of the textarea.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the textarea is disabled.',
  },
  {
    name: 'readOnly',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the textarea is read-only.',
  },
  {
    name: 'error',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the textarea is in an error state.',
  },
  {
    name: 'rows',
    type: 'number',
    description: 'Number of visible text rows.',
  },
  {
    name: 'onInput',
    type: '(e: Event) => void',
    description: 'Event handler called on each input change.',
  },
  {
    name: 'onChange',
    type: '(e: Event) => void',
    description: 'Event handler called when textarea value changes and loses focus.',
  },
  {
    name: 'onBlur',
    type: '(e: Event) => void',
    description: 'Event handler called when textarea loses focus.',
  },
  {
    name: 'onFocus',
    type: '(e: Event) => void',
    description: 'Event handler called when textarea gains focus.',
  },
]

export function TextareaPage() {
  const installCommands = getHighlightedCommands('barefoot add textarea')

  return (
    <DocPage slug="textarea" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Textarea"
          description="Displays a multi-line text input field."
          {...getNavLinks('textarea')}
        />

        {/* Preview */}
        <Example title="" code={`<Textarea placeholder="Type your message here." />`}>
          <div className="max-w-sm">
            <Textarea placeholder="Type your message here." />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add textarea" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <div className="max-w-sm">
                <Textarea placeholder="Type your message here." />
              </div>
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div className="flex flex-col gap-2 max-w-sm">
                <Textarea disabled placeholder="Disabled textarea" />
                <Textarea readOnly value="Read-only content" />
              </div>
            </Example>

            <Example title="Value Binding" code={bindingCode}>
              <div className="max-w-sm">
                <TextareaBindingDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={textareaProps} />
        </Section>
      </div>
    </DocPage>
  )
}
