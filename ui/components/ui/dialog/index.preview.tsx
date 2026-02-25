// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Dialog, DialogTrigger, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../dialog'
import { Button } from '../button'

export function Default() {
  const [open, setOpen] = createSignal(false)
  const handleAction = () => {}

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger>Open Dialog</DialogTrigger>
      <DialogOverlay />
      <DialogContent ariaLabelledby="dialog-title">
        <DialogHeader>
          <DialogTitle id="dialog-title">Dialog Title</DialogTitle>
          <DialogDescription>Dialog description here.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <Button onClick={handleAction}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

