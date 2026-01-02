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
} from '@/components/TooltipDemo'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add tooltip`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import { TooltipTrigger, TooltipContent } from '@/components/tooltip'

export default function Page() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="relative inline-block">
      <TooltipTrigger
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        ariaDescribedby="my-tooltip"
      >
        <span>Hover me</span>
      </TooltipTrigger>
      <TooltipContent open={open()} id="my-tooltip">
        Tooltip content
      </TooltipContent>
    </div>
  )
}`

const basicCode = `const [open, setOpen] = createSignal(false)

<div class="relative inline-block">
  <TooltipTrigger
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
    ariaDescribedby="tooltip-basic"
  >
    <span class="underline decoration-dotted cursor-help">
      Hover me
    </span>
  </TooltipTrigger>
  <TooltipContent open={open()} id="tooltip-basic">
    This is a tooltip
  </TooltipContent>
</div>`

const buttonCode = `const [open, setOpen] = createSignal(false)

<div class="relative inline-block">
  <TooltipTrigger
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
    onFocus={() => setOpen(true)}
    onBlur={() => setOpen(false)}
    ariaDescribedby="tooltip-button"
  >
    <button type="button" class="...">
      Hover or Focus
    </button>
  </TooltipTrigger>
  <TooltipContent open={open()} id="tooltip-button">
    Keyboard accessible tooltip
  </TooltipContent>
</div>`

const placementCode = `import {
  TooltipContent,        // Top (default)
  TooltipContentRight,   // Right
  TooltipContentBottom,  // Bottom
  TooltipContentLeft,    // Left
} from '@/components/tooltip'

// Top placement (default)
<TooltipContent open={open()}>...</TooltipContent>

// Right placement
<TooltipContentRight open={open()}>...</TooltipContentRight>

// Bottom placement
<TooltipContentBottom open={open()}>...</TooltipContentBottom>

// Left placement
<TooltipContentLeft open={open()}>...</TooltipContentLeft>`

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
]

const tooltipContentProps: PropDefinition[] = [
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
  return (
    <div class="space-y-12">
      <PageHeader
        title="Tooltip"
        description="A popup that displays contextual information on hover or focus."
      />

      {/* Preview */}
      <Example title="" code={`<TooltipContent open={open()}>...</TooltipContent>`}>
        <div class="flex gap-4">
          <TooltipBasicDemo />
        </div>
      </Example>

      {/* Installation */}
      <Section title="Installation">
        <CodeBlock code={installCode} lang="bash" />
      </Section>

      {/* Usage */}
      <Section title="Usage">
        <CodeBlock code={usageCode} />
      </Section>

      {/* Features */}
      <Section title="Features">
        <ul class="list-disc list-inside space-y-2 text-zinc-400">
          <li><strong class="text-zinc-200">Hover trigger</strong> - Shows tooltip on mouse enter, hides on mouse leave</li>
          <li><strong class="text-zinc-200">Focus trigger</strong> - Shows tooltip on focus for keyboard accessibility</li>
          <li><strong class="text-zinc-200">Placement options</strong> - Top, right, bottom, or left positioning</li>
          <li><strong class="text-zinc-200">Arrow indicator</strong> - Visual arrow pointing to the trigger</li>
          <li><strong class="text-zinc-200">Accessibility</strong> - role="tooltip", aria-describedby for screen readers</li>
        </ul>
      </Section>

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Basic Tooltip" code={basicCode}>
            <TooltipBasicDemo />
          </Example>

          <Example title="Button with Focus Support" code={buttonCode}>
            <TooltipButtonDemo />
          </Example>

          <Example title="Placement Options" code={placementCode}>
            <div class="flex flex-wrap gap-4 py-4">
              <TooltipTopDemo />
              <TooltipRightDemo />
              <TooltipBottomDemo />
              <TooltipLeftDemo />
            </div>
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">TooltipTrigger</h3>
            <PropsTable props={tooltipTriggerProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">TooltipContent / TooltipContentRight / TooltipContentBottom / TooltipContentLeft</h3>
            <p class="text-zinc-400 text-sm mb-4">
              Use TooltipContent for top placement (default), or use the directional variants for other placements.
            </p>
            <PropsTable props={tooltipContentProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
