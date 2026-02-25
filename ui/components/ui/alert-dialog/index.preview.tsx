// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { AlertDialog, AlertDialogTrigger, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../alert-dialog'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <AlertDialog open={open()} onOpenChange={setOpen}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogOverlay />
      <AlertDialogContent ariaLabelledby="alert-title" ariaDescribedby="alert-desc">
        <AlertDialogHeader>
          <AlertDialogTitle id="alert-title">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription id="alert-desc">
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

