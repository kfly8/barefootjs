/**
 * Badge Documentation Page
 */

import { Badge } from '@/components/ui/badge'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../_shared/docs'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add badge`

const usageCode = `import { Badge } from '@/components/ui/badge'

export default function Page() {
  return <Badge>Badge</Badge>
}`

const variantCode = `<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`

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
  return (
    <DocPage slug="badge" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Badge"
          description="Displays a badge or a component that looks like a badge."
        />

        {/* Preview */}
        <Example title="" code={`<Badge>Badge</Badge>`}>
          <Badge>Badge</Badge>
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
            <Example title="Variants" code={variantCode}>
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
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
