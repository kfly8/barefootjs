/**
 * Navigation Menu Documentation Page
 */

import { NavigationMenuBasicDemo, NavigationMenuWithLinksDemo } from '@/components/navigation-menu-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'features', title: 'Features' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'with-links', title: 'With Links', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

function BasicNavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="getting-started">
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent className="w-[400px] md:w-[500px]">
            <ul className="grid gap-3 p-4 md:grid-cols-2">
              <li>
                <NavigationMenuLink href="/docs">
                  <div className="text-sm font-medium">Introduction</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Learn the basics.
                  </p>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="/docs/installation">
                  <div className="text-sm font-medium">Installation</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    How to install and configure.
                  </p>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`

const withLinksCode = `"use client"

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

function NavigationWithLinks() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="docs">
          <NavigationMenuTrigger>Documentation</NavigationMenuTrigger>
          <NavigationMenuContent className="w-[300px]">
            <ul className="grid gap-3 p-4">
              <li>
                <NavigationMenuLink href="/docs/intro">
                  <div className="text-sm font-medium">Introduction</div>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="/docs/api" active={true}>
                  <div className="text-sm font-medium">API Reference</div>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink href="/blog"
            className="h-9 px-4 py-2 inline-flex items-center text-sm font-medium">
            Blog
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`

// Props definitions
const navigationMenuProps: PropDefinition[] = [
  {
    name: 'delayDuration',
    type: 'number',
    defaultValue: '200',
    description: 'Delay in ms before opening on hover.',
  },
  {
    name: 'closeDelay',
    type: 'number',
    defaultValue: '300',
    description: 'Delay in ms before closing after mouse leave.',
  },
]

const navigationMenuItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'Unique identifier for this item. Required when using Trigger + Content.',
  },
]

const navigationMenuTriggerProps: PropDefinition[] = [
  {
    name: 'children',
    type: 'Child',
    description: 'Trigger label text.',
  },
]

const navigationMenuContentProps: PropDefinition[] = [
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS classes. Use to set width (e.g., "w-[400px]").',
  },
]

const navigationMenuLinkProps: PropDefinition[] = [
  {
    name: 'href',
    type: 'string',
    description: 'Link URL.',
  },
  {
    name: 'active',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether this link is the current page. Sets aria-current="page".',
  },
]

export function NavigationMenuPage() {
  return (
    <DocPage slug="navigation-menu" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Navigation Menu"
          description="A collection of links for navigating websites, with hover-activated content panels."
          {...getNavLinks('navigation-menu')}
        />

        {/* Preview */}
        <Example title="" code={`<NavigationMenu><NavigationMenuList><NavigationMenuItem>...</NavigationMenuItem></NavigationMenuList></NavigationMenu>`}>
          <NavigationMenuBasicDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add navigation-menu" />
        </Section>

        {/* Features */}
        <Section id="features" title="Features">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">Hover with delay</strong> - Content opens after a configurable delay (200ms default)</li>
            <li><strong className="text-foreground">Close delay</strong> - Content stays open briefly when moving mouse (300ms default)</li>
            <li><strong className="text-foreground">Click toggle</strong> - Click triggers to toggle content panels</li>
            <li><strong className="text-foreground">Keyboard navigation</strong> - ArrowLeft/Right navigates between triggers</li>
            <li><strong className="text-foreground">Active page</strong> - NavigationMenuLink supports aria-current for active page indication</li>
            <li><strong className="text-foreground">Mixed content</strong> - Combine trigger menus with direct links</li>
          </ul>
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <NavigationMenuBasicDemo />
            </Example>
            <Example title="With Links" code={withLinksCode}>
              <NavigationMenuWithLinksDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">NavigationMenu</h3>
              <PropsTable props={navigationMenuProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">NavigationMenuList</h3>
              <p className="text-sm text-muted-foreground">Styled list wrapper. Renders as &lt;ul&gt;.</p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">NavigationMenuItem</h3>
              <PropsTable props={navigationMenuItemProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">NavigationMenuTrigger</h3>
              <PropsTable props={navigationMenuTriggerProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">NavigationMenuContent</h3>
              <PropsTable props={navigationMenuContentProps} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">NavigationMenuLink</h3>
              <PropsTable props={navigationMenuLinkProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
