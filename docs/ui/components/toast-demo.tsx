"use client"
/**
 * ToastDemo Components
 *
 * Interactive demos for Toast component.
 * Animation is managed internally by Toast via createEffect.
 */

import { createSignal } from '@barefootjs/dom'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '@ui/components/ui/toast'
import { Button } from '@ui/components/ui/button'

/**
 * Simple toast demo — minimal notification
 */
export function ToastSimpleDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Add to calendar</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastDescription>Event has been created.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Toast with title demo — title + description notification
 */
export function ToastWithTitleDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Show Notification</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>Your changes have been saved successfully.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Destructive toast demo — error variant with action
 */
export function ToastDestructiveDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="destructive" onClick={() => setOpen(true)}>Show Error</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="error" open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Uh oh! Something went wrong.</ToastTitle>
            <ToastDescription>There was a problem with your request.</ToastDescription>
          </div>
          <ToastAction altText="Try again">Try again</ToastAction>
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Toast with action demo — undo pattern
 */
export function ToastWithActionDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Delete Item</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen} duration={10000}>
          <div className="flex-1">
            <ToastTitle>Item deleted</ToastTitle>
            <ToastDescription>The item has been removed from your list.</ToastDescription>
          </div>
          <div className="flex gap-2">
            <ToastAction altText="Undo deletion">Undo</ToastAction>
            <ToastClose />
          </div>
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * All variants demo — for preview at top of page
 */
export function ToastVariantsDemo() {
  const [defaultOpen, setDefaultOpen] = createSignal(false)
  const [successOpen, setSuccessOpen] = createSignal(false)
  const [errorOpen, setErrorOpen] = createSignal(false)
  const [warningOpen, setWarningOpen] = createSignal(false)
  const [infoOpen, setInfoOpen] = createSignal(false)

  const showAll = () => {
    setDefaultOpen(true)
    setSuccessOpen(true)
    setErrorOpen(true)
    setWarningOpen(true)
    setInfoOpen(true)
  }

  return (
    <div>
      <Button onClick={showAll}>Show All Variants</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="default" open={defaultOpen()} onOpenChange={setDefaultOpen}>
          <div className="flex-1">
            <ToastTitle>Default</ToastTitle>
            <ToastDescription>This is a default toast.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <Toast variant="success" open={successOpen()} onOpenChange={setSuccessOpen}>
          <div className="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Operation completed successfully.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <Toast variant="error" open={errorOpen()} onOpenChange={setErrorOpen}>
          <div className="flex-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>An error occurred.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <Toast variant="warning" open={warningOpen()} onOpenChange={setWarningOpen}>
          <div className="flex-1">
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>Please be careful.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <Toast variant="info" open={infoOpen()} onOpenChange={setInfoOpen}>
          <div className="flex-1">
            <ToastTitle>Info</ToastTitle>
            <ToastDescription>Here is some information.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}
