/**
 * Switch Documentation Page
 */

import { Switch } from '@/components/ui/switch'
import { SwitchInteractiveDemo, SwitchSettingsPanelDemo } from '@/components/switch-demo'
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
const installCode = `bunx barefoot add switch`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import { Switch } from '@/components/ui/switch'

export default function Page() {
  const [checked, setChecked] = createSignal(false)
  return (
    <Switch
      checked={checked()}
      onCheckedChange={setChecked}
    />
  )
}`

const basicCode = `const [airplaneMode, setAirplaneMode] = createSignal(false)

<div class="flex items-center gap-2">
  <Switch
    checked={airplaneMode()}
    onCheckedChange={setAirplaneMode}
  />
  <span>Airplane Mode</span>
</div>`

const disabledCode = `<Switch checked={false} disabled />
<Switch checked={true} disabled />`

const multipleCode = `const [wifi, setWifi] = createSignal(true)
const [bluetooth, setBluetooth] = createSignal(false)
const [notifications, setNotifications] = createSignal(true)

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <span>Wi-Fi</span>
    <Switch checked={wifi()} onCheckedChange={setWifi} />
  </div>
  <div class="flex items-center justify-between">
    <span>Bluetooth</span>
    <Switch checked={bluetooth()} onCheckedChange={setBluetooth} />
  </div>
  <div class="flex items-center justify-between">
    <span>Notifications</span>
    <Switch checked={notifications()} onCheckedChange={setNotifications} />
  </div>
</div>`

// Props definition
const switchProps: PropDefinition[] = [
  {
    name: 'checked',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the switch is checked.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the switch is disabled.',
  },
  {
    name: 'onCheckedChange',
    type: '(checked: boolean) => void',
    description: 'Event handler called when the switch state changes.',
  },
]

export function SwitchPage() {
  return (
    <DocPage slug="switch" toc={tocItems}>
      <div class="space-y-12">
        <PageHeader
          title="Switch"
          description="A control that allows the user to toggle between checked and not checked."
          {...getNavLinks('switch')}
        />

        {/* Preview */}
        <Example title="" code={`<Switch />`}>
          <SwitchInteractiveDemo />
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
            <Example title="Basic" code={basicCode}>
              <SwitchInteractiveDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div class="flex gap-4">
                <Switch checked={false} disabled />
                <Switch checked={true} disabled />
              </div>
            </Example>

            <Example title="Multiple Switches" code={multipleCode}>
              <SwitchSettingsPanelDemo />
            </Example>
          </div>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={switchProps} />
        </Section>
      </div>
    </DocPage>
  )
}
