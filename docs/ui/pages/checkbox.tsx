/**
 * Checkbox Documentation Page
 */

import { Checkbox } from '@/components/ui/checkbox'
import { CheckboxUncontrolledDemo, CheckboxBindingDemo, CheckboxWithLabelDemo } from '@/components/checkbox-demo'
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
  { id: 'uncontrolled', title: 'Uncontrolled', branch: 'start' },
  { id: 'checked-state', title: 'Checked State', branch: 'child' },
  { id: 'disabled', title: 'Disabled', branch: 'child' },
  { id: 'state-binding', title: 'State Binding', branch: 'child' },
  { id: 'with-label', title: 'With Label', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const uncontrolledCode = `"use client"

import { Checkbox } from '@/components/ui/checkbox'

// No external state needed - checkbox manages its own state
function CheckboxUncontrolled() {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox />
        <span className="text-sm">Click me (uncontrolled)</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox defaultChecked />
        <span className="text-sm">Initially checked (defaultChecked)</span>
      </label>
    </div>
  )
}`

const checkedCode = `"use client"

import { Checkbox } from '@/components/ui/checkbox'

function CheckboxChecked() {
  return (
    <div className="flex gap-4">
      <Checkbox />
      <Checkbox checked />
    </div>
  )
}`

const disabledCode = `"use client"

import { Checkbox } from '@/components/ui/checkbox'

function CheckboxDisabled() {
  return (
    <div className="flex gap-4">
      <Checkbox disabled />
      <Checkbox checked disabled />
    </div>
  )
}`

const bindingCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Checkbox } from '@/components/ui/checkbox'

function CheckboxBinding() {
  const [checked, setChecked] = createSignal(false)

  return (
    <div className="flex items-center gap-4">
      <Checkbox
        checked={checked()}
        onCheckedChange={setChecked}
      />
      <span className="text-sm text-muted-foreground">
        {checked() ? 'Checked' : 'Unchecked'}
      </span>
    </div>
  )
}`

const withLabelCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Checkbox } from '@/components/ui/checkbox'

function CheckboxWithLabel() {
  const [accepted, setAccepted] = createSignal(false)

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
      <span className="text-sm">Accept terms and conditions</span>
    </label>
  )
}`

// Props definition
const checkboxProps: PropDefinition[] = [
  {
    name: 'defaultChecked',
    type: 'boolean',
    defaultValue: 'false',
    description: 'The initial checked state for uncontrolled mode.',
  },
  {
    name: 'checked',
    type: 'boolean',
    description: 'The controlled checked state of the checkbox. When provided, the component is in controlled mode.',
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

export function CheckboxPage() {
  const installCommands = getHighlightedCommands('barefoot add checkbox')

  return (
    <DocPage slug="checkbox" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Checkbox"
          description="A control that allows the user to toggle between checked and unchecked states."
          {...getNavLinks('checkbox')}
        />

        {/* Preview */}
        <Example title="" code={`<Checkbox />`}>
          <Checkbox />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add checkbox" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Uncontrolled" code={uncontrolledCode}>
              <CheckboxUncontrolledDemo />
            </Example>

            <Example title="Checked State" code={checkedCode}>
              <div className="flex gap-4">
                <Checkbox />
                <Checkbox checked={true} />
              </div>
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div className="flex gap-4">
                <Checkbox disabled={true} />
                <Checkbox checked={true} disabled={true} />
              </div>
            </Example>

            <Example title="State Binding" code={bindingCode}>
              <CheckboxBindingDemo />
            </Example>

            <Example title="With Label" code={withLabelCode}>
              <CheckboxWithLabelDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={checkboxProps} />
        </Section>
      </div>
    </DocPage>
  )
}
