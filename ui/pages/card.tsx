/**
 * Card Documentation Page
 */

import { Button } from '@/components/Button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/Card'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add card`

const usageCode = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/card'

export default function Page() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  )
}`

const simpleCode = `<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
    <CardDescription>You have 3 unread messages.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your notifications will appear here.</p>
  </CardContent>
</Card>`

const withFooterCode = `<Card>
  <CardHeader>
    <CardTitle>Create project</CardTitle>
    <CardDescription>Deploy your new project in one-click.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Configure your project settings here.</p>
  </CardContent>
  <CardFooter>
    <Button>Create</Button>
  </CardFooter>
</Card>`

const minimalCode = `<Card>
  <CardContent class="pt-6">
    <p>A simple card with only content.</p>
  </CardContent>
</Card>`

// Props definitions
const cardProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The content of the card (typically CardHeader, CardContent, CardFooter).',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

const cardHeaderProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The content of the header (typically CardTitle, CardDescription).',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

const cardTitleProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The title text.',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

const cardDescriptionProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The description text.',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

const cardContentProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The main content of the card.',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

const cardFooterProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The footer content (typically actions like buttons).',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

export function CardPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Card"
        description="Displays a card with header, content, and footer."
      />

      {/* Preview */}
      <Example title="" code={`<Card>...</Card>`}>
        <Card class="w-[350px]">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card Content</p>
          </CardContent>
          <CardFooter>
            <p>Card Footer</p>
          </CardFooter>
        </Card>
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
          <Example title="Simple" code={simpleCode}>
            <Card class="w-[350px]">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>You have 3 unread messages.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Your notifications will appear here.</p>
              </CardContent>
            </Card>
          </Example>

          <Example title="With Footer" code={withFooterCode}>
            <Card class="w-[350px]">
              <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>Deploy your new project in one-click.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Configure your project settings here.</p>
              </CardContent>
              <CardFooter>
                <Button>Create</Button>
              </CardFooter>
            </Card>
          </Example>

          <Example title="Minimal" code={minimalCode}>
            <Card class="w-[350px]">
              <CardContent class="pt-6">
                <p>A simple card with only content.</p>
              </CardContent>
            </Card>
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <div class="space-y-8">
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-4">Card</h3>
            <PropsTable props={cardProps} />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-4">CardHeader</h3>
            <PropsTable props={cardHeaderProps} />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-4">CardTitle</h3>
            <PropsTable props={cardTitleProps} />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-4">CardDescription</h3>
            <PropsTable props={cardDescriptionProps} />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-4">CardContent</h3>
            <PropsTable props={cardContentProps} />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground mb-4">CardFooter</h3>
            <PropsTable props={cardFooterProps} />
          </div>
        </div>
      </Section>
    </div>
  )
}
