import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, '../alert-dialog.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// AlertDialog (context provider — no DOM root, wraps children with Provider)
// ---------------------------------------------------------------------------

describe('AlertDialog', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialog')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialog', () => {
    expect(result.componentName).toBe('AlertDialog')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogTrigger (conditional: asChild=span or button, click event)
// ---------------------------------------------------------------------------

describe('AlertDialogTrigger', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogTrigger', () => {
    expect(result.componentName).toBe('AlertDialogTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains a button with data-slot=alert-dialog-trigger', () => {
    const button = result.find({ tag: 'button', props: { 'data-slot': 'alert-dialog-trigger' } })
    expect(button).not.toBeNull()
  })


})

// ---------------------------------------------------------------------------
// AlertDialogOverlay (portaled overlay, no click-to-close, data-state=closed)
// ---------------------------------------------------------------------------

describe('AlertDialogOverlay', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogOverlay')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogOverlay', () => {
    expect(result.componentName).toBe('AlertDialogOverlay')
  })

  test('root is a div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has data-slot=alert-dialog-overlay', () => {
    expect(result.root.props['data-slot']).toBe('alert-dialog-overlay')
  })

  test('root has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogContent (portaled modal, role=alertdialog, aria-modal=true, data-state=closed)
// ---------------------------------------------------------------------------

describe('AlertDialogContent', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogContent', () => {
    expect(result.componentName).toBe('AlertDialogContent')
  })

  test('root is a div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has role=alertdialog', () => {
    expect(result.root.role).toBe('alertdialog')
  })

  test('root has aria-modal=true', () => {
    expect(result.root.aria['modal']).toBe('true')
  })

  test('root has data-slot=alert-dialog-content', () => {
    expect(result.root.props['data-slot']).toBe('alert-dialog-content')
  })

  test('root has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogHeader (layout container)
// ---------------------------------------------------------------------------

describe('AlertDialogHeader', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogHeader')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogHeader', () => {
    expect(result.componentName).toBe('AlertDialogHeader')
  })

  test('root is div with data-slot=alert-dialog-header', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('alert-dialog-header')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogTitle (heading element)
// ---------------------------------------------------------------------------

describe('AlertDialogTitle', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogTitle')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogTitle', () => {
    expect(result.componentName).toBe('AlertDialogTitle')
  })

  test('root is h2 with data-slot=alert-dialog-title', () => {
    expect(result.root.tag).toBe('h2')
    expect(result.root.props['data-slot']).toBe('alert-dialog-title')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogDescription (description text)
// ---------------------------------------------------------------------------

describe('AlertDialogDescription', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogDescription')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogDescription', () => {
    expect(result.componentName).toBe('AlertDialogDescription')
  })

  test('root is p with data-slot=alert-dialog-description', () => {
    expect(result.root.tag).toBe('p')
    expect(result.root.props['data-slot']).toBe('alert-dialog-description')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogFooter (layout container for action buttons)
// ---------------------------------------------------------------------------

describe('AlertDialogFooter', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogFooter')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogFooter', () => {
    expect(result.componentName).toBe('AlertDialogFooter')
  })

  test('root is div with data-slot=alert-dialog-footer', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('alert-dialog-footer')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogCancel (cancel button, closes dialog, click event)
// ---------------------------------------------------------------------------

describe('AlertDialogCancel', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogCancel')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogCancel', () => {
    expect(result.componentName).toBe('AlertDialogCancel')
  })

  test('root is button with data-slot=alert-dialog-cancel', () => {
    expect(result.root.tag).toBe('button')
    expect(result.root.props['data-slot']).toBe('alert-dialog-cancel')
  })
})

// ---------------------------------------------------------------------------
// AlertDialogAction (confirm button, triggers action, click event)
// ---------------------------------------------------------------------------

describe('AlertDialogAction', () => {
  const result = renderToTest(source, 'alert-dialog.tsx', 'AlertDialogAction')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is AlertDialogAction', () => {
    expect(result.componentName).toBe('AlertDialogAction')
  })

  test('root is button with data-slot=alert-dialog-action', () => {
    expect(result.root.tag).toBe('button')
    expect(result.root.props['data-slot']).toBe('alert-dialog-action')
  })
})
