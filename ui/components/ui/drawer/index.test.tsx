import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const drawerSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Drawer (Provider-only root — no DOM root, children manage own elements)
// ---------------------------------------------------------------------------

describe('Drawer', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'Drawer')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Drawer', () => {
    expect(result.componentName).toBe('Drawer')
  })

  test('no signals (open state comes from props)', () => {
    expect(result.signals).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// DrawerTrigger (conditional asChild — button or span wrapper)
// ---------------------------------------------------------------------------

describe('DrawerTrigger', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DrawerTrigger', () => {
    expect(result.componentName).toBe('DrawerTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains a <button> with data-slot=drawer-trigger', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.props['data-slot']).toBe('drawer-trigger')
  })

  test('asChild branch uses span with display:contents', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.props['style']).toBe('display:contents')
    expect(span!.props['data-slot']).toBe('drawer-trigger')
  })
})

// ---------------------------------------------------------------------------
// DrawerOverlay (portaled overlay, data-state=closed initially)
// ---------------------------------------------------------------------------

describe('DrawerOverlay', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerOverlay')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DrawerOverlay', () => {
    expect(result.componentName).toBe('DrawerOverlay')
  })

  test('renders as div with data-slot=drawer-overlay', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('drawer-overlay')
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
// DrawerContent (portaled dialog panel, role=dialog, aria-modal, data-state)
// ---------------------------------------------------------------------------

describe('DrawerContent', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DrawerContent', () => {
    expect(result.componentName).toBe('DrawerContent')
  })

  test('renders as div with role=dialog', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('dialog')
  })

  test('has aria-modal=true', () => {
    expect(result.root.aria['modal']).toBe('true')
  })

  test('has data-slot=drawer-content', () => {
    expect(result.root.props['data-slot']).toBe('drawer-content')
  })

  test('has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })

  test('has base classes (non-direction-specific)', () => {
    // Direction-specific classes (fixed, inset-x-0, bottom-0, etc.) come from a dynamic lookup
    // and are not statically resolvable in IR tests
    expect(result.root.classes).toContain('z-50')
    expect(result.root.classes).toContain('flex-col')
    expect(result.root.classes).toContain('bg-background')
    expect(result.root.classes).toContain('shadow-lg')
  })
})

// ---------------------------------------------------------------------------
// DrawerHandle (decorative bar indicator)
// ---------------------------------------------------------------------------

describe('DrawerHandle', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerHandle')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DrawerHandle', () => {
    expect(result.componentName).toBe('DrawerHandle')
  })

  test('renders as div with data-slot=drawer-handle', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('drawer-handle')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('rounded-full')
    expect(result.root.classes).toContain('bg-muted')
  })
})

// ---------------------------------------------------------------------------
// DrawerHeader / DrawerFooter / DrawerTitle / DrawerDescription (stateless)
// ---------------------------------------------------------------------------

describe('DrawerHeader', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerHeader')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=drawer-header', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('drawer-header')
  })
})

describe('DrawerTitle', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerTitle')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as h2 with data-slot=drawer-title', () => {
    expect(result.root.tag).toBe('h2')
    expect(result.root.props['data-slot']).toBe('drawer-title')
  })
})

describe('DrawerDescription', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerDescription')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as p with data-slot=drawer-description', () => {
    expect(result.root.tag).toBe('p')
    expect(result.root.props['data-slot']).toBe('drawer-description')
  })
})

describe('DrawerFooter', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerFooter')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('renders as div with data-slot=drawer-footer', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('drawer-footer')
  })
})

// ---------------------------------------------------------------------------
// DrawerClose (close button, reads context on mount)
// ---------------------------------------------------------------------------

describe('DrawerClose', () => {
  const result = renderToTest(drawerSource, 'drawer.tsx', 'DrawerClose')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is DrawerClose', () => {
    expect(result.componentName).toBe('DrawerClose')
  })

  test('renders as button with data-slot=drawer-close', () => {
    expect(result.root.tag).toBe('button')
    expect(result.root.props['data-slot']).toBe('drawer-close')
  })

  test('has type=button', () => {
    expect(result.root.props['type']).toBe('button')
  })
})
