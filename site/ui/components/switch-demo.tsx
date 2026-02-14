"use client"
/**
 * SwitchDemo Components
 *
 * Interactive demos for Switch component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Switch } from '@ui/components/ui/switch'

/**
 * Basic switch example
 * Shows simple usage with defaultChecked and disabled states
 */
export function SwitchBasicDemo() {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Switch />
        <span className="text-sm font-medium leading-none">
          Airplane Mode
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Switch defaultChecked />
        <span className="text-sm font-medium leading-none">
          Wi-Fi
        </span>
      </div>
      <div className="flex items-center space-x-2 opacity-50">
        <Switch disabled />
        <span className="text-sm font-medium leading-none">
          Unavailable option
        </span>
      </div>
    </div>
  )
}

/**
 * Form example with multiple controlled switches
 * Notification settings pattern with dynamic summary
 */
export function SwitchFormDemo() {
  const [push, setPush] = createSignal(true)
  const [emailDigest, setEmailDigest] = createSignal(false)
  const [marketing, setMarketing] = createSignal(false)

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h4 className="text-sm font-medium leading-none">Notifications</h4>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications.
        </p>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none">Push notifications</span>
            <Switch
              checked={push()}
              onCheckedChange={setPush}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none">Email digest</span>
            <Switch
              checked={emailDigest()}
              onCheckedChange={setEmailDigest}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none">Marketing emails</span>
            <Switch
              checked={marketing()}
              onCheckedChange={setMarketing}
            />
          </div>
        </div>
      </div>
      <div className="text-sm text-muted-foreground pt-2 border-t">
        Enabled: {[push() && 'Push notifications', emailDigest() && 'Email digest', marketing() && 'Marketing emails'].filter(Boolean).join(', ') || 'None'}
      </div>
    </div>
  )
}

/**
 * Consent example
 * Cookie consent pattern with switch + description + button interplay
 */
export function SwitchConsentDemo() {
  const [accepted, setAccepted] = createSignal(false)

  // Handle label click to toggle switch
  const handleLabelClick = () => {
    setAccepted(!accepted())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2">
        <Switch
          checked={accepted()}
          onCheckedChange={setAccepted}
          class="mt-px"
        />
        <div
          className="grid gap-1.5 leading-none cursor-pointer select-none"
          onClick={handleLabelClick}
        >
          <span className="text-sm font-medium leading-none">
            Accept analytics cookies
          </span>
          <p className="text-sm text-muted-foreground">
            Help us improve by allowing anonymous usage data collection.
          </p>
        </div>
      </div>
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        disabled={!accepted()}
      >
        Save preferences
      </button>
    </div>
  )
}

/**
 * Notification preferences with master toggle
 * Array-based state management with immutable updates
 */

interface Channel {
  id: number
  name: string
  description: string
}

const channels: Channel[] = [
  { id: 0, name: 'Email', description: 'Receive notifications via email' },
  { id: 1, name: 'Push', description: 'Browser push notifications' },
  { id: 2, name: 'SMS', description: 'Text message alerts' },
]

export function SwitchNotificationDemo() {
  // Array-based state management with immutable updates
  const [enabled, setEnabled] = createSignal<boolean[]>(channels.map(() => false))

  const enabledCount = createMemo(() => enabled().filter(Boolean).length)
  const isAllEnabled = createMemo(() => enabledCount() === channels.length)
  const selectionLabel = createMemo(() =>
    enabledCount() > 0 ? `${enabledCount()} enabled` : 'Enable all'
  )

  // Immutable update pattern for toggling individual channel
  const toggleChannel = (index: number) => {
    setEnabled(prev => prev.map((v, i) => i === index ? !v : v))
  }

  // Immutable update pattern for toggling all channels
  const toggleAll = (value: boolean) => {
    setEnabled(prev => prev.map(() => value))
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-3">
          <Switch
            checked={isAllEnabled()}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectionLabel()}
          </span>
        </div>
      </div>
      <div className="divide-y border-x border-b rounded-b-md">
        {channels.map((channel) => (
          <div key={channel.id} className="flex items-center justify-between px-3 py-3">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">{channel.name}</span>
              <p className="text-xs text-muted-foreground">{channel.description}</p>
            </div>
            <Switch checked={enabled()[channel.id]} onCheckedChange={() => toggleChannel(channel.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
