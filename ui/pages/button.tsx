/**
 * Button Documentation Page
 */

import { Button } from '@/components/ui/button'
import { ButtonDemo } from '@/components/docs/button-demo'
import { CodeTooltip } from '@/components/docs/code-tooltip'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  PackageManagerTabs,
  getHighlightedCommands,
  type PropDefinition,
  type TocItem,
} from '../_shared/docs'

// Button variant and size types (for documentation)
type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const usageCode = `import { Button } from '@/components/ui/button'

export default function Page() {
  return <Button>Click me</Button>
}`

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

const interactiveCode = `import { createSignal } from '@barefootjs/dom'

const [count, setCount] = createSignal(0)

<Button onClick={() => setCount(n => n + 1)}>
  Clicked {count()} times
</Button>`

// Props definition
const buttonProps: PropDefinition[] = [
  {
    name: 'variant',
    type: "ButtonVariant",
    defaultValue: "'default'",
    description: 'The visual style of the button.',
  },
  {
    name: 'size',
    type: "ButtonSize",
    defaultValue: "'default'",
    description: 'The size of the button.',
  },
  {
    name: 'asChild',
    type: 'boolean',
    defaultValue: 'false',
    description: 'TODO',
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

<div class="flex flex-wrap items-center gap-2 md:flex-row">
  <Button variant="outline">Button</Button>
  <Button variant="outline" size="icon" aria-label="Submit">
      <PlusIcon />
  </Button>
</div>
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

        {/* Usage */}
        <Section id="usage" title="Usage">
          <CodeBlock code={usageCode} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div class="space-y-8">
            <Example title="Variants" code={variantCode}>
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
      <CodeTooltip />
    </DocPage>
  )
}
