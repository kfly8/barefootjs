/**
 * Accordion Documentation Page
 */

import { AccordionSingleOpenDemo, AccordionMultipleOpenDemo } from '@/components/accordion-demo'
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
  { id: 'single-open', title: 'Single Open', branch: 'start' },
  { id: 'multiple-open', title: 'Multiple Open', branch: 'end' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const singleCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

function AccordionSingle() {
  const [openItem, setOpenItem] = createSignal<string | null>('item-1')

  const toggle = (value: string) => {
    setOpenItem(openItem() === value ? null : value)
  }

  return (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger
          open={openItem() === 'item-1'}
          onClick={() => toggle('item-1')}
        >
          Is it accessible?
        </AccordionTrigger>
        <AccordionContent open={openItem() === 'item-1'}>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger
          open={openItem() === 'item-2'}
          onClick={() => toggle('item-2')}
        >
          Is it styled?
        </AccordionTrigger>
        <AccordionContent open={openItem() === 'item-2'}>
          Yes. It comes with default styles that match your theme.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          open={openItem() === 'item-3'}
          onClick={() => toggle('item-3')}
        >
          Is it animated?
        </AccordionTrigger>
        <AccordionContent open={openItem() === 'item-3'}>
          Yes. It's animated by default with CSS transitions.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`

const multipleCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

function AccordionMultiple() {
  // Each item manages its own state independently
  const [item1Open, setItem1Open] = createSignal(false)
  const [item2Open, setItem2Open] = createSignal(false)
  const [item3Open, setItem3Open] = createSignal(false)

  return (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger
          open={item1Open()}
          onClick={() => setItem1Open(!item1Open())}
        >
          First Item
        </AccordionTrigger>
        <AccordionContent open={item1Open()}>
          Content for first item.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger
          open={item2Open()}
          onClick={() => setItem2Open(!item2Open())}
        >
          Second Item
        </AccordionTrigger>
        <AccordionContent open={item2Open()}>
          Content for second item.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          open={item3Open()}
          onClick={() => setItem3Open(!item3Open())}
        >
          Third Item
        </AccordionTrigger>
        <AccordionContent open={item3Open()}>
          Content for third item.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`

// Props definition
const accordionItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'A unique identifier for the accordion item.',
  },
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the accordion item is open.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the accordion item is disabled.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Event handler called when the open state changes.',
  },
]

const accordionTriggerProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the trigger indicates an open state.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the trigger is disabled.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the trigger is clicked.',
  },
]

const accordionContentProps: PropDefinition[] = [
  {
    name: 'open',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the content is visible.',
  },
]

export function AccordionPage() {
  const installCommands = getHighlightedCommands('barefoot add accordion')

  return (
    <DocPage slug="accordion" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Accordion"
          description="A vertically stacked set of interactive headings that each reveal an associated section of content."
          {...getNavLinks('accordion')}
        />

        {/* Preview */}
        <Example title="" code={`<Accordion>...</Accordion>`}>
          <div className="w-full max-w-md">
            <AccordionSingleOpenDemo />
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add accordion" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Single Open" code={singleCode}>
              <div className="w-full max-w-md">
                <AccordionSingleOpenDemo />
              </div>
            </Example>

            <Example title="Multiple Open" code={multipleCode}>
              <div className="w-full max-w-md">
                <AccordionMultipleOpenDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Keyboard Navigation</strong> - Arrow Up/Down to navigate between triggers, Home/End to jump</li>
            <li><strong className="text-foreground">Activation</strong> - Enter/Space to toggle accordion item</li>
            <li><strong className="text-foreground">ARIA</strong> - Triggers use aria-expanded, aria-controls; Content uses aria-labelledby</li>
            <li><strong className="text-foreground">Disabled State</strong> - aria-disabled on disabled triggers, skipped in keyboard navigation</li>
            <li><strong className="text-foreground">Screen Readers</strong> - State changes are announced when items are expanded/collapsed</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">AccordionItem</h3>
              <PropsTable props={accordionItemProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">AccordionTrigger</h3>
              <PropsTable props={accordionTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">AccordionContent</h3>
              <PropsTable props={accordionContentProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
