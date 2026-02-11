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
 * Default variant demo
 */
export function ToastDefaultDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Default</Button>
      <ToastProvider position="bottom-right">
        <Toast open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Event created</ToastTitle>
            <ToastDescription>Sunday, December 03, 2023 at 9:00 AM</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Success variant demo
 */
export function ToastSuccessDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Success</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="success" open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Changes saved</ToastTitle>
            <ToastDescription>Your changes have been saved successfully.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Error variant demo
 */
export function ToastErrorDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Error</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="error" open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Something went wrong</ToastTitle>
            <ToastDescription>There was a problem with your request.</ToastDescription>
          </div>
          <ToastAction altText="Try again">Try again</ToastAction>
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Warning variant demo
 */
export function ToastWarningDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Warning</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="warning" open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>Heads up</ToastTitle>
            <ToastDescription>You are about to exceed your storage limit.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Info variant demo
 */
export function ToastInfoDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>Info</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="info" open={open()} onOpenChange={setOpen}>
          <div className="flex-1">
            <ToastTitle>New update available</ToastTitle>
            <ToastDescription>A new version has been released.</ToastDescription>
          </div>
          <ToastClose />
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
 * Position demo — all 6 positions in one example
 */
export function ToastPositionDemo() {
  const [topLeft, setTopLeft] = createSignal(false)
  const [topCenter, setTopCenter] = createSignal(false)
  const [topRight, setTopRight] = createSignal(false)
  const [bottomLeft, setBottomLeft] = createSignal(false)
  const [bottomCenter, setBottomCenter] = createSignal(false)
  const [bottomRight, setBottomRight] = createSignal(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setTopLeft(true)}>Top Left</Button>
      <Button variant="outline" onClick={() => setTopCenter(true)}>Top Center</Button>
      <Button variant="outline" onClick={() => setTopRight(true)}>Top Right</Button>
      <Button variant="outline" onClick={() => setBottomLeft(true)}>Bottom Left</Button>
      <Button variant="outline" onClick={() => setBottomCenter(true)}>Bottom Center</Button>
      <Button variant="outline" onClick={() => setBottomRight(true)}>Bottom Right</Button>
      <ToastProvider position="top-left">
        <Toast open={topLeft()} onOpenChange={setTopLeft}>
          <div className="flex-1"><ToastDescription>Top Left</ToastDescription></div>
          <ToastClose />
        </Toast>
      </ToastProvider>
      <ToastProvider position="top-center">
        <Toast open={topCenter()} onOpenChange={setTopCenter}>
          <div className="flex-1"><ToastDescription>Top Center</ToastDescription></div>
          <ToastClose />
        </Toast>
      </ToastProvider>
      <ToastProvider position="top-right">
        <Toast open={topRight()} onOpenChange={setTopRight}>
          <div className="flex-1"><ToastDescription>Top Right</ToastDescription></div>
          <ToastClose />
        </Toast>
      </ToastProvider>
      <ToastProvider position="bottom-left">
        <Toast open={bottomLeft()} onOpenChange={setBottomLeft}>
          <div className="flex-1"><ToastDescription>Bottom Left</ToastDescription></div>
          <ToastClose />
        </Toast>
      </ToastProvider>
      <ToastProvider position="bottom-center">
        <Toast open={bottomCenter()} onOpenChange={setBottomCenter}>
          <div className="flex-1"><ToastDescription>Bottom Center</ToastDescription></div>
          <ToastClose />
        </Toast>
      </ToastProvider>
      <ToastProvider position="bottom-right">
        <Toast open={bottomRight()} onOpenChange={setBottomRight}>
          <div className="flex-1"><ToastDescription>Bottom Right</ToastDescription></div>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  )
}
