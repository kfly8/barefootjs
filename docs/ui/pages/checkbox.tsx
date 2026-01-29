/**
 * Checkbox Documentation Page
 */

import {
  CheckboxWithTextDemo,
  CheckboxDisabledDemo,
  CheckboxFormDemo,
  CheckboxTermsDemo,
} from '@/components/checkbox-demo'
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
  { id: 'with-text', title: 'With Text', branch: 'start' },
  { id: 'disabled', title: 'Disabled', branch: 'child' },
  { id: 'form', title: 'Form', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const withTextCode = `"use client"

import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxWithText() {
  return (
    <div className="items-top flex space-x-2">
      <Checkbox id="terms1" />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="terms1"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Accept terms and conditions
        </label>
        <p className="text-sm text-muted-foreground">
          You agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}`

const disabledCode = `"use client"

import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxDisabled() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms2" disabled />
      <label
        htmlFor="terms2"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </label>
    </div>
  )
}`

const formCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxForm() {
  const [mobile, setMobile] = createSignal(false)
  const [desktop, setDesktop] = createSignal(true)
  const [email, setEmail] = createSignal(false)

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h4 className="text-sm font-medium leading-none">Sidebar</h4>
        <p className="text-sm text-muted-foreground">
          Select the items you want to display in the sidebar.
        </p>
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox checked={mobile()} onCheckedChange={setMobile} />
            <span className="text-sm font-medium leading-none">Mobile</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox checked={desktop()} onCheckedChange={setDesktop} />
            <span className="text-sm font-medium leading-none">Desktop</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox checked={email()} onCheckedChange={setEmail} />
            <span className="text-sm font-medium leading-none">
              Email notifications
            </span>
          </label>
        </div>
      </div>
    </div>
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
          description="A control that allows the user to toggle between checked and not checked."
          {...getNavLinks('checkbox')}
        />

        {/* Preview */}
        <Example title="" code={`<Checkbox />`}>
          <CheckboxTermsDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add checkbox" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="With Text" code={withTextCode}>
              <CheckboxWithTextDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <CheckboxDisabledDemo />
            </Example>

            <Example title="Form" code={formCode}>
              <CheckboxFormDemo />
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
