// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup } from '../context-menu'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <ContextMenu open={open()} onOpenChange={setOpen}>
      <ContextMenuTrigger>
        <div>Right-click here</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => {}}>Back</ContextMenuItem>
        <ContextMenuItem onSelect={() => {}}>Forward</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

