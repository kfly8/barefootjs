// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from '../popover'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger>
        <button>Open</button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Popover content here.</p>
      </PopoverContent>
    </Popover>
  )
}

