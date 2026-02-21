import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const sheetSource = readFileSync(resolve(__dirname, '../sheet.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Sheet (Provider-only root — no DOM root, children manage own elements)
// ---------------------------------------------------------------------------

describe('Sheet', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'Sheet')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Sheet', () => {
    expect(result.componentName).toBe('Sheet')
  })

  test('no signals (open state comes from props)', () => {
    expect(result.signals).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// SheetTrigger (conditional asChild — button or span wrapper)
// ---------------------------------------------------------------------------

describe('SheetTrigger', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is SheetTrigger', () => {
    expect(result.componentName).toBe('SheetTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains a <button> with data-slot=sheet-trigger', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.props['data-slot']).toBe('sheet-trigger')
  })

  test('asChild branch uses span with display:contents', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.props['style']).toBe('display:contents')
    expect(span!.props['data-slot']).toBe('sheet-trigger')
  })
})

// ---------------------------------------------------------------------------
// SheetOverlay (portaled overlay, data-state=closed initially)
// ---------------------------------------------------------------------------

describe('SheetOverlay', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetOverlay')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is SheetOverlay', () => {
    expect(result.componentName).toBe('SheetOverlay')
  })

  test('renders as div with data-slot=sheet-overlay', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('sheet-overlay')
  })

  test('has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('fixed')
    expect(result.root.classes).toContain('inset-0')
    expect(result.root.classes).toContain('z-50')
  })
})

// ---------------------------------------------------------------------------
// SheetContent (portaled dialog panel, role=dialog, aria-modal, built-in close button)
// ---------------------------------------------------------------------------

describe('SheetContent', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is SheetContent', () => {
    expect(result.componentName).toBe('SheetContent')
  })

  test('renders as div with role=dialog', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('dialog')
  })

  test('has aria-modal=true', () => {
    expect(result.root.aria['modal']).toBe('true')
  })

  test('has data-slot=sheet-content', () => {
    expect(result.root.props['data-slot']).toBe('sheet-content')
  })

  test('has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })

  test('has base classes (non-side-specific)', () => {
    // Side-specific classes (fixed, inset-y-0, right-0, etc.) come from a dynamic lookup
    // and are not statically resolvable in IR tests
    expect(result.root.classes).toContain('z-50')
    expect(result.root.classes).toContain('flex-col')
    expect(result.root.classes).toContain('bg-background')
    expect(result.root.classes).toContain('shadow-lg')
  })

  test('contains built-in close button (X)', () => {
    const closeButton = result.find({ tag: 'button' })
    expect(closeButton).not.toBeNull()
    expect(closeButton!.props['data-slot']).toBe('sheet-close-button')
  })
})

// ---------------------------------------------------------------------------
// SheetHeader / SheetFooter / SheetTitle / SheetDescription (stateless)
// ---------------------------------------------------------------------------

describe('SheetHeader', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetHeader')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=sheet-header', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('sheet-header')
  })
})

describe('SheetTitle', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetTitle')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as h2 with data-slot=sheet-title', () => {
    expect(result.root.tag).toBe('h2')
    expect(result.root.props['data-slot']).toBe('sheet-title')
  })
})

describe('SheetDescription', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetDescription')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as p with data-slot=sheet-description', () => {
    expect(result.root.tag).toBe('p')
    expect(result.root.props['data-slot']).toBe('sheet-description')
  })
})

describe('SheetFooter', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetFooter')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=sheet-footer', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('sheet-footer')
  })
})

// ---------------------------------------------------------------------------
// SheetClose (close button, reads context on mount)
// ---------------------------------------------------------------------------

describe('SheetClose', () => {
  const result = renderToTest(sheetSource, 'sheet.tsx', 'SheetClose')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is SheetClose', () => {
    expect(result.componentName).toBe('SheetClose')
  })

  test('renders as button with data-slot=sheet-close', () => {
    expect(result.root.tag).toBe('button')
    expect(result.root.props['data-slot']).toBe('sheet-close')
  })

  test('has type=button', () => {
    expect(result.root.props['type']).toBe('button')
  })
})
