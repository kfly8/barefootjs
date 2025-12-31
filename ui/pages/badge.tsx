/**
 * Badge Documentation Page
 */

import { Badge } from '../components/Badge'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add badge`

const usageCode = `import { Badge } from '@/components/badge'

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
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <PropsTable props={badgeProps} />
      </Section>
    </div>
  )
}
