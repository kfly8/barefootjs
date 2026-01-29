/**
 * Checkbox Documentation Page
 */

import {
  CheckboxDisabledDemo,
  CheckboxFormDemo,
  CheckboxTermsDemo,
  CheckboxEmailListDemo,
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
  { id: 'disabled', title: 'Disabled', branch: 'start' },
  { id: 'form', title: 'Form', branch: 'child' },
  { id: 'email-list', title: 'Email List', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const disabledCode = `"use client"

import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxDisabled() {
  return (
    <div className="flex items-center space-x-2 opacity-50">
      <Checkbox disabled />
      <span className="text-sm font-medium leading-none">
        Accept terms and conditions
      </span>
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
      <h4 className="text-sm font-medium">Sidebar</h4>
      <p className="text-sm text-muted-foreground">
        Select the items you want to display in the sidebar.
      </p>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox checked={mobile()} onCheckedChange={setMobile} />
          <span className="text-sm">Mobile</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={desktop()} onCheckedChange={setDesktop} />
          <span className="text-sm">Desktop</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={email()} onCheckedChange={setEmail} />
          <span className="text-sm">Email notifications</span>
        </div>
      </div>
    </div>
  )
}`

const emailListCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxEmailList() {
  const [email1, setEmail1] = createSignal(false)
  const [email2, setEmail2] = createSignal(false)
  const [email3, setEmail3] = createSignal(false)

  const selectedCount = () => [email1(), email2(), email3()].filter(Boolean).length
  const isAllSelected = () => selectedCount() === 3

  const toggleAll = (checked: boolean) => {
    setEmail1(checked)
    setEmail2(checked)
    setEmail3(checked)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox checked={isAllSelected()} onCheckedChange={toggleAll} />
        <span className="text-sm text-muted-foreground">
          {selectedCount() > 0 ? \`\${selectedCount()} selected\` : 'Select all'}
        </span>
      </div>
      <div className="border rounded-md divide-y">
        <div className="flex items-center space-x-3 p-3">
          <Checkbox checked={email1()} onCheckedChange={setEmail1} />
          <div className="flex-1">
            <p className="text-sm">Meeting tomorrow</p>
            <p className="text-xs text-muted-foreground">boss@example.com</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3">
          <Checkbox checked={email2()} onCheckedChange={setEmail2} />
          <div className="flex-1">
            <p className="text-sm">Project update</p>
            <p className="text-xs text-muted-foreground">team@example.com</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3">
          <Checkbox checked={email3()} onCheckedChange={setEmail3} />
          <div className="flex-1">
            <p className="text-sm">Invoice #1234</p>
            <p className="text-xs text-muted-foreground">billing@example.com</p>
          </div>
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
            <Example title="Disabled" code={disabledCode}>
              <CheckboxDisabledDemo />
            </Example>

            <Example title="Form" code={formCode}>
              <CheckboxFormDemo />
            </Example>

            <Example title="Email List" code={emailListCode}>
              <CheckboxEmailListDemo />
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
