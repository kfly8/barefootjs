"use client"

import { Checkbox } from '../checkbox'
import { Label } from '../label'

export function Default() {
  return (
    <div className="flex gap-4">
      <Checkbox />
      <Checkbox defaultChecked />
      <Checkbox disabled />
    </div>
  )
}

export function WithLabel() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label for="terms">Accept terms</Label>
    </div>
  )
}
