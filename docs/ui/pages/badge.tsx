/**
 * Badge Documentation Page
 */

import { Badge } from '@/components/ui/badge'
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
  { id: 'default', title: 'Default', branch: 'start' },
  { id: 'secondary', title: 'Secondary', branch: 'child' },
  { id: 'destructive', title: 'Destructive', branch: 'child' },
  { id: 'outline', title: 'Outline', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const defaultCode = `"use client"

import { Badge } from '@/components/ui/badge'

function BadgeDefault() {
  return <Badge variant="default">Default</Badge>
}`

const secondaryCode = `"use client"

import { Badge } from '@/components/ui/badge'

function BadgeSecondary() {
  return <Badge variant="secondary">Secondary</Badge>
}`

const destructiveCode = `"use client"

import { Badge } from '@/components/ui/badge'

function BadgeDestructive() {
  return <Badge variant="destructive">Destructive</Badge>
}`

const outlineCode = `"use client"

import { Badge } from '@/components/ui/badge'

function BadgeOutline() {
  return <Badge variant="outline">Outline</Badge>
}`

// Props definition
const badgeProps: PropDefinition[] = [
  {
    name: 'variant',
    type: "'default' | 'secondary' | 'destructive' | 'outline'",
    defaultValue: "'default'",
    description: 'The visual style of the badge.',
  },
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The content of the badge.',
  },
]

export function BadgePage() {
  const installCommands = getHighlightedCommands('barefoot add badge')

  return (
    <DocPage slug="badge" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Badge"
          description="Displays a badge or a component that looks like a badge."
          {...getNavLinks('badge')}
        />

        {/* Preview */}
        <Example title="" code={`<Badge>Badge</Badge>`}>
          <Badge>Badge</Badge>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add badge" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Default" code={defaultCode}>
              <Badge variant="default">Default</Badge>
            </Example>

            <Example title="Secondary" code={secondaryCode}>
              <Badge variant="secondary">Secondary</Badge>
            </Example>

            <Example title="Destructive" code={destructiveCode}>
              <Badge variant="destructive">Destructive</Badge>
            </Example>

            <Example title="Outline" code={outlineCode}>
              <Badge variant="outline">Outline</Badge>
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={badgeProps} />
        </Section>
      </div>
    </DocPage>
  )
}
