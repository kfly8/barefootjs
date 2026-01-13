/**
 * Checkbox Documentation Page
 */

import { Checkbox } from '@/components/ui/checkbox'
import { CheckboxBindingDemo, CheckboxWithLabelDemo } from '@/components/checkbox-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'examples', title: 'Examples' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const installCode = `bunx barefoot add checkbox`

const usageCode = `import { Checkbox } from '@/components/ui/checkbox'

export default function Page() {
  return <Checkbox />
}`

const checkedCode = `<Checkbox />
<Checkbox checked />`

const disabledCode = `<Checkbox disabled />
<Checkbox checked disabled />`

const bindingCode = `import { createSignal } from '@barefootjs/dom'

const [checked, setChecked] = createSignal(false)

<Checkbox
  checked={checked()}
  onCheckedChange={setChecked}
/>
<p>{checked() ? 'Checked' : 'Unchecked'}</p>`

const withLabelCode = `<label class="flex items-center gap-2">
  <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
  <span>Accept terms and conditions</span>
</label>`

// Props definition
const checkboxProps: PropDefinition[] = [
  {
    name: 'checked',
    type: 'boolean',
    defaultValue: 'false',
    description: 'The controlled checked state of the checkbox.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the checkbox is disabled.',
  },
  {
    name: 'onCheckedChange',
    type: '(checked: boolean) => void',
    description: 'Event handler called when the checked state changes.',
  },
]

export function CheckboxPage() {
  return (
    <DocPage slug="checkbox" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Checkbox"
          description="A control that allows the user to toggle between checked and unchecked states."
          {...getNavLinks('checkbox')}
        />

        {/* Preview */}
        <Example title="" code={`<Checkbox />`}>
          <Checkbox />
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
            <Example title="Checked State" code={checkedCode}>
              <div class="flex gap-4">
                <Checkbox />
                <Checkbox checked={true} />
              </div>
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div class="flex gap-4">
                <Checkbox disabled={true} />
                <Checkbox checked={true} disabled={true} />
              </div>
            </Example>

            <Example title="State Binding" code={bindingCode}>
              <CheckboxBindingDemo />
            </Example>

            <Example title="With Label" code={withLabelCode}>
              <CheckboxWithLabelDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={checkboxProps} />
        </Section>
      </div>
    </DocPage>
  )
}
