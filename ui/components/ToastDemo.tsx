"use client"
/**
 * ToastDemo Components
 *
 * Interactive demos for Toast component.
 * Used in toast documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './Toast'
import { Button } from './Button'

/**
 * Basic toast demo
 */
export function ToastBasicDemo() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 5000)
  }

  return (
    <div>
      <Button onClick={showToast}>Show Toast</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()}>
          <div class="flex-1">
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>This is a basic toast message.</ToastDescription>
          </div>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Success toast demo
 */
export function ToastSuccessDemo() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 5000)
  }

  return (
    <div>
      <Button variant="outline" onClick={showToast}>Show Success</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="success" open={open()}>
          <div class="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Your changes have been saved.</ToastDescription>
          </div>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Error toast demo
 */
export function ToastErrorDemo() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 5000)
  }

  return (
    <div>
      <Button variant="destructive" onClick={showToast}>Show Error</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="error" open={open()}>
          <div class="flex-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Something went wrong. Please try again.</ToastDescription>
          </div>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Warning toast demo
 */
export function ToastWarningDemo() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 5000)
  }

  return (
    <div>
      <Button variant="outline" onClick={showToast}>Show Warning</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="warning" open={open()}>
          <div class="flex-1">
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>Please review your input before proceeding.</ToastDescription>
          </div>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Info toast demo
 */
export function ToastInfoDemo() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 5000)
  }

  return (
    <div>
      <Button variant="outline" onClick={showToast}>Show Info</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="info" open={open()}>
          <div class="flex-1">
            <ToastTitle>Info</ToastTitle>
            <ToastDescription>Here is some useful information.</ToastDescription>
          </div>
          <ToastClose onClick={() => setOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Toast with action demo
 */
export function ToastWithActionDemo() {
  const [open, setOpen] = createSignal(false)

  const showToast = () => {
    setOpen(true)
    setTimeout(() => setOpen(false), 10000)
  }

  const handleUndo = () => {
    setOpen(false)
    // In a real app, this would trigger an undo action
  }

  return (
    <div>
      <Button onClick={showToast}>Show Toast with Action</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()}>
          <div class="flex-1">
            <ToastTitle>Item deleted</ToastTitle>
            <ToastDescription>The item has been removed from your list.</ToastDescription>
          </div>
          <div class="flex gap-2">
            <ToastAction altText="Undo deletion" onClick={handleUndo}>
              Undo
            </ToastAction>
            <ToastClose onClick={() => setOpen(false)} />
          </div>
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * All variants demo - for preview at top of page
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
    setTimeout(() => {
      setDefaultOpen(false)
      setSuccessOpen(false)
      setErrorOpen(false)
      setWarningOpen(false)
      setInfoOpen(false)
    }, 5000)
  }

  return (
    <div>
      <Button onClick={showAll}>Show All Variants</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="default" open={defaultOpen()}>
          <div class="flex-1">
            <ToastTitle>Default</ToastTitle>
            <ToastDescription>This is a default toast.</ToastDescription>
          </div>
          <ToastClose onClick={() => setDefaultOpen(false)} />
        </Toast>
        <Toast variant="success" open={successOpen()}>
          <div class="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Operation completed successfully.</ToastDescription>
          </div>
          <ToastClose onClick={() => setSuccessOpen(false)} />
        </Toast>
        <Toast variant="error" open={errorOpen()}>
          <div class="flex-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>An error occurred.</ToastDescription>
          </div>
          <ToastClose onClick={() => setErrorOpen(false)} />
        </Toast>
        <Toast variant="warning" open={warningOpen()}>
          <div class="flex-1">
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>Please be careful.</ToastDescription>
          </div>
          <ToastClose onClick={() => setWarningOpen(false)} />
        </Toast>
        <Toast variant="info" open={infoOpen()}>
          <div class="flex-1">
            <ToastTitle>Info</ToastTitle>
            <ToastDescription>Here is some information.</ToastDescription>
          </div>
          <ToastClose onClick={() => setInfoOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}
