// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../hover-card'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <HoverCard open={open()} onOpenChange={setOpen}>
      <HoverCardTrigger>
        <a href="#">@username</a>
      </HoverCardTrigger>
      <HoverCardContent>
        <p>User profile information</p>
      </HoverCardContent>
    </HoverCard>
  )
}

