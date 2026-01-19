/**
 * Card Documentation Page
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from '@/components/ui/card'
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
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add card`

const usageCode = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from '@/components/ui/card'

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

const loginFormCode = `<Card class="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Login to your account</CardTitle>
    <CardDescription>
      Enter your email below to login to your account
    </CardDescription>
    <CardAction>
      <Button variant="link" class="text-sm">
        Sign up
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <form class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input type="email" placeholder="m@example.com" />
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="#" class="text-sm underline-offset-4 hover:underline">
            Forgot your password?
          </a>
        </div>
        <Input type="password" />
      </div>
    </form>
  </CardContent>
  <CardFooter class="flex flex-col gap-2">
    <Button class="w-full">Login</Button>
    <Button variant="outline" class="w-full">Login with Google</Button>
  </CardFooter>
</Card>`

const simpleCode = `<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
    <CardDescription>You have 3 unread messages.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your notifications will appear here.</p>
  </CardContent>
</Card>`

const withActionCode = `<Card class="w-[380px]">
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>Manage your team members here.</CardDescription>
    <CardAction>
      <Button size="sm">Add Member</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>Your team members will be listed here.</p>
  </CardContent>
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
    description: 'The content of the header (typically CardTitle, CardDescription, CardAction).',
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

const cardActionProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'Action elements (typically buttons or links).',
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
    <DocPage slug="card" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Card"
          description="Displays a card with header, content, and footer."
          {...getNavLinks('card')}
        />

        {/* Preview - Login Form Example (like shadcn/ui) */}
        <Example title="" code={loginFormCode}>
          <Card class="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
              <CardAction>
                <Button variant="link" class="text-sm">
                  Sign up
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <form class="flex flex-col gap-6">
                <div class="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" placeholder="m@example.com" />
                </div>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" class="text-sm underline-offset-4 hover:underline">
                      Forgot your password?
                    </a>
                  </div>
                  <Input type="password" />
                </div>
              </form>
            </CardContent>
            <CardFooter class="flex flex-col gap-2">
              <Button class="w-full">Login</Button>
              <Button variant="outline" class="w-full">Login with Google</Button>
            </CardFooter>
          </Card>
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

            <Example title="With Action" code={withActionCode}>
              <Card class="w-[380px]">
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your team members here.</CardDescription>
                  <CardAction>
                    <Button size="sm">Add Member</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p>Your team members will be listed here.</p>
                </CardContent>
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
        <Section id="api-reference" title="API Reference">
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
              <h3 class="text-lg font-semibold text-foreground mb-4">CardAction</h3>
              <PropsTable props={cardActionProps} />
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
    </DocPage>
  )
}
