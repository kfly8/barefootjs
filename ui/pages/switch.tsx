"use client"
/**
 * Switch Documentation Page
 */

import { createSignal } from '@barefootjs/dom'
import { Switch } from '../components/Switch'
import {
  PageHeader,
  Section,
  Example,
  CodeBlock,
  PropsTable,
  type PropDefinition,
} from '../_shared/docs'

// Code examples
const installCode = `bunx barefoot add switch`

const usageCode = `import { createSignal } from '@barefootjs/dom'
import { Switch } from '@/components/switch'

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

// Interactive example component
function InteractiveSwitch() {
  const [checked, setChecked] = createSignal(false)
  return (
    <div class="flex items-center gap-2">
      <Switch
        checked={checked()}
        disabled={false}
        onCheckedChange={setChecked}
      />
      <span class="text-zinc-100">{checked() ? 'On' : 'Off'}</span>
    </div>
  )
}

// Settings panel example
function SettingsPanel() {
  const [wifi, setWifi] = createSignal(true)
  const [bluetooth, setBluetooth] = createSignal(false)
  const [notifications, setNotifications] = createSignal(true)

  return (
    <div class="w-64 space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-zinc-100">Wi-Fi</span>
        <Switch checked={wifi()} disabled={false} onCheckedChange={setWifi} />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-zinc-100">Bluetooth</span>
        <Switch checked={bluetooth()} disabled={false} onCheckedChange={setBluetooth} />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-zinc-100">Notifications</span>
        <Switch checked={notifications()} disabled={false} onCheckedChange={setNotifications} />
      </div>
    </div>
  )
}

export function SwitchPage() {
  return (
    <div class="space-y-12">
      <PageHeader
        title="Switch"
        description="A control that allows the user to toggle between checked and not checked."
      />

      {/* Preview */}
      <Example title="" code={`<Switch />`}>
        <InteractiveSwitch />
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
          <Example title="Basic" code={basicCode}>
            <InteractiveSwitch />
          </Example>

          <Example title="Disabled" code={disabledCode}>
            <div class="flex gap-4">
              <Switch checked={false} disabled />
              <Switch checked={true} disabled />
            </div>
          </Example>

          <Example title="Multiple Switches" code={multipleCode}>
            <SettingsPanel />
          </Example>
        </div>
      </Section>

      {/* API Reference */}
      <Section title="API Reference">
        <PropsTable props={switchProps} />
      </Section>
    </div>
  )
}
