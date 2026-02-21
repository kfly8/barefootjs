import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const collapsibleSource = readFileSync(resolve(__dirname, '../collapsible.tsx'), 'utf-8')

describe('Collapsible', () => {
  const result = renderToTest(collapsibleSource, 'collapsible.tsx', 'Collapsible')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Collapsible', () => {
    expect(result.componentName).toBe('Collapsible')
  })

  test('has signal: internalOpen (createSignal)', () => {
    expect(result.signals).toContain('internalOpen')
  })

  test('renders a div with data-slot=collapsible', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('collapsible')
  })

  test('has data-state attribute', () => {
    const div = result.find({ tag: 'div' })!
    expect(div.dataState).not.toBeNull()
  })
})

describe('CollapsibleTrigger', () => {
  const result = renderToTest(collapsibleSource, 'collapsible.tsx', 'CollapsibleTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is CollapsibleTrigger', () => {
    expect(result.componentName).toBe('CollapsibleTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('has button with aria-expanded', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.aria).toHaveProperty('expanded')
  })


})

describe('CollapsibleContent', () => {
  const result = renderToTest(collapsibleSource, 'collapsible.tsx', 'CollapsibleContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is CollapsibleContent', () => {
    expect(result.componentName).toBe('CollapsibleContent')
  })

  test('has role=region', () => {
    const region = result.find({ role: 'region' })
    expect(region).not.toBeNull()
  })

  test('has data-state attribute', () => {
    const region = result.find({ role: 'region' })!
    expect(region.dataState).not.toBeNull()
  })
})
