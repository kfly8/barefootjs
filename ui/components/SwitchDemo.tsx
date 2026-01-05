"use client"
/**
 * SwitchDemo Components
 *
 * Interactive demos for Switch component.
 * Used in switch documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import { Switch } from './Switch'

/**
 * Basic interactive switch
 */
export function SwitchInteractiveDemo() {
  const [checked, setChecked] = createSignal(false)
  return (
    <div class="flex items-center gap-2">
      <Switch
        checked={checked()}
        disabled={false}
        onCheckedChange={setChecked}
      />
      <span class="text-foreground">{checked() ? 'On' : 'Off'}</span>
    </div>
  )
}

/**
 * Settings panel with multiple switches
 */
export function SwitchSettingsPanelDemo() {
  const [wifi, setWifi] = createSignal(true)
  const [bluetooth, setBluetooth] = createSignal(false)
  const [notifications, setNotifications] = createSignal(true)

  return (
    <div class="w-64 space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-foreground">Wi-Fi</span>
        <Switch checked={wifi()} disabled={false} onCheckedChange={setWifi} />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-foreground">Bluetooth</span>
        <Switch checked={bluetooth()} disabled={false} onCheckedChange={setBluetooth} />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-foreground">Notifications</span>
        <Switch checked={notifications()} disabled={false} onCheckedChange={setNotifications} />
      </div>
    </div>
  )
}
