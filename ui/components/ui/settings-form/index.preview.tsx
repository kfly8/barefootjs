"use client"

import { createSignal } from '@barefootjs/dom'
import { SettingsForm } from '../settings-form'
import { Switch } from '../switch'
import { Input } from '../input'
import { Button } from '../button'
import { Label } from '../label'

/** Empty form — default state */
export function Default() {
  return <SettingsForm />
}

/** Individual form controls used by SettingsForm */
export function FormControls() {
  const [on, setOn] = createSignal(false)
  return (
    <div className="space-y-6 max-w-sm">
      <div className="space-y-2">
        <Label for="name-demo">Display Name</Label>
        <Input id="name-demo" placeholder="Enter your display name" />
      </div>

      <div className="flex items-center justify-between">
        <Label for="notif-demo">Enable notifications</Label>
        <Switch checked={on()} onCheckedChange={setOn} />
      </div>

      <div className="flex gap-2">
        <Button>Save</Button>
        <Button variant="outline">Cancel</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  )
}

/** Pre-filled form with notifications enabled */
export function PreFilled() {
  const [name, setName] = createSignal('Alice')
  const [notifications, setNotifications] = createSignal(true)
  return (
    <div className="max-w-sm space-y-6">
      <div className="space-y-2">
        <Label for="prefilled-name">Display Name</Label>
        <Input
          id="prefilled-name"
          value={name()}
          onInput={e => setName(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label for="prefilled-notif">Enable notifications</Label>
        <Switch checked={notifications()} onCheckedChange={setNotifications} />
      </div>

      <Button>Save</Button>
    </div>
  )
}
