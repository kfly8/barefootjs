/**
 * Card Documentation Page
 */

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardImage,
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
  { id: 'profile-card', title: 'Profile Card', branch: 'start' },
  { id: 'stats-card', title: 'Stats Card', branch: 'child' },
  { id: 'login-form', title: 'Login Form', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const imageCardCode = `"use client"

import {
  Card,
  CardImage,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function TravelCard() {
  return (
    <Card className="w-[350px]">
      <CardImage
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
        alt="Mountain landscape"
      />
      <CardHeader>
        <CardTitle>Swiss Alps Adventure</CardTitle>
        <CardDescription>
          Experience breathtaking views on a 7-day guided hiking tour through
          the Swiss Alps, featuring scenic mountain trails and charming
          alpine villages.
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" data-card-hover-action>
            View
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}`

const loginFormCode = `"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
        <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="ml-auto h-auto p-0">
                  Forgot your password?
                </Button>
              </div>
              <Input id="password" type="password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full">Login</Button>
      </CardFooter>
    </Card>
  )
}`

const profileCardCode = `"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export function ProfileCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center gap-4">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
            alt="Emily Chen"
            className="h-12 w-12 rounded-full"
          />
          <div>
            <CardTitle>Emily Chen</CardTitle>
            <CardDescription>Senior Product Designer</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Email:</span>
          <span>emily.chen@example.com</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Phone:</span>
          <span>+1 (555) 123-4567</span>
        </div>
      </CardContent>
    </Card>
  )
}`

const statsCardCode = `"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export function StatsCard() {
  return (
    <Card className="w-[300px] !gap-2">
      <CardHeader>
        <CardDescription>
          Active Users
          <span className="ml-2 text-xs">Jan 2025</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-bold">12,486</div>
        <p className="text-xs text-muted-foreground">
          +8.2% from last month
        </p>
      </CardContent>
    </Card>
  )
}`

// Props definitions
const cardProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The content of the card (typically CardImage, CardHeader, CardContent, CardFooter).',
  },
  {
    name: 'class',
    type: 'string',
    description: 'Additional CSS classes to apply.',
  },
]

const cardImageProps: PropDefinition[] = [
  {
    name: 'src',
    type: 'string',
    description: 'Image source URL (required).',
  },
  {
    name: 'alt',
    type: 'string',
    description: 'Alternative text for the image (required).',
  },
  {
    name: 'width',
    type: 'number',
    description: 'Image width in pixels.',
  },
  {
    name: 'height',
    type: 'number',
    description: 'Image height in pixels.',
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
  const installCommands = getHighlightedCommands('barefoot add card')

  return (
    <DocPage slug="card" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Card"
          description="Displays a card with header, content, and footer."
          {...getNavLinks('card')}
        />

        {/* Preview - Image Card Example */}
        <Example title="" code={imageCardCode}>
          <Card className="w-[350px]">
            <CardImage
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&dpr=2&q=80"
              alt="Mountain landscape"
            />
            <CardHeader>
              <CardTitle>Swiss Alps Adventure</CardTitle>
              <CardDescription>
                Experience breathtaking views on a 7-day guided hiking tour through the Swiss Alps, featuring scenic mountain trails and charming alpine villages.
              </CardDescription>
              <CardAction>
                <Button variant="outline" size="sm" data-card-hover-action>
                  View
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add card" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Profile Card" code={profileCardCode}>
              <Card className="w-[350px]">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
                      alt="Emily Chen"
                      className="h-12 w-12 rounded-full"
                    />
                    <div>
                      <CardTitle>Emily Chen</CardTitle>
                      <CardDescription>Senior Product Designer</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span>emily.chen@example.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>+1 (555) 123-4567</span>
                  </div>
                </CardContent>
              </Card>
            </Example>

            <Example title="Stats Card" code={statsCardCode}>
              <Card className="w-[300px] !gap-2">
                <CardHeader>
                  <CardDescription>
                    Active Users
                    <span className="ml-2 text-xs">Jan 2025</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold">12,486</div>
                  <p className="text-xs text-muted-foreground">
                    +8.2% from last month
                  </p>
                </CardContent>
              </Card>
            </Example>

            <Example title="Login Form" code={loginFormCode}>
              <Card className="w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your email below to login to your account
                  </CardDescription>
                  <CardAction>
                    <Button variant="link">Sign Up</Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <form>
                    <div className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input type="email" placeholder="m@example.com" />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          <Button variant="link" className="ml-auto h-auto p-0">
                            Forgot your password?
                          </Button>
                        </div>
                        <Input type="password" />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full">Login</Button>
                </CardFooter>
              </Card>
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Card</h3>
              <PropsTable props={cardProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardImage</h3>
              <PropsTable props={cardImageProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardHeader</h3>
              <PropsTable props={cardHeaderProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardTitle</h3>
              <PropsTable props={cardTitleProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardDescription</h3>
              <PropsTable props={cardDescriptionProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardAction</h3>
              <PropsTable props={cardActionProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardContent</h3>
              <PropsTable props={cardContentProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">CardFooter</h3>
              <PropsTable props={cardFooterProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
