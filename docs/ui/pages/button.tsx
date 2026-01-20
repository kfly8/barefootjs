/**
 * Button Documentation Page
 */

import { Button } from '@/components/ui/button'
import { PlusIcon } from '@/components/ui/icon'
import { ButtonDemo } from '@/components/button-demo'
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

// Table of contents items with tree branch indicators
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'default', title: 'Default', branch: 'start' },
  { id: 'secondary', title: 'Secondary', branch: 'child' },
  { id: 'destructive', title: 'Destructive', branch: 'child' },
  { id: 'outline', title: 'Outline', branch: 'child' },
  { id: 'ghost', title: 'Ghost', branch: 'child' },
  { id: 'link', title: 'Link', branch: 'child' },
  { id: 'sizes', title: 'Sizes', branch: 'child' },
  { id: 'icon-sizes', title: 'Icon Sizes', branch: 'child' },
  { id: 'disabled', title: 'Disabled', branch: 'child' },
  { id: 'counter', title: 'Counter', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

const sizeCode = `<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>`

const iconSizeCode = `<Button size="icon-sm" aria-label="Add">
  <PlusIcon />
</Button>
<Button size="icon" aria-label="Add">
  <PlusIcon />
</Button>
<Button size="icon-lg" aria-label="Add">
  <PlusIcon />
</Button>`

const disabledCode = `<Button disabled>Disabled</Button>
<Button variant="outline" disabled>Disabled</Button>`

const counterCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Button } from '@/components/ui/button'

function Counter() {
  const [count, setCount] = createSignal(0)
  return (
    <Button onClick={() => setCount(n => n + 1)}>
      Clicked {count()} times
    </Button>
  )
}`

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
      <div className="space-y-12">
        <PageHeader
          title="Button"
          description="Displays a button or a component that looks like a button."
          {...getNavLinks('button')}
        />

        <Example title="" code={`import { Button } from "@/components/ui/button"
import { PlusIcon } from "@/components/ui/icon"

function ButtonExample() {
  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button variant="outline">Button</Button>
      <Button variant="outline" size="icon" aria-label="Submit">
          <PlusIcon />
      </Button>
    </div>
  )
}
          `}>
          <div className="flex flex-wrap items-center gap-2 md:flex-row">
            <Button variant="outline">Button</Button>
            <Button variant="outline" size="icon" aria-label="Submit">
                <PlusIcon />
            </Button>
          </div>
        </Example>

        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add button" highlightedCommands={installCommands} />
        </Section>

        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Default" code={`<Button variant="default">Default</Button>`} showLineNumbers={false}>
              <Button variant="default">Default</Button>
            </Example>

            <Example title="Secondary" code={`<Button variant="secondary">Secondary</Button>`} showLineNumbers={false}>
              <Button variant="secondary">Secondary</Button>
            </Example>

            <Example title="Destructive" code={`<Button variant="destructive">Destructive</Button>`} showLineNumbers={false}>
              <Button variant="destructive">Destructive</Button>
            </Example>

            <Example title="Outline" code={`<Button variant="outline">Outline</Button>`} showLineNumbers={false}>
              <Button variant="outline">Outline</Button>
            </Example>

            <Example title="Ghost" code={`<Button variant="ghost">Ghost</Button>`} showLineNumbers={false}>
              <Button variant="ghost">Ghost</Button>
            </Example>

            <Example title="Link" code={`<Button variant="link">Link</Button>`} showLineNumbers={false}>
              <Button variant="link">Link</Button>
            </Example>

            <Example title="Sizes" code={sizeCode} showLineNumbers={false}>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </Example>

            <Example title="Icon Sizes" code={iconSizeCode}>
              <Button size="icon-sm" aria-label="Add">
                <PlusIcon />
              </Button>
              <Button size="icon" aria-label="Add">
                <PlusIcon />
              </Button>
              <Button size="icon-lg" aria-label="Add">
                <PlusIcon />
              </Button>
            </Example>

            <Example title="Disabled" code={disabledCode} showLineNumbers={false}>
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>Disabled</Button>
            </Example>

            <Example title="Counter" code={counterCode}>
              <ButtonDemo />
            </Example>
          </div>
        </Section>

        <Section id="api-reference" title="API Reference">
          <PropsTable props={buttonProps} />
        </Section>
      </div>
    </DocPage>
  )
}
