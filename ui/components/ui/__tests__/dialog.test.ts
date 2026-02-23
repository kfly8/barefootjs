import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, '../dialog.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Dialog (context provider — no DOM root, wraps children with Provider)
// ---------------------------------------------------------------------------

describe('Dialog', () => {
  const result = renderToTest(source, 'dialog.tsx', 'Dialog')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Dialog', () => {
    expect(result.componentName).toBe('Dialog')
  })
})

// ---------------------------------------------------------------------------
// DialogTrigger (conditional: asChild=span or button, click event)
// ---------------------------------------------------------------------------

describe('DialogTrigger', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogTrigger')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogTrigger', () => {
    expect(result.componentName).toBe('DialogTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains a button with data-slot=dialog-trigger', () => {
    const button = result.find({ tag: 'button', props: { 'data-slot': 'dialog-trigger' } })
    expect(button).not.toBeNull()
  })


})

// ---------------------------------------------------------------------------
// DialogOverlay (portaled overlay, data-state=closed)
// ---------------------------------------------------------------------------

describe('DialogOverlay', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogOverlay')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogOverlay', () => {
    expect(result.componentName).toBe('DialogOverlay')
  })

  test('root is a div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has data-slot=dialog-overlay', () => {
    expect(result.root.props['data-slot']).toBe('dialog-overlay')
  })

  test('root has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })
})

// ---------------------------------------------------------------------------
// DialogContent (portaled modal, role=dialog, aria-modal=true, data-state=closed)
// ---------------------------------------------------------------------------

describe('DialogContent', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogContent')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogContent', () => {
    expect(result.componentName).toBe('DialogContent')
  })

  test('root is a div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has role=dialog', () => {
    expect(result.root.role).toBe('dialog')
  })

  test('root has aria-modal=true', () => {
    expect(result.root.aria['modal']).toBe('true')
  })

  test('root has data-slot=dialog-content', () => {
    expect(result.root.props['data-slot']).toBe('dialog-content')
  })

  test('root has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })
})

// ---------------------------------------------------------------------------
// DialogHeader (layout container)
// ---------------------------------------------------------------------------

describe('DialogHeader', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogHeader')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogHeader', () => {
    expect(result.componentName).toBe('DialogHeader')
  })

  test('root is a div with data-slot=dialog-header', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('dialog-header')
  })
})

// ---------------------------------------------------------------------------
// DialogTitle (heading element)
// ---------------------------------------------------------------------------

describe('DialogTitle', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogTitle')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogTitle', () => {
    expect(result.componentName).toBe('DialogTitle')
  })

  test('root is h2 with data-slot=dialog-title', () => {
    expect(result.root.tag).toBe('h2')
    expect(result.root.props['data-slot']).toBe('dialog-title')
  })
})

// ---------------------------------------------------------------------------
// DialogDescription (description text)
// ---------------------------------------------------------------------------

describe('DialogDescription', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogDescription')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogDescription', () => {
    expect(result.componentName).toBe('DialogDescription')
  })

  test('root is p with data-slot=dialog-description', () => {
    expect(result.root.tag).toBe('p')
    expect(result.root.props['data-slot']).toBe('dialog-description')
  })
})

// ---------------------------------------------------------------------------
// DialogFooter (layout container for action buttons)
// ---------------------------------------------------------------------------

describe('DialogFooter', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogFooter')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogFooter', () => {
    expect(result.componentName).toBe('DialogFooter')
  })

  test('root is div with data-slot=dialog-footer', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('dialog-footer')
  })
})

// ---------------------------------------------------------------------------
// DialogClose (close button, click event)
// ---------------------------------------------------------------------------

describe('DialogClose', () => {
  const result = renderToTest(source, 'dialog.tsx', 'DialogClose')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is DialogClose', () => {
    expect(result.componentName).toBe('DialogClose')
  })

  test('root is button with data-slot=dialog-close', () => {
    expect(result.root.tag).toBe('button')
    expect(result.root.props['data-slot']).toBe('dialog-close')
  })
})
