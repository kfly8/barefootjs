/**
 * Button Documentation Page
 */

import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icon'
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
import { getNavLinks } from '../_shared/PageNavigation'

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
  <PlusIcon size="sm" />
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


export function ButtonPage() {
  // Generate highlighted commands inside component (after Shiki is initialized)
  const installCommands = getHighlightedCommands('barefoot add button')

  return (
    <DocPage slug="button" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Button"
          description="Displays a button or a component that looks like a button."
          {...getNavLinks('button')}
        />

        {/* Preview */}
        <Example title="" code={`
import { Button } from "@/components/ui/button"
import { PlusIcon } from "@/components/ui/icon"

function ButtonExample() {
  return (
    <div class="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
          <PlusIcon size="sm" />
      </Button>
    </div>
  )
}
          `}>
          <div class="flex flex-wrap items-center gap-2 md:flex-row">
            <Button variant="outline">Button</Button>
            <Button variant="outline" size="icon" aria-label="Submit">
                <PlusIcon size="sm" />
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
                <PlusIcon size="sm" />
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
