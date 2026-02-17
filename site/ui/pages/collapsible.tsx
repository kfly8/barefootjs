/**
 * Collapsible Documentation Page
 */

import { CollapsibleBasicDemo, CollapsibleControlledDemo, CollapsibleDisabledDemo } from '@/components/collapsible-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'controlled', title: 'Controlled', branch: 'child' },
  { id: 'disabled', title: 'Disabled', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from '@/components/ui/icon'

function CollapsibleBasic() {
  return (
    <Collapsible defaultOpen class="space-y-2">
      <div className="flex items-center justify-between space-x-4">
        <h4 className="text-sm font-semibold">
          @barefootjs/dom has 3 repositories
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronDownIcon size="sm" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm">
        @barefootjs/dom
      </div>
      <CollapsibleContent class="space-y-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          @barefootjs/jsx
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          @barefootjs/hono
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}`

const controlledCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from '@/components/ui/icon'

function CollapsibleControlled() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="space-y-4">
      <Collapsible open={open()} onOpenChange={setOpen} class="space-y-2">
        <div className="flex items-center justify-between space-x-4">
          <h4 className="text-sm font-semibold">
            Starred Repositories
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronDownIcon size="sm" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          solidjs/solid
        </div>
        <CollapsibleContent class="space-y-2">
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            honojs/hono
          </div>
          <div className="rounded-md border px-4 py-2 font-mono text-sm">
            unjs/nitro
          </div>
        </CollapsibleContent>
      </Collapsible>
      <p className="text-sm text-muted-foreground">
        State: {open() ? 'open' : 'closed'}
      </p>
    </div>
  )
}`

const disabledCode = `"use client"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from '@/components/ui/icon'

function CollapsibleDisabled() {
  return (
    <Collapsible disabled class="space-y-2">
      <div className="flex items-center justify-between space-x-4">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Archived Repositories (disabled)
        </h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0" disabled>
            <ChevronDownIcon size="sm" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-md border px-4 py-2 font-mono text-sm opacity-50">
        @barefootjs/legacy
      </div>
      <CollapsibleContent class="space-y-2">
        <div className="rounded-md border px-4 py-2 font-mono text-sm">
          @barefootjs/old-adapter
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}`

// Props definitions
const collapsibleProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    description: 'The controlled open state of the collapsible.',
  },
  {
    name: 'defaultOpen',
    type: 'boolean',
    defaultValue: 'false',
    description: 'The open state when initially rendered. Use when you do not need to control the open state.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Event handler called when the open state changes.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'When true, prevents the user from interacting with the collapsible.',
  },
]

const collapsibleTriggerProps: PropDefinition[] = [
  {
    name: 'asChild',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Render child element as trigger instead of built-in button.',
  },
]

const collapsibleContentProps: PropDefinition[] = []

export function CollapsiblePage() {
  return (
    <DocPage slug="collapsible" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Collapsible"
          description="An interactive component which expands/collapses a panel."
          {...getNavLinks('collapsible')}
        />

        {/* Preview */}
        <Example title="" code={`<Collapsible>...</Collapsible>`}>
          <CollapsibleBasicDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add collapsible" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <CollapsibleBasicDemo />
            </Example>

            <Example title="Controlled" code={controlledCode}>
              <CollapsibleControlledDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <CollapsibleDisabledDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Collapsible</h3>
              <PropsTable props={collapsibleProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">CollapsibleTrigger</h3>
              <PropsTable props={collapsibleTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">CollapsibleContent</h3>
              <PropsTable props={collapsibleContentProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
