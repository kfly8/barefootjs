/**
 * Accordion Documentation Page
 */

import { AccordionSingleOpenDemo, AccordionMultipleOpenDemo } from '@/components/AccordionDemo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../_shared/docs'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add accordion`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/accordion'

export default function Page() {
  const [openItem, setOpenItem] = createSignal<string | null>(null)

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
    </Accordion>
  )
}`

const singleCode = `const [openItem, setOpenItem] = createSignal<string | null>('item-1')

const toggle = (value: string) => {
  setOpenItem(openItem() === value ? null : value)
}

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
  {/* More items... */}
</Accordion>`

const multipleCode = `// Each item manages its own state independently
const [item1Open, setItem1Open] = createSignal(false)
const [item2Open, setItem2Open] = createSignal(false)
const [item3Open, setItem3Open] = createSignal(false)

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
  {/* More items... */}
</Accordion>`

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
  return (
    <DocPage slug="accordion" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Accordion"
          description="A vertically stacked set of interactive headings that each reveal an associated section of content."
        />

        {/* Preview */}
        <Example title="" code={`<Accordion>...</Accordion>`}>
          <div class="w-full max-w-md">
            <AccordionSingleOpenDemo />
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

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Single Open (Only One at a Time)" code={singleCode}>
              <div class="w-full max-w-md">
                <AccordionSingleOpenDemo />
              </div>
            </Example>

            <Example title="Multiple Open" code={multipleCode}>
              <div class="w-full max-w-md">
                <AccordionMultipleOpenDemo />
              </div>
            </Example>
          </div>
        </Section>

        {/* Accessibility */}
        <Section id="accessibility" title="Accessibility">
          <ul class="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong class="text-foreground">Keyboard Navigation</strong> - Arrow Up/Down to navigate between triggers, Home/End to jump</li>
            <li><strong class="text-foreground">Activation</strong> - Enter/Space to toggle accordion item</li>
            <li><strong class="text-foreground">ARIA</strong> - Triggers use aria-expanded, aria-controls; Content uses aria-labelledby</li>
            <li><strong class="text-foreground">Disabled State</strong> - aria-disabled on disabled triggers, skipped in keyboard navigation</li>
            <li><strong class="text-foreground">Screen Readers</strong> - State changes are announced when items are expanded/collapsed</li>
          </ul>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">AccordionItem</h3>
              <PropsTable props={accordionItemProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">AccordionTrigger</h3>
              <PropsTable props={accordionTriggerProps} />
            </div>
            <div>
              <h3 class="text-lg font-medium text-foreground mb-4">AccordionContent</h3>
              <PropsTable props={accordionContentProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
