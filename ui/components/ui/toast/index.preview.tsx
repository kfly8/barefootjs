// Auto-generated preview. Customize by editing this file.
"use client"

import { createSignal } from '@barefootjs/dom'
import { Toast, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from '../toast'
import { ToastProvider } from '../toast-provider'

export function Default() {
  const [open, setOpen] = createSignal(false)

  return (
    <ToastProvider position="bottom-right">
      <Toast open={open()} onOpenChange={setOpen}>
        <div className="flex-1">
          <ToastTitle>Success!</ToastTitle>
          <ToastDescription>Your changes have been saved.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
    </ToastProvider>
  )
}

