/**
 * Spinner Documentation Page
 */

import { Spinner } from '@/components/ui/spinner'
import { SpinnerSizesDemo, SpinnerButtonDemo } from '@/components/spinner-demo'
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
  { id: 'default', title: 'Default', branch: 'start' },
  { id: 'sizes', title: 'Sizes', branch: 'child' },
  { id: 'button-loading', title: 'Button Loading', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const defaultCode = `import { Spinner } from '@/components/ui/spinner'

function SpinnerDefault() {
  return <Spinner />
}`

const sizesCode = `import { Spinner } from '@/components/ui/spinner'

function SpinnerSizes() {
  return (
    <div className="flex items-center gap-4">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
      <Spinner className="size-12" />
    </div>
  )
}`

const buttonLoadingCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

function SpinnerButton() {
  const [loading, setLoading] = createSignal(false)

  const handleClick = (e: Event) => {
    e.preventDefault()
    if (loading()) return
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <Button disabled={loading()} onClick={handleClick}>
      <Spinner className={\`size-4 \${loading() ? '' : 'hidden'}\`} />
      <span>{loading() ? 'Processing...' : 'Submit'}</span>
    </Button>
  )
}`

// Props definition
const spinnerProps: PropDefinition[] = [
  {
    name: 'className',
    type: 'string',
    defaultValue: "''",
    description: 'Additional CSS classes. Use size utilities like "size-4" or "size-6" to change the spinner size.',
  },
  {
    name: 'aria-label',
    type: 'string',
    defaultValue: "'Loading'",
    description: 'Accessible label for the spinner.',
  },
]

export function SpinnerPage() {
  return (
    <DocPage slug="spinner" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Spinner"
          description="An animated loading indicator for async operations."
          {...getNavLinks('spinner')}
        />

        {/* Preview */}
        <Example title="" code={`<Spinner />`}>
          <Spinner />
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add spinner" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Default" code={defaultCode}>
              <Spinner />
            </Example>

            <Example title="Sizes" code={sizesCode}>
              <SpinnerSizesDemo />
            </Example>

            <Example title="Button Loading" code={buttonLoadingCode}>
              <SpinnerButtonDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={spinnerProps} />
        </Section>
      </div>
    </DocPage>
  )
}
