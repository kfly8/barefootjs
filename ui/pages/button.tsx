"use client"
/**
 * Button Documentation Page
 */

import { createSignal } from '@barefootjs/dom'
import { Button } from '../components/Button'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add button`

const usageCode = `import { Button } from '@/components/button'

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
    type: "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'",
    defaultValue: "'default'",
    description: 'The visual style of the button.',
  },
  {
    name: 'size',
    type: "'default' | 'sm' | 'lg' | 'icon'",
    defaultValue: "'default'",
    description: 'The size of the button.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the button is disabled.',
  },
  {
    name: 'onClick',
    type: '() => void',
    description: 'Event handler called when the button is clicked.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The content of the button.',
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

// Interactive counter example
function InteractiveCounter() {
  const [count, setCount] = createSignal(0)
  return (
    <Button onClick={() => setCount(n => n + 1)}>
      Clicked {count()} times
    </Button>
  )
}

export function ButtonPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Button"
        description="Displays a button or a component that looks like a button."
      />

      {/* Preview */}
      <Example title="" code={`<Button>Button</Button>`}>
        <Button>Button</Button>
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
            <InteractiveCounter />
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <PropsTable props={buttonProps} />
      </Section>
    </div>
  )
}
