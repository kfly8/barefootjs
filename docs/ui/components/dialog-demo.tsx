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
} from '@ui/components/ui/dialog'

/**
 * Create task dialog demo - typical dialog with form
 */
export function DialogBasicDemo() {
  const [open, setOpen] = createSignal(false)

  // Open dialog and schedule focus
  const openDialog = () => {
    setOpen(true)
    setTimeout(() => {
      const scope = document.querySelector('[data-bf-scope^="DialogBasicDemo_"]')
      const dialog = scope?.querySelector('[role="dialog"]')
      if (dialog) (dialog as HTMLElement).focus()
    }, 10)
  }

  // Close dialog and return focus to trigger
  const closeDialog = () => {
    setOpen(false)
    setTimeout(() => {
      const scope = document.querySelector('[data-bf-scope^="DialogBasicDemo_"]')
      const trigger = scope?.querySelector('button')
      if (trigger) trigger.focus()
    }, 10)
  }

  return (
    <div>
      <DialogTrigger onClick={openDialog}>
        Create Task
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={closeDialog} />
      <DialogContent
        open={open()}
        onClose={closeDialog}
        ariaLabelledby="dialog-title"
        ariaDescribedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">Create New Task</DialogTitle>
          <DialogDescription id="dialog-description">
            Add a new task to your list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label for="task-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="Enter task title"
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="grid gap-2">
            <label for="task-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="task-description"
              placeholder="Enter task description (optional)"
              rows={3}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose onClick={closeDialog}>Cancel</DialogClose>
          <DialogTrigger onClick={closeDialog}>Create</DialogTrigger>
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
          <DialogClose onClick={() => setOpen(false)}>Cancel</DialogClose>
          <DialogTrigger onClick={() => setOpen(false)}>Save changes</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}

/**
 * Dialog with long content demo
 */
export function DialogLongContentDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <DialogTrigger onClick={() => setOpen(true)}>
        Open Long Content Dialog
      </DialogTrigger>
      <DialogOverlay open={open()} onClick={() => setOpen(false)} />
      <DialogContent
        open={open()}
        onClose={() => setOpen(false)}
        ariaLabelledby="long-dialog-title"
        ariaDescribedby="long-dialog-description"
        class="max-h-80"
      >
        <DialogHeader>
          <DialogTitle id="long-dialog-title">Terms of Service</DialogTitle>
          <DialogDescription id="long-dialog-description">
            Please read the following terms carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
          </p>
          <p>
            Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?
          </p>
          <p>
            Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
          </p>
        </div>
        <DialogFooter>
          <DialogClose onClick={() => setOpen(false)}>Decline</DialogClose>
          <DialogTrigger onClick={() => setOpen(false)}>Accept</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}
