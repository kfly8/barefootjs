import { Label } from '@/components/ui/label'
import { LabelFormDemo, LabelDisabledDemo } from '@/components/label-demo'
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

const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'form', title: 'Form', branch: 'start' },
  { id: 'disabled', title: 'Disabled', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

const previewCode = `import { Label } from '@/components/ui/label'

function LabelPreview() {
  return <Label for="email">Your email address</Label>
}`

const formCode = `import { Label } from '@/components/ui/label'

function LabelForm() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <div className="grid w-full items-center gap-1.5">
        <Label for="name">Name</Label>
        <input id="name" type="text" placeholder="Enter your name" />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label for="email">Email</Label>
        <input id="email" type="email" placeholder="Enter your email" />
      </div>
    </div>
  )
}`

const disabledCode = `import { Label } from '@/components/ui/label'

function LabelDisabled() {
  return (
    <div className="group" data-disabled="true">
      <Label for="disabled-input">Disabled field</Label>
      <input id="disabled-input" type="text" disabled placeholder="Cannot edit" />
    </div>
  )
}`

const labelProps: PropDefinition[] = [
  {
    name: 'for',
    type: 'string',
    description: 'The ID of the form element this label is associated with.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS class names.',
  },
  {
    name: 'children',
    type: 'Child',
    description: 'Label content.',
  },
]

export function LabelPage() {
  return (
    <DocPage slug="label" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Label"
          description="Renders an accessible label associated with controls."
          {...getNavLinks('label')}
        />

        {/* Preview */}
        <Example title="" code={previewCode}>
          <Label for="email-preview">Your email address</Label>
        </Example>

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add label" />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Form" code={formCode}>
              <LabelFormDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <LabelDisabledDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={labelProps} />
        </Section>
      </div>
    </DocPage>
  )
}
