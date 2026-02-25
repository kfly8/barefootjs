// Auto-generated preview. Customize by editing this file.
"use client"

import { Toggle } from '../toggle'

export function Default() {
  return (
    <div className="flex gap-4">
      <Toggle />
      <Toggle defaultPressed />
    </div>
  )
}

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Toggle variant="default">Default</Toggle>
      <Toggle variant="outline">Outline</Toggle>
    </div>
  )
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Toggle size="default">Default</Toggle>
      <Toggle size="sm">Sm</Toggle>
      <Toggle size="lg">Lg</Toggle>
    </div>
  )
}

