"use client"
/**
 * DialogDemo Components
 *
 * Interactive demos for Dialog component.
 * Used in dialog documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@ui/components/ui/dialog'

/**
 * Basic dialog demo using the new shadcn/ui-style API
 */
export function DialogBasicDemo() {
  const [open, setOpen] = createSignal(false)

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger onClick={openDialog}>
        Open Dialog
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={closeDialog} />
      <DialogContent
        open={open()}
        onClose={closeDialog}
        ariaLabelledby="dialog-title"
        ariaDescribedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">Dialog Title</DialogTitle>
          <DialogDescription id="dialog-description">
            This is a basic dialog example. Press ESC, click outside, or use the X button to close.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-4">
          Dialog content goes here. You can add any content you need.
        </p>
        <DialogFooter>
          <DialogClose onClick={closeDialog}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dialog with form demo
 */
export function DialogFormDemo() {
  const [open, setOpen] = createSignal(false)

  const openDialog = () => setOpen(true)
  const closeDialog = () => setOpen(false)

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogTrigger onClick={openDialog}>
        Edit Profile
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={closeDialog} />
      <DialogContent
        open={open()}
        onClose={closeDialog}
        ariaLabelledby="form-dialog-title"
        ariaDescribedby="form-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="form-dialog-title">Edit Profile</DialogTitle>
          <DialogDescription id="form-dialog-description">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label for="name" className="text-right text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              className="col-span-3 flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label for="email" className="text-right text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="col-span-3 flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose onClick={closeDialog}>Cancel</DialogClose>
          <DialogTrigger onClick={closeDialog}>Save changes</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
