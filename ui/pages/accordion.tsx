/**
 * Accordion Documentation Page
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/Accordion'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

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

// Interactive example - Single open
// Note: Uses createMemo to compute open states because the compiler
// doesn't yet support inline comparison expressions in JSX props.
// This is a finding for signal patterns: derived state should use createMemo.
function SingleOpenAccordion() {
  const [openItem, setOpenItem] = createSignal<string | null>('item-1')

  // Computed open states for each item
  const isItem1Open = createMemo(() => openItem() === 'item-1')
  const isItem2Open = createMemo(() => openItem() === 'item-2')
  const isItem3Open = createMemo(() => openItem() === 'item-3')

  const toggle = (value: string) => {
    setOpenItem(openItem() === value ? null : value)
  }

  return (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger
          open={isItem1Open()}
          disabled={false}
          onClick={() => toggle('item-1')}
        >
          Is it accessible?
        </AccordionTrigger>
        <AccordionContent open={isItem1Open()}>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger
          open={isItem2Open()}
          disabled={false}
          onClick={() => toggle('item-2')}
        >
          Is it styled?
        </AccordionTrigger>
        <AccordionContent open={isItem2Open()}>
          Yes. It comes with default styles that match the other components' aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          open={isItem3Open()}
          disabled={false}
          onClick={() => toggle('item-3')}
        >
          Is it animated?
        </AccordionTrigger>
        <AccordionContent open={isItem3Open()}>
          Yes. It uses CSS transitions for smooth open/close animations.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// Interactive example - Multiple open
function MultipleOpenAccordion() {
  const [item1Open, setItem1Open] = createSignal(true)
  const [item2Open, setItem2Open] = createSignal(false)
  const [item3Open, setItem3Open] = createSignal(false)

  return (
    <Accordion>
      <AccordionItem value="item-1">
        <AccordionTrigger
          open={item1Open()}
          disabled={false}
          onClick={() => setItem1Open(!item1Open())}
        >
          First Item
        </AccordionTrigger>
        <AccordionContent open={item1Open()}>
          This accordion allows multiple items to be open at once.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger
          open={item2Open()}
          disabled={false}
          onClick={() => setItem2Open(!item2Open())}
        >
          Second Item
        </AccordionTrigger>
        <AccordionContent open={item2Open()}>
          Each item manages its own open/close state independently.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          open={item3Open()}
          disabled={false}
          onClick={() => setItem3Open(!item3Open())}
        >
          Third Item
        </AccordionTrigger>
        <AccordionContent open={item3Open()}>
          Click any trigger to toggle that item without affecting others.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function AccordionPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Accordion"
        description="A vertically stacked set of interactive headings that each reveal an associated section of content."
      />

      {/* Preview */}
      <Example title="" code={`<Accordion>...</Accordion>`}>
        <div class="w-full max-w-md">
          <SingleOpenAccordion />
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

      {/* Examples */}
      <Section title="Examples">
        <div class="space-y-8">
          <Example title="Single Open (Only One at a Time)" code={singleCode}>
            <div class="w-full max-w-md">
              <SingleOpenAccordion />
            </div>
          </Example>

          <Example title="Multiple Open" code={multipleCode}>
            <div class="w-full max-w-md">
              <MultipleOpenAccordion />
            </div>
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-6">
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">AccordionItem</h3>
            <PropsTable props={accordionItemProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">AccordionTrigger</h3>
            <PropsTable props={accordionTriggerProps} />
          </div>
          <div>
            <h3 class="text-lg font-medium text-zinc-100 mb-4">AccordionContent</h3>
            <PropsTable props={accordionContentProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
