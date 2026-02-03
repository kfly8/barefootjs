'use client'
/**
 * DialogExample - Simple Dialog Component
 *
 * Demonstrates a basic dialog for Echo/Go template SSR.
 * This is a simplified version without Portal - the portal
 * functionality is tested via unit tests in the adapter.
 */

import { createSignal } from '@barefootjs/dom'

export function DialogExample() {
  const [open, setOpen] = createSignal(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <div className="dialog-example">
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
        onClick={handleOpen}
      >
        Open Dialog
      </button>

      {open() && (
        <>
          <div
            data-slot="dialog-overlay"
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleClose}
          />
          <div
            data-slot="dialog-content"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold mb-2">Dialog Title</h2>
            <p className="text-gray-600 mb-4">
              This is a simple dialog example for Echo/Go template SSR.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 h-10 px-4 py-2"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DialogExample
