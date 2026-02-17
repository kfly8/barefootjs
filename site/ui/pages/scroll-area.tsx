/**
 * ScrollArea Documentation Page
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
import {
  ScrollAreaTagsDemo,
  ScrollAreaHorizontalDemo,
  ScrollAreaBothAxesDemo,
} from '@/components/scroll-area-demo'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'tags', title: 'Tags', branch: 'start' },
  { id: 'horizontal', title: 'Horizontal Scrolling', branch: 'child' },
  { id: 'both-axes', title: 'Both Axes', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const tagsCode = `"use client"

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => \`v1.2.0-beta.\${a.length - i}\`
)

function ScrollAreaTags() {
  return (
    <ScrollArea class="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}`

const horizontalCode = `"use client"

import { ScrollArea } from '@/components/ui/scroll-area'

function ScrollAreaHorizontal() {
  return (
    <ScrollArea class="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {works.map((work) => (
          <figure className="shrink-0">
            <div className="overflow-hidden rounded-md">
              <div className="h-[150px] w-[200px] bg-muted" />
            </div>
            <figcaption className="pt-2 text-xs text-muted-foreground">
              Photo by <span className="font-semibold text-foreground">{work.artist}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  )
}`

const bothAxesCode = `"use client"

import { ScrollArea } from '@/components/ui/scroll-area'

function ScrollAreaBothAxes() {
  return (
    <ScrollArea class="h-64 w-80 rounded-md border">
      <div className="p-4" style="width: 600px;">
        <h4 className="mb-4 text-sm font-medium leading-none">Changelog</h4>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div className="whitespace-nowrap">
              <div className="text-sm font-medium">{entry.title}</div>
              <p className="text-sm text-muted-foreground">{entry.description}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}`

// Props definition
const scrollAreaProps: PropDefinition[] = [
  {
    name: 'class',
    type: 'string',
    defaultValue: "''",
    description: 'Additional CSS classes for the root element.',
  },
  {
    name: 'type',
    type: "'hover' | 'scroll' | 'auto' | 'always'",
    defaultValue: "'hover'",
    description: 'When to show scrollbars. hover: on mouse enter; scroll: while scrolling; auto: both; always: permanent.',
  },
]

export function ScrollAreaPage() {
  return (
    <DocPage slug="scroll-area" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Scroll Area"
          description="Augments native scroll functionality for custom, cross-browser styling."
          {...getNavLinks('scroll-area')}
        />

        {/* Preview */}
        <Example title="" code={tagsCode}>
          <ScrollAreaTagsDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add scroll-area" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Tags" code={tagsCode}>
              <ScrollAreaTagsDemo />
            </Example>

            <Example title="Horizontal Scrolling" code={horizontalCode}>
              <ScrollAreaHorizontalDemo />
            </Example>

            <Example title="Both Axes" code={bothAxesCode}>
              <ScrollAreaBothAxesDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={scrollAreaProps} />
        </Section>
      </div>
    </DocPage>
  )
}
