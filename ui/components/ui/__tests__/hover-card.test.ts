import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, '../hover-card.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// HoverCard (context-only root — Provider + div wrapper)
// ---------------------------------------------------------------------------

describe('HoverCard', () => {
  const result = renderToTest(source, 'hover-card.tsx', 'HoverCard')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is HoverCard', () => {
    expect(result.componentName).toBe('HoverCard')
  })

  test('contains div with data-slot=hover-card', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('hover-card')
  })
})

// ---------------------------------------------------------------------------
// HoverCardTrigger (asChild conditional, span with aria-expanded)
// ---------------------------------------------------------------------------

describe('HoverCardTrigger', () => {
  const result = renderToTest(source, 'hover-card.tsx', 'HoverCardTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is HoverCardTrigger', () => {
    expect(result.componentName).toBe('HoverCardTrigger')
  })

  test('root type is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains span with aria-expanded', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.aria).toHaveProperty('expanded')
  })

  test('that span has data-slot=hover-card-trigger', () => {
    const span = result.find({ tag: 'span' })!
    expect(span.props['data-slot']).toBe('hover-card-trigger')
  })
})

// ---------------------------------------------------------------------------
// HoverCardContent (portaled content, data-state=closed initially)
// ---------------------------------------------------------------------------

describe('HoverCardContent', () => {
  const result = renderToTest(source, 'hover-card.tsx', 'HoverCardContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is HoverCardContent', () => {
    expect(result.componentName).toBe('HoverCardContent')
  })

  test('root tag is div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('root has data-slot=hover-card-content', () => {
    expect(result.root.props['data-slot']).toBe('hover-card-content')
  })

  test('root has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })
})
