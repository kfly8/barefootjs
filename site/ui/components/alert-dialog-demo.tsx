"use client"
/**
 * AlertDialogDemo Components
 *
 * Interactive demos for AlertDialog component.
 * Used in alert-dialog documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@ui/components/ui/alert-dialog'

/**
 * Basic alert dialog demo - simple confirmation
 */
export function AlertDialogBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogTrigger>
          Show Dialog
        </AlertDialogTrigger>
        <AlertDialogOverlay />
        <AlertDialogContent
          ariaLabelledby="alert-basic-title"
          ariaDescribedby="alert-basic-description"
        >
          <AlertDialogHeader>
            <AlertDialogTitle id="alert-basic-title">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription id="alert-basic-description">
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Destructive alert dialog demo - delete confirmation with red styling
 */
export function AlertDialogDestructiveDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <AlertDialog open={open()} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Account
          </button>
        </AlertDialogTrigger>
        <AlertDialogOverlay />
        <AlertDialogContent
          ariaLabelledby="alert-destructive-title"
          ariaDescribedby="alert-destructive-description"
        >
          <AlertDialogHeader>
            <AlertDialogTitle id="alert-destructive-title">Delete Account</AlertDialogTitle>
            <AlertDialogDescription id="alert-destructive-description">
              Are you sure you want to delete your account? All of your data
              will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
