"use client"
/**
 * DialogDemo Components
 *
 * Interactive demos for Dialog component.
 * Used in dialog documentation page.
 */

import { createSignal, createEffect, onCleanup } from '@barefootjs/dom'
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
 * Delete confirmation dialog demo (GitHub-style)
 *
 * IMPORTANT: DialogContent uses portal (moves to document.body), which breaks
 * barefootjs scope-based element binding. Elements inside portaled content
 * must use direct DOM manipulation via createEffect.
 *
 * Pattern for portaled content:
 * 1. Use createEffect to wait for dialog to open
 * 2. Use getElementById to find elements (they're now in document.body)
 * 3. Attach handlers manually
 * 4. Clean up handlers on close using onCleanup
 */
export function DialogFormDemo() {
  const [open, setOpen] = createSignal(false)
  const projectName = 'my-project'

  const handleClose = () => {
    setOpen(false)
  }

  // Setup portaled element handlers when dialog opens
  createEffect(() => {
    if (!open()) return

    // Wait for portal to complete DOM move
    const timer = setTimeout(() => {
      const input = document.getElementById('confirm-project-name') as HTMLInputElement
      const deleteBtn = document.getElementById('delete-project-button') as HTMLButtonElement

      if (!input || !deleteBtn) return

      // Clear input on open
      input.value = ''
      deleteBtn.disabled = true

      // Input handler: update button disabled state
      const handleInput = () => {
        deleteBtn.disabled = input.value !== projectName
      }

      // Delete handler: close if confirmed
      const handleDelete = () => {
        if (input.value === projectName) {
          handleClose()
        }
      }

      input.addEventListener('input', handleInput)
      deleteBtn.addEventListener('click', handleDelete)

      // Cleanup when dialog closes
      onCleanup(() => {
        input.removeEventListener('input', handleInput)
        deleteBtn.removeEventListener('click', handleDelete)
      })
    }, 0)

    onCleanup(() => clearTimeout(timer))
  })

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete Project
      </button>
      <DialogOverlay open={open()} onClick={handleClose} />
      <DialogContent
        open={open()}
        onClose={handleClose}
        ariaLabelledby="delete-dialog-title"
        ariaDescribedby="delete-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="delete-dialog-title">Delete Project</DialogTitle>
          <DialogDescription id="delete-dialog-description">
            This action cannot be undone. This will permanently delete the <strong className="text-foreground">{projectName}</strong> project.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label for="confirm-project-name" className="text-sm text-muted-foreground">
            Please type <strong className="text-foreground">{projectName}</strong> to confirm.
          </label>
          <input
            id="confirm-project-name"
            type="text"
            placeholder={projectName}
            className="mt-2 flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <DialogFooter>
          <DialogClose onClick={handleClose}>Cancel</DialogClose>
          <button
            type="button"
            id="delete-project-button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
          >
            Delete Project
          </button>
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
        class="max-h-[66vh]"
      >
        <DialogHeader class="flex-shrink-0">
          <DialogTitle id="long-dialog-title">Terms of Service</DialogTitle>
          <DialogDescription id="long-dialog-description">
            Please read the following terms carefully.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4 overflow-y-auto flex-1 min-h-0">
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
        <DialogFooter class="flex-shrink-0">
          <DialogClose onClick={() => setOpen(false)}>Decline</DialogClose>
          <DialogTrigger onClick={() => setOpen(false)}>Accept</DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </div>
  )
}
