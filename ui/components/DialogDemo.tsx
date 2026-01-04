"use client"
/**
 * DialogDemo Components
 *
 * Interactive demos for Dialog component.
 * Used in dialog documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './Dialog'

/**
 * Basic dialog demo
 */
export function DialogBasicDemo() {
  const [open, setOpen] = createSignal(false)

  // Open dialog and schedule focus
  const openDialog = () => {
    setOpen(true)
    setTimeout(() => {
      const scope = document.querySelector('[data-bf-scope="DialogBasicDemo"]')
      const dialog = scope?.querySelector('[data-dialog-content]')
      if (dialog) (dialog as HTMLElement).focus()
    }, 10)
  }

  // Close dialog and return focus to trigger
  const closeDialog = () => {
    setOpen(false)
    setTimeout(() => {
      const scope = document.querySelector('[data-bf-scope="DialogBasicDemo"]')
      const trigger = scope?.querySelector('button')
      if (trigger) trigger.focus()
    }, 10)
  }

  return (
    <div>
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
            This is a basic dialog example. Press ESC or click outside to close.
          </DialogDescription>
        </DialogHeader>
        <p class="text-sm text-zinc-600 py-4">
          Dialog content goes here. You can add any content you need.
        </p>
        <DialogFooter>
          <DialogClose onClick={closeDialog}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}

/**
 * Dialog with form demo
 */
export function DialogFormDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DialogTrigger onClick={() => setOpen(true)}>
        Edit Profile
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={() => setOpen(false)} />
      <DialogContent
        open={open()}
        onClose={() => setOpen(false)}
        ariaLabelledby="form-dialog-title"
        ariaDescribedby="form-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="form-dialog-title">Edit Profile</DialogTitle>
          <DialogDescription id="form-dialog-description">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="name" class="text-right text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              class="col-span-3 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <label for="email" class="text-right text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              class="col-span-3 flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
          <DialogTrigger onClick={() => setOpen(false)}>Save changes</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}
