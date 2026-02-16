/**
 * Toggle Group Documentation Page
 */

import {
  ToggleGroupBasicDemo,
  ToggleGroupOutlineDemo,
  ToggleGroupMultipleDemo,
} from '@/components/toggle-group-demo'
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
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'outline', title: 'Outline', branch: 'child' },
  { id: 'multiple', title: 'Multiple', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function ToggleGroupBasicDemo() {
  const [alignment, setAlignment] = createSignal("center")

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" defaultValue="center" onValueChange={setAlignment}>
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRightIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <div className={\`\${alignment() === "left" ? "text-left" : alignment() === "right" ? "text-right" : "text-center"} rounded-md border p-4\`}>
        <p>The quick brown fox jumps over the lazy dog.</p>
      </div>
    </div>
  )
}`

const outlineCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function ToggleGroupOutlineDemo() {
  const [fontSize, setFontSize] = createSignal("M")

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" variant="outline" defaultValue="M" onValueChange={setFontSize}>
        <ToggleGroupItem value="S">S</ToggleGroupItem>
        <ToggleGroupItem value="M">M</ToggleGroupItem>
        <ToggleGroupItem value="L">L</ToggleGroupItem>
      </ToggleGroup>
      <div className={\`\${fontSize() === "S" ? "text-sm" : fontSize() === "L" ? "text-lg" : "text-base"} rounded-md border p-4\`}>
        <p>The quick brown fox jumps over the lazy dog.</p>
      </div>
    </div>
  )
}`

const multipleCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function ToggleGroupMultipleDemo() {
  const [formats, setFormats] = createSignal<string[]>([])

  return (
    <div className="space-y-4">
      <ToggleGroup type="multiple" onValueChange={setFormats}>
        <ToggleGroupItem value="Bold" aria-label="Toggle bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="Italic" aria-label="Toggle italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem value="Underline" aria-label="Toggle underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <div className={\`\${formats().includes("Bold") ? "font-bold" : ""} \${formats().includes("Italic") ? "italic" : ""} \${formats().includes("Underline") ? "underline" : ""} rounded-md border p-4\`}>
        <p>The quick brown fox jumps over the lazy dog.</p>
      </div>
    </div>
  )
}`

// Props definitions
const toggleGroupProps: PropDefinition[] = [
  {
    name: 'type',
    type: "'single' | 'multiple'",
    description: 'The selection mode. "single" allows one item, "multiple" allows many.',
  },
  {
    name: 'defaultValue',
    type: 'string | string[]',
    description: 'The default selected value(s) for uncontrolled mode.',
  },
  {
    name: 'value',
    type: 'string | string[]',
    description: 'The controlled selected value(s). When provided, the component is in controlled mode.',
  },
  {
    name: 'onValueChange',
    type: '(value: string | string[]) => void',
    description: 'Event handler called when the selection changes.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the entire group is disabled.',
  },
  {
    name: 'variant',
    type: "'default' | 'outline'",
    defaultValue: "'default'",
    description: 'The visual variant applied to all items.',
  },
  {
    name: 'size',
    type: "'default' | 'sm' | 'lg'",
    defaultValue: "'default'",
    description: 'The size applied to all items.',
  },
]

const toggleGroupItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value for this toggle item.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether this item is disabled.',
  },
]

export function ToggleGroupPage() {
  return (
    <DocPage slug="toggle-group" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Toggle Group"
          description="A set of two-state buttons that can be toggled on or off."
          {...getNavLinks('toggle-group')}
        />

        {/* Preview */}
        <Example title="" code={basicCode}>
          <ToggleGroupBasicDemo />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add toggle-group" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <ToggleGroupBasicDemo />
            </Example>

            <Example title="Outline" code={outlineCode}>
              <ToggleGroupOutlineDemo />
            </Example>

            <Example title="Multiple" code={multipleCode}>
              <ToggleGroupMultipleDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ToggleGroup</h3>
              <PropsTable props={toggleGroupProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">ToggleGroupItem</h3>
              <PropsTable props={toggleGroupItemProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
