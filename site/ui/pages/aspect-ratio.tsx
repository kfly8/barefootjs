/**
 * Aspect Ratio Documentation Page
 */

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
import { AspectRatioPreviewDemo, AspectRatioBasicDemo } from '@/components/aspect-ratio-demo'

const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'api-reference', title: 'API Reference' },
]

const previewCode = `import { AspectRatio } from "@/components/ui/aspect-ratio"

function AspectRatioDemo() {
  return (
    <div className="w-full max-w-md">
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
        <img
          src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
          alt="Photo by Drew Beamer"
          className="object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  )
}`

const basicCode = `import { AspectRatio } from "@/components/ui/aspect-ratio"

function AspectRatioBasic() {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
      <div>
        <p className="text-sm text-muted-foreground mb-2">1:1</p>
        <AspectRatio ratio={1} className="overflow-hidden rounded-lg">
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-sm text-muted-foreground">1:1</span>
          </div>
        </AspectRatio>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">16:9</p>
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-sm text-muted-foreground">16:9</span>
          </div>
        </AspectRatio>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">4:3</p>
        <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-lg">
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-sm text-muted-foreground">4:3</span>
          </div>
        </AspectRatio>
      </div>
    </div>
  )
}`

const aspectRatioProps: PropDefinition[] = [
  {
    name: 'ratio',
    type: 'number',
    defaultValue: '1',
    description: 'The desired width-to-height ratio (e.g. 16/9, 4/3).',
  },
  {
    name: 'children',
    type: 'Child',
    defaultValue: '-',
    description: 'Content to display within the aspect ratio container.',
  },
  {
    name: 'className',
    type: 'string',
    defaultValue: "''",
    description: 'Additional CSS classes.',
  },
]

export function AspectRatioPage() {
  return (
    <DocPage slug="aspect-ratio" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Aspect Ratio"
          description="Displays content within a desired ratio."
          {...getNavLinks('aspect-ratio')}
        />

        {/* Preview */}
        <Example title="" code={previewCode}>
          <AspectRatioPreviewDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add aspect-ratio" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <AspectRatioBasicDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={aspectRatioProps} />
        </Section>
      </div>
    </DocPage>
  )
}
