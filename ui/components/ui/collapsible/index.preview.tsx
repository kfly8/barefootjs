// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <Collapsible open={open()} onOpenChange={setOpen}>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>Hidden content here</CollapsibleContent>
    </Collapsible>
  )
}

