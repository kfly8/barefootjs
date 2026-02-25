// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Sheet, SheetTrigger, SheetOverlay, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '../sheet'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <Sheet open={open()} onOpenChange={setOpen}>
      <SheetTrigger>Open Sheet</SheetTrigger>
      <SheetOverlay />
      <SheetContent side="right" ariaLabelledby="sheet-title">
        <SheetHeader>
          <SheetTitle id="sheet-title">Sheet Title</SheetTitle>
          <SheetDescription>Sheet description here.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

