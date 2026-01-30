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

// Code examples - Preview (Terms Demo)
const termsCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxTermsDemo() {
  const [accepted, setAccepted] = createSignal(false)

  const handleLabelClick = () => {
    setAccepted(!accepted())
  }

  return (
    <div className="space-y-4">
      <div className="items-top flex space-x-2">
        <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
        <div
          className="grid gap-1.5 leading-none cursor-pointer"
          onClick={handleLabelClick}
        >
          <span className="text-sm font-medium leading-none">
            I agree to the terms and conditions
          </span>
          <p className="text-sm text-muted-foreground">
            By checking this box, you agree to our Terms of Service.
          </p>
        </div>
      </div>
      <button
        className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-50"
        disabled={!accepted()}
      >
        Continue
      </button>
    </div>
  )
}`

const disabledCode = `"use client"

import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxDisabledDemo() {
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

export function CheckboxFormDemo() {
  const [mobile, setMobile] = createSignal(false)
  const [desktop, setDesktop] = createSignal(true)
  const [email, setEmail] = createSignal(false)

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium leading-none">Sidebar</h4>
      <p className="text-sm text-muted-foreground">
        Select the items you want to display in the sidebar.
      </p>
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox checked={mobile()} onCheckedChange={setMobile} />
          <span className="text-sm font-medium leading-none">Mobile</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={desktop()} onCheckedChange={setDesktop} />
          <span className="text-sm font-medium leading-none">Desktop</span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={email()} onCheckedChange={setEmail} />
          <span className="text-sm font-medium leading-none">Email notifications</span>
        </div>
      </div>
      <div className="text-sm text-muted-foreground pt-2 border-t">
        Selected: {[mobile() && 'Mobile', desktop() && 'Desktop', email() && 'Email']
          .filter(Boolean).join(', ') || 'None'}
      </div>
    </div>
  )
}`

const emailListCode = `"use client"

import { createSignal, createMemo } from "@barefootjs/dom"
import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxEmailListDemo() {
  const [email1, setEmail1] = createSignal(false)
  const [email2, setEmail2] = createSignal(false)
  const [email3, setEmail3] = createSignal(false)

  const selectedCount = createMemo(() =>
    [email1(), email2(), email3()].filter(Boolean).length
  )
  const isAllSelected = createMemo(() => selectedCount() === 3)
  const selectionLabel = createMemo(() =>
    selectedCount() > 0 ? \`\${selectedCount()} selected\` : 'Select all'
  )

  const toggleAll = (checked: boolean) => {
    setEmail1(checked)
    setEmail2(checked)
    setEmail3(checked)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-3">
          <Checkbox checked={isAllSelected()} onCheckedChange={toggleAll} />
          <span className="text-sm text-muted-foreground">{selectionLabel()}</span>
        </div>
        {selectedCount() > 0 && (
          <span className="text-sm text-primary cursor-pointer hover:underline">
            Mark as read
          </span>
        )}
      </div>
      <div className="divide-y border-x border-b rounded-b-md">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50">
          <Checkbox checked={email1()} onCheckedChange={setEmail1} />
          <span className="text-sm font-medium w-32 truncate">John Smith</span>
          <span className="text-sm truncate flex-1">Meeting tomorrow - Let's discuss the Q4 planning</span>
          <span className="text-xs text-muted-foreground">10:30 AM</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50">
          <Checkbox checked={email2()} onCheckedChange={setEmail2} />
          <span className="text-sm w-32 truncate">Dev Team</span>
          <span className="text-sm text-muted-foreground truncate flex-1">Project update - Sprint review notes</span>
          <span className="text-xs text-muted-foreground">9:15 AM</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50">
          <Checkbox checked={email3()} onCheckedChange={setEmail3} />
          <span className="text-sm font-medium w-32 truncate">Billing Dept</span>
          <span className="text-sm truncate flex-1">Invoice #1234 - Payment due in 30 days</span>
          <span className="text-xs text-muted-foreground">Yesterday</span>
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
        <Example title="" code={termsCode}>
          <CheckboxTermsDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add checkbox" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Form" code={formCode}>
              <CheckboxFormDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <CheckboxDisabledDemo />
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
