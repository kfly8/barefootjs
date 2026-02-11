/**
 * Tooltip Documentation Page
 */

import {
  TooltipBasicDemo,
  TooltipButtonDemo,
  TooltipTopDemo,
  TooltipRightDemo,
  TooltipBottomDemo,
  TooltipLeftDemo,
  TooltipDelayDemo,
  TooltipNoDelayDemo,
} from '@/components/tooltip-demo'
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
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'button-focus', title: 'Button Focus', branch: 'child' },
  { id: 'placement', title: 'Placement', branch: 'child' },
  { id: 'delay', title: 'Delay', branch: 'end' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

function TooltipBasic() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="tooltip-basic"
      >
        <span className="underline decoration-dotted cursor-help">
          Hover me
        </span>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-basic">
        This is a tooltip
      </TooltipContent>
    </div>
  )
}`

const buttonCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

function TooltipButton() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        ariaDescribedby="tooltip-button"
      >
        <Button variant="outline">
          Hover or Focus
        </Button>
      </TooltipTrigger>
      <TooltipContent open={open()} id="tooltip-button">
        Keyboard accessible tooltip
      </TooltipContent>
    </div>
  )
}`

const placementCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

function TooltipPlacement() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span>Hover me</span>
      </TooltipTrigger>
      {/* Top placement (default) */}
      <TooltipContent open={open()}>Top</TooltipContent>
      {/* Right placement */}
      <TooltipContent placement="right" open={open()}>Right</TooltipContent>
      {/* Bottom placement */}
      <TooltipContent placement="bottom" open={open()}>Bottom</TooltipContent>
      {/* Left placement */}
      <TooltipContent placement="left" open={open()}>Left</TooltipContent>
    </div>
  )
}`

const delayCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

function TooltipDelay() {
  const [open, setOpen] = createSignal(false)

  return (
    <div className="relative inline-block">
      {/* With 700ms delay (default) */}
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        delayDuration={700}
      >
        <span>Default delay (700ms)</span>
      </TooltipTrigger>
      <TooltipContent open={open()}>Delayed tooltip</TooltipContent>

      {/* No delay (immediate) */}
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        delayDuration={0}
      >
        <span>No delay</span>
      </TooltipTrigger>
      <TooltipContent open={open()}>Immediate tooltip</TooltipContent>
    </div>
  )
}`

// Props definitions
const tooltipTriggerProps: PropDefinition[] = [
  {
    name: 'onMouseEnter',
    type: '() => void',
    description: 'Event handler called when mouse enters the trigger.',
  },
  {
    name: 'onMouseLeave',
    type: '() => void',
    description: 'Event handler called when mouse leaves the trigger.',
  },
  {
    name: 'onFocus',
    type: '() => void',
    description: 'Event handler called when the trigger receives focus.',
  },
  {
    name: 'onBlur',
    type: '() => void',
    description: 'Event handler called when the trigger loses focus.',
  },
  {
    name: 'ariaDescribedby',
    type: 'string',
    description: 'ID of the tooltip element for accessibility.',
  },
  {
    name: 'delayDuration',
    type: 'number',
    defaultValue: '700',
    description: 'Delay in ms before showing tooltip on hover.',
  },
  {
    name: 'closeDelay',
    type: 'number',
    defaultValue: '0',
    description: 'Delay in ms before hiding tooltip after mouse leave.',
  },
]

const tooltipContentProps: PropDefinition[] = [
  {
    name: 'placement',
    type: "'top' | 'right' | 'bottom' | 'left'",
    defaultValue: "'top'",
    description: 'Position of the tooltip relative to the trigger.',
  },
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the tooltip is visible.',
  },
  {
    name: 'id',
    type: 'string',
    description: 'ID for aria-describedby reference.',
  },
]

export function TooltipPage() {
  const installCommands = getHighlightedCommands('barefoot add tooltip')

  return (
    <DocPage slug="tooltip" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Tooltip"
          description="A popup that displays contextual information on hover or focus."
          {...getNavLinks('tooltip')}
        />

        {/* Preview */}
        <Example title="" code={`<TooltipContent open={open()}>...</TooltipContent>`}>
          <div className="flex gap-4">
            <TooltipBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add tooltip" highlightedCommands={installCommands} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Hover trigger</strong> - Shows tooltip on mouse enter, hides on mouse leave</li>
            <li><strong className="text-foreground">Focus trigger</strong> - Shows tooltip on focus for keyboard accessibility</li>
            <li><strong className="text-foreground">Placement options</strong> - Top, right, bottom, or left positioning</li>
            <li><strong className="text-foreground">Arrow indicator</strong> - Visual arrow pointing to the trigger</li>
            <li><strong className="text-foreground">Accessibility</strong> - role="tooltip", aria-describedby for screen readers</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <TooltipBasicDemo />
            </Example>

            <Example title="Button Focus" code={buttonCode}>
              <TooltipButtonDemo />
            </Example>

            <Example title="Placement" code={placementCode}>
              <div className="flex flex-wrap gap-4 py-4">
                <TooltipTopDemo />
                <TooltipRightDemo />
                <TooltipBottomDemo />
                <TooltipLeftDemo />
              </div>
            </Example>

            <Example title="Delay" code={delayCode}>
              <div className="flex flex-wrap gap-8 py-4">
                <TooltipDelayDemo />
                <TooltipNoDelayDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Keyboard Support</strong> - Tooltip shows on focus for keyboard users</li>
            <li><strong className="text-foreground">ARIA</strong> - role="tooltip" on content, aria-describedby on trigger links to tooltip</li>
            <li><strong className="text-foreground">Screen Readers</strong> - Tooltip content is announced when trigger receives focus</li>
            <li><strong className="text-foreground">Delay</strong> - Configurable delay prevents tooltips from appearing during quick mouse movements</li>
            <li><strong className="text-foreground">Visual Indicator</strong> - Arrow points to the trigger element for clear association</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">TooltipTrigger</h3>
              <PropsTable props={tooltipTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">TooltipContent</h3>
              <p className="text-muted-foreground text-sm mb-4">
                The tooltip popup. Use the placement prop to control positioning.
              </p>
              <PropsTable props={tooltipContentProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
