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
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add tooltip`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

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

const placementCode = `import { TooltipContent } from '@/components/ui/tooltip'

// Top placement (default)
<TooltipContent open={open()}>...</TooltipContent>

// Right placement
<TooltipContent placement="right" open={open()}>...</TooltipContent>

// Bottom placement
<TooltipContent placement="bottom" open={open()}>...</TooltipContent>

// Left placement
<TooltipContent placement="left" open={open()}>...</TooltipContent>`

const delayCode = `// With 700ms delay (default)
<TooltipTrigger
  onMouseEnter={() => setOpen(true)}
  onMouseLeave={() => setOpen(false)}
  delayDuration={700}
>
  ...
</TooltipTrigger>

// No delay (immediate)
<TooltipTrigger
  onMouseEnter={() => setOpen(true)}
  onMouseLeave={() => setOpen(false)}
  delayDuration={0}
>
  ...
</TooltipTrigger>`

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
  return (
    <DocPage slug="tooltip" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Tooltip"
          description="A popup that displays contextual information on hover or focus."
          {...getNavLinks('tooltip')}
        />

        {/* Preview */}
        <Example title="" code={`<TooltipContent open={open()}>...</TooltipContent>`}>
          <div class="flex gap-4">
            <TooltipBasicDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <CodeBlock code={installCode} lang="bash" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Hover trigger</strong> - Shows tooltip on mouse enter, hides on mouse leave</li>
            <li><strong class="text-foreground">Focus trigger</strong> - Shows tooltip on focus for keyboard accessibility</li>
            <li><strong class="text-foreground">Placement options</strong> - Top, right, bottom, or left positioning</li>
            <li><strong class="text-foreground">Arrow indicator</strong> - Visual arrow pointing to the trigger</li>
            <li><strong class="text-foreground">Accessibility</strong> - role="tooltip", aria-describedby for screen readers</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
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

            <Example title="Delay Options" code={delayCode}>
              <div class="flex flex-wrap gap-8 py-4">
                <TooltipDelayDemo />
                <TooltipNoDelayDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Keyboard Support</strong> - Tooltip shows on focus for keyboard users</li>
            <li><strong class="text-foreground">ARIA</strong> - role="tooltip" on content, aria-describedby on trigger links to tooltip</li>
            <li><strong class="text-foreground">Screen Readers</strong> - Tooltip content is announced when trigger receives focus</li>
            <li><strong class="text-foreground">Delay</strong> - Configurable delay prevents tooltips from appearing during quick mouse movements</li>
            <li><strong class="text-foreground">Visual Indicator</strong> - Arrow points to the trigger element for clear association</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">TooltipTrigger</h3>
              <PropsTable props={tooltipTriggerProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">TooltipContent</h3>
              <p class="text-muted-foreground text-sm mb-4">
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
