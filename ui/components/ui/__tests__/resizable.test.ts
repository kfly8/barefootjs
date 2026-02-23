import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const resizableSource = readFileSync(resolve(__dirname, '../resizable.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// ResizablePanelGroup (no signals — imperative DOM via ref)
// ---------------------------------------------------------------------------

describe('ResizablePanelGroup', () => {
  const result = renderToTest(resizableSource, 'resizable.tsx', 'ResizablePanelGroup')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ResizablePanelGroup', () => {
    expect(result.componentName).toBe('ResizablePanelGroup')
  })

  test('root tag is div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has data-slot=resizable-panel-group', () => {
    expect(result.root.props['data-slot']).toBe('resizable-panel-group')
  })

  test('root classes are present (direction-specific classes from dynamic lookup)', () => {
    // Classes like flex and h-full are inside a template literal with groupBaseClasses and direction check
    // The IR test doesn't resolve these complex expressions; just verify classes array is not empty
    expect(result.root.classes.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// ResizablePanel (stateless — overflow-hidden container)
// ---------------------------------------------------------------------------

describe('ResizablePanel', () => {
  const result = renderToTest(resizableSource, 'resizable.tsx', 'ResizablePanel')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ResizablePanel', () => {
    expect(result.componentName).toBe('ResizablePanel')
  })

  test('root tag is div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has data-slot=resizable-panel', () => {
    expect(result.root.props['data-slot']).toBe('resizable-panel')
  })

  test('root classes contain overflow-hidden', () => {
    expect(result.root.classes).toContain('overflow-hidden')
  })
})

// ---------------------------------------------------------------------------
// ResizableHandle (drag handle with role=separator and inactive state)
// ---------------------------------------------------------------------------

describe('ResizableHandle', () => {
  const result = renderToTest(resizableSource, 'resizable.tsx', 'ResizableHandle')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ResizableHandle', () => {
    expect(result.componentName).toBe('ResizableHandle')
  })

  test('root tag is div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root role is separator', () => {
    expect(result.root.role).toBe('separator')
  })

  test('root has data-slot=resizable-handle', () => {
    expect(result.root.props['data-slot']).toBe('resizable-handle')
  })

  test('root has data-resize-handle-state=inactive', () => {
    expect(result.root.props['data-resize-handle-state']).toBe('inactive')
  })
})
