/**
 * Button Documentation Page
 */

import { Button } from '@/components/ui/button'
import { ButtonDemo } from '@/components/docs/button-demo'
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
} from '../_shared/docs'

// Table of contents items with tree branch indicators
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'variants', title: 'Variants', branch: 'start' },
  { id: 'sizes', title: 'Sizes', branch: 'child' },
  { id: 'disabled', title: 'Disabled', branch: 'child' },
  { id: 'interactive', title: 'Interactive', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

const variantCode = `<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`

const sizeCode = `<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <PlusIcon />
</Button>`

const disabledCode = `<Button disabled>Disabled</Button>
<Button variant="outline" disabled>Disabled</Button>`

const interactiveCode = `const [count, setCount] = createSignal(0)
<Button onClick={() => setCount(n => n + 1)}>
  Clicked {count()} times
</Button>`

// Props definition
const buttonProps: PropDefinition[] = [
  {
    name: 'variant',
    type: "default | destructive | outline | secondary | ghost | link",
    defaultValue: "'default'",
    description: 'The visual style of the button.',
  },
  {
    name: 'size',
    type: "default | sm | lg | icon | icon-sm | icon-lg",
    defaultValue: "'default'",
    description: 'The size of the button.',
  },
  {
    name: 'asChild',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Render child element instead of button',
  },
]

// Plus icon for size example
function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  )
}

export function ButtonPage() {
  // Generate highlighted commands inside component (after Shiki is initialized)
  const installCommands = getHighlightedCommands('barefoot add button')

  return (
    <DocPage slug="button" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Button"
          description="Displays a button or a component that looks like a button."
        />

        {/* Preview */}
        <Example title="" code={`
import { Button } from "@/components/ui/button"

function ButtonExample() {
  return (
    <div class="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
          <PlusIcon />
      </Button>
    </div>
  )
}
          `}>
          <div class="flex flex-wrap items-center gap-2 md:flex-row">
            <Button variant="outline">Button</Button>
            <Button variant="outline" size="icon" aria-label="Submit">
                <PlusIcon />
            </Button>
          </div>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add button" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Variants" code={`
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
`}>
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </Example>

            <Example title="Sizes" code={sizeCode}>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <PlusIcon />
              </Button>
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Disabled</Button>
            </Example>

            <Example title="Interactive" code={interactiveCode}>
              <ButtonDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={buttonProps} />
        </Section>
      </div>
    </DocPage>
  )
}
