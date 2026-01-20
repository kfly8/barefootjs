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
  PropsTable,
  PackageManagerTabs,
  getHighlightedCommands,
  type PropDefinition,
  type TocItem,
} from '../components/shared/docs'
import { getNavLinks } from '../components/shared/PageNavigation'

// Table of contents items
const tocItems: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'examples', title: 'Examples' },
  { id: 'basic', title: 'Basic', branch: 'start' },
  { id: 'disabled', title: 'Disabled', branch: 'child' },
  { id: 'multiple', title: 'Multiple Switches', branch: 'end' },
  { id: 'api-reference', title: 'API Reference' },
]

// Code examples
const basicCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Switch } from '@/components/ui/switch'

function SwitchBasic() {
  const [airplaneMode, setAirplaneMode] = createSignal(false)

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={airplaneMode()}
        onCheckedChange={setAirplaneMode}
      />
      <span className="text-sm">Airplane Mode</span>
    </div>
  )
}`

const disabledCode = `"use client"

import { Switch } from '@/components/ui/switch'

function SwitchDisabled() {
  return (
    <div className="flex gap-4">
      <Switch checked={false} disabled />
      <Switch checked={true} disabled />
    </div>
  )
}`

const multipleCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import { Switch } from '@/components/ui/switch'

function SwitchMultiple() {
  const [wifi, setWifi] = createSignal(true)
  const [bluetooth, setBluetooth] = createSignal(false)
  const [notifications, setNotifications] = createSignal(true)

  return (
    <div className="space-y-4 w-64">
      <div className="flex items-center justify-between">
        <span className="text-sm">Wi-Fi</span>
        <Switch checked={wifi()} onCheckedChange={setWifi} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Bluetooth</span>
        <Switch checked={bluetooth()} onCheckedChange={setBluetooth} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Notifications</span>
        <Switch checked={notifications()} onCheckedChange={setNotifications} />
      </div>
    </div>
  )
}`

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
  const installCommands = getHighlightedCommands('barefoot add switch')

  return (
    <DocPage slug="switch" toc={tocItems}>
      <div className="space-y-12">
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
          <PackageManagerTabs command="barefoot add switch" highlightedCommands={installCommands} />
        </Section>

        {/* Examples */}
        <Section id="examples" title="Examples">
          <div className="space-y-8">
            <Example title="Basic" code={basicCode}>
              <SwitchInteractiveDemo />
            </Example>

            <Example title="Disabled" code={disabledCode}>
              <div className="flex gap-4">
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
