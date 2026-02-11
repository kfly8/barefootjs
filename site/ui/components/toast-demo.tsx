"use client"
/**
 * ToastDemo Components
 *
 * Interactive demos for Toast component with enter/exit animations.
 * Used in toast documentation page.
 *
 * Animation lifecycle:
 * 1. show() → 'entering' → (rAF) → 'visible' → (duration) → dismiss()
 * 2. dismiss() → 'exiting' → (300ms) → 'hidden'
 */

import { createSignal } from '@barefootjs/dom'
import type { ToastAnimationState } from '@ui/components/ui/toast'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '@ui/components/ui/toast'
import { Button } from '@ui/components/ui/button'

// Animation duration in ms (must match CSS transition-duration)
const ANIMATION_DURATION = 300

/**
 * Basic toast demo with slide-in/slide-out animations
 */
export function ToastBasicDemo() {
  const [state, setState] = createSignal<ToastAnimationState>('hidden')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    // Clear existing timers
    if (dismissTimer) clearTimeout(dismissTimer)
    if (exitTimer) clearTimeout(exitTimer)

    // Start entering animation
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setState('visible')
      })
    })

    // Auto-dismiss after 5 seconds + animation time
    dismissTimer = setTimeout(() => dismiss(), 5000 + ANIMATION_DURATION)
  }

  const dismiss = () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
    const current = state()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      exitTimer = setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  return (
    <div>
      <Button onClick={show}>Show Toast</Button>
      <ToastProvider position="bottom-right">
        <Toast animationState={state()}>
          <div className="flex-1">
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>This is a basic toast message.</ToastDescription>
          </div>
          <ToastClose onClick={dismiss} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Success toast demo
 */
export function ToastSuccessDemo() {
  const [state, setState] = createSignal<ToastAnimationState>('hidden')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    if (dismissTimer) clearTimeout(dismissTimer)
    if (exitTimer) clearTimeout(exitTimer)
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setState('visible'))
    })
    dismissTimer = setTimeout(() => dismiss(), 5000 + ANIMATION_DURATION)
  }

  const dismiss = () => {
    if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
    const current = state()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      exitTimer = setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={show}>Show Success</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="success" animationState={state()}>
          <div className="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Your changes have been saved.</ToastDescription>
          </div>
          <ToastClose onClick={dismiss} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Error toast demo
 */
export function ToastErrorDemo() {
  const [state, setState] = createSignal<ToastAnimationState>('hidden')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    if (dismissTimer) clearTimeout(dismissTimer)
    if (exitTimer) clearTimeout(exitTimer)
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setState('visible'))
    })
    dismissTimer = setTimeout(() => dismiss(), 5000 + ANIMATION_DURATION)
  }

  const dismiss = () => {
    if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
    const current = state()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      exitTimer = setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  return (
    <div>
      <Button variant="destructive" onClick={show}>Show Error</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="error" animationState={state()}>
          <div className="flex-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Something went wrong. Please try again.</ToastDescription>
          </div>
          <ToastClose onClick={dismiss} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Warning toast demo
 */
export function ToastWarningDemo() {
  const [state, setState] = createSignal<ToastAnimationState>('hidden')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    if (dismissTimer) clearTimeout(dismissTimer)
    if (exitTimer) clearTimeout(exitTimer)
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setState('visible'))
    })
    dismissTimer = setTimeout(() => dismiss(), 5000 + ANIMATION_DURATION)
  }

  const dismiss = () => {
    if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
    const current = state()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      exitTimer = setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={show}>Show Warning</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="warning" animationState={state()}>
          <div className="flex-1">
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>Please review your input before proceeding.</ToastDescription>
          </div>
          <ToastClose onClick={dismiss} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Info toast demo
 */
export function ToastInfoDemo() {
  const [state, setState] = createSignal<ToastAnimationState>('hidden')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    if (dismissTimer) clearTimeout(dismissTimer)
    if (exitTimer) clearTimeout(exitTimer)
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setState('visible'))
    })
    dismissTimer = setTimeout(() => dismiss(), 5000 + ANIMATION_DURATION)
  }

  const dismiss = () => {
    if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
    const current = state()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      exitTimer = setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  return (
    <div>
      <Button variant="outline" onClick={show}>Show Info</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="info" animationState={state()}>
          <div className="flex-1">
            <ToastTitle>Info</ToastTitle>
            <ToastDescription>Here is some useful information.</ToastDescription>
          </div>
          <ToastClose onClick={dismiss} />
        </Toast>
      </ToastProvider>
    </div>
  )
}

/**
 * Toast with action demo
 */
export function ToastWithActionDemo() {
  const [state, setState] = createSignal<ToastAnimationState>('hidden')
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    if (dismissTimer) clearTimeout(dismissTimer)
    if (exitTimer) clearTimeout(exitTimer)
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setState('visible'))
    })
    // Longer duration for action toasts
    dismissTimer = setTimeout(() => dismiss(), 10000 + ANIMATION_DURATION)
  }

  const dismiss = () => {
    if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null }
    const current = state()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      exitTimer = setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  const handleUndo = () => {
    dismiss()
    // In a real app, this would trigger an undo action
  }

  return (
    <div>
      <Button onClick={show}>Show Toast with Action</Button>
      <ToastProvider position="bottom-right">
        <Toast animationState={state()}>
          <div className="flex-1">
            <ToastTitle>Item deleted</ToastTitle>
            <ToastDescription>The item has been removed from your list.</ToastDescription>
          </div>
          <div className="flex gap-2">
            <ToastAction altText="Undo deletion" onClick={handleUndo}>
              Undo
            </ToastAction>
            <ToastClose onClick={dismiss} />
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
  const [defaultState, setDefaultState] = createSignal<ToastAnimationState>('hidden')
  const [successState, setSuccessState] = createSignal<ToastAnimationState>('hidden')
  const [errorState, setErrorState] = createSignal<ToastAnimationState>('hidden')
  const [warningState, setWarningState] = createSignal<ToastAnimationState>('hidden')
  const [infoState, setInfoState] = createSignal<ToastAnimationState>('hidden')

  let defaultDismissTimer: ReturnType<typeof setTimeout> | null = null
  let successDismissTimer: ReturnType<typeof setTimeout> | null = null
  let errorDismissTimer: ReturnType<typeof setTimeout> | null = null
  let warningDismissTimer: ReturnType<typeof setTimeout> | null = null
  let infoDismissTimer: ReturnType<typeof setTimeout> | null = null

  const showToast = (
    setState: (s: ToastAnimationState) => void,
    getState: () => ToastAnimationState,
    dismissTimerRef: { value: ReturnType<typeof setTimeout> | null },
    duration: number
  ) => {
    if (dismissTimerRef.value) clearTimeout(dismissTimerRef.value)
    setState('entering')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setState('visible'))
    })
    dismissTimerRef.value = setTimeout(() => {
      dismissToast(setState, getState, dismissTimerRef)
    }, duration + ANIMATION_DURATION)
  }

  const dismissToast = (
    setState: (s: ToastAnimationState) => void,
    getState: () => ToastAnimationState,
    dismissTimerRef: { value: ReturnType<typeof setTimeout> | null }
  ) => {
    if (dismissTimerRef.value) { clearTimeout(dismissTimerRef.value); dismissTimerRef.value = null }
    const current = getState()
    if (current === 'visible' || current === 'entering') {
      setState('exiting')
      setTimeout(() => setState('hidden'), ANIMATION_DURATION)
    }
  }

  const defaultTimerRef = { value: defaultDismissTimer }
  const successTimerRef = { value: successDismissTimer }
  const errorTimerRef = { value: errorDismissTimer }
  const warningTimerRef = { value: warningDismissTimer }
  const infoTimerRef = { value: infoDismissTimer }

  const showAll = () => {
    showToast(setDefaultState, defaultState, defaultTimerRef, 5000)
    showToast(setSuccessState, successState, successTimerRef, 5000)
    showToast(setErrorState, errorState, errorTimerRef, 5000)
    showToast(setWarningState, warningState, warningTimerRef, 5000)
    showToast(setInfoState, infoState, infoTimerRef, 5000)
  }

  return (
    <div>
      <Button onClick={showAll}>Show All Variants</Button>
      <ToastProvider position="bottom-right">
        <Toast variant="default" animationState={defaultState()}>
          <div className="flex-1">
            <ToastTitle>Default</ToastTitle>
            <ToastDescription>This is a default toast.</ToastDescription>
          </div>
          <ToastClose onClick={() => dismissToast(setDefaultState, defaultState, defaultTimerRef)} />
        </Toast>
        <Toast variant="success" animationState={successState()}>
          <div className="flex-1">
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Operation completed successfully.</ToastDescription>
          </div>
          <ToastClose onClick={() => dismissToast(setSuccessState, successState, successTimerRef)} />
        </Toast>
        <Toast variant="error" animationState={errorState()}>
          <div className="flex-1">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>An error occurred.</ToastDescription>
          </div>
          <ToastClose onClick={() => dismissToast(setErrorState, errorState, errorTimerRef)} />
        </Toast>
        <Toast variant="warning" animationState={warningState()}>
          <div className="flex-1">
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>Please be careful.</ToastDescription>
          </div>
          <ToastClose onClick={() => dismissToast(setWarningState, warningState, warningTimerRef)} />
        </Toast>
        <Toast variant="info" animationState={infoState()}>
          <div className="flex-1">
            <ToastTitle>Info</ToastTitle>
            <ToastDescription>Here is some information.</ToastDescription>
          </div>
          <ToastClose onClick={() => dismissToast(setInfoState, infoState, infoTimerRef)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}
