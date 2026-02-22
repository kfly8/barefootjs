import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, '../progress.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Progress (stateful — currentValue signal, percentage/dataState memos)
// ---------------------------------------------------------------------------

describe('Progress', () => {
  const result = renderToTest(source, 'progress.tsx', 'Progress')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Progress', () => {
    expect(result.componentName).toBe('Progress')
  })

  test('has signal: controlledValue (createSignal)', () => {
    expect(result.signals).toContain('controlledValue')
  })

  test('currentValue, percentage and dataState are memos, not in signals', () => {
    expect(result.signals).not.toContain('currentValue')
    expect(result.signals).not.toContain('percentage')
    expect(result.signals).not.toContain('dataState')
  })

  test('root tag is div with data-slot=progress', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('progress')
  })

  test('root has role=progressbar', () => {
    const progressbar = result.find({ role: 'progressbar' })
    expect(progressbar).not.toBeNull()
  })

  test('root has aria-valuemin', () => {
    expect(result.root.aria).toHaveProperty('valuemin')
  })

  test('root has aria-valuemax', () => {
    expect(result.root.aria).toHaveProperty('valuemax')
  })

  test('root has aria-valuenow', () => {
    expect(result.root.aria).toHaveProperty('valuenow')
  })

  test('contains indicator with data-slot=progress-indicator', () => {
    const indicator = result.findAll({ tag: 'div' }).find(d => d.props['data-slot'] === 'progress-indicator')
    expect(indicator).not.toBeNull()
  })

  test('toStructure() contains progressbar and aria-valuenow', () => {
    const structure = result.toStructure()
    expect(structure).toContain('progressbar')
    expect(structure).toContain('aria-valuenow')
  })
})
