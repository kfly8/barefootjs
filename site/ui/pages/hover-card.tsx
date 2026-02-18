/**
 * Hover Card Documentation Page
 */

import { HoverCardPreviewDemo, HoverCardBasicDemo } from '@/components/hover-card-demo'
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
  { id: 'basic', title: 'Basic', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'

function BasicHoverCard() {
  const [open, setOpen] = createSignal(false)

  return (
    <HoverCard open={open()} onOpenChange={setOpen}>
      <HoverCardTrigger>
        <span className="inline-flex items-center rounded-md border px-4 py-2 text-sm">
          Hover me
        </span>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">HoverCard</h4>
          <p className="text-sm text-muted-foreground">
            Rich content displayed on hover.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}`

const profileCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'

function ProfileHoverCard() {
  const [open, setOpen] = createSignal(false)

  return (
    <HoverCard open={open()} onOpenChange={setOpen}>
      <HoverCardTrigger>
        <a href="#" className="text-sm font-medium underline underline-offset-4">
          @barefootjs
        </a>
      </HoverCardTrigger>
      <HoverCardContent align="start" class="w-80">
        <div className="flex justify-between space-x-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-lg font-bold shrink-0">
            B
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@barefootjs</h4>
            <p className="text-sm text-muted-foreground">
              JSX to Marked Template + client JS compiler.
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}`

// Props definitions
const hoverCardProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the hover card is open.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Callback when open state should change.',
  },
  {
    name: 'openDelay',
    type: 'number',
    defaultValue: '700',
    description: 'Delay in ms before opening on hover.',
  },
  {
    name: 'closeDelay',
    type: 'number',
    defaultValue: '300',
    description: 'Delay in ms before closing after mouse leave.',
  },
]

const hoverCardTriggerProps: PropDefinition[] = [
  {
    name: 'asChild',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Render child element as trigger instead of built-in span.',
  },
]

const hoverCardContentProps: PropDefinition[] = [
  {
    name: 'align',
    type: "'start' | 'center' | 'end'",
    defaultValue: "'center'",
    description: 'Alignment relative to the trigger element.',
  },
  {
    name: 'side',
    type: "'top' | 'bottom'",
    defaultValue: "'bottom'",
    description: 'Which side of the trigger to position the hover card.',
  },
]

export function HoverCardPage() {
  return (
    <DocPage slug="hover-card" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Hover Card"
          description="A floating card that appears on hover to display rich content."
          {...getNavLinks('hover-card')}
        />

        {/* Preview */}
        <Example title="" code={profileCode}>
          <div className="flex gap-4">
            <HoverCardPreviewDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add hover-card" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <HoverCardBasicDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">HoverCard</h3>
              <PropsTable props={hoverCardProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">HoverCardTrigger</h3>
              <PropsTable props={hoverCardTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">HoverCardContent</h3>
              <PropsTable props={hoverCardContentProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
