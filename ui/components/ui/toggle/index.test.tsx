import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const toggleSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Toggle', () => {
  const result = renderToTest(toggleSource, 'toggle.tsx', 'Toggle')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Toggle', () => {
    expect(result.componentName).toBe('Toggle')
  })

  test('has signals: internalPressed, controlledPressed', () => {
    expect(result.signals).toContain('internalPressed')
    expect(result.signals).toContain('controlledPressed')
  })

  test('root tag is button', () => {
    expect(result.root.tag).toBe('button')
  })

  test('root has data-slot=toggle', () => {
    expect(result.root.props['data-slot']).toBe('toggle')
  })

  test('root has aria-pressed attribute', () => {
    expect(result.root.aria).toHaveProperty('pressed')
  })

  test('root has data-state attribute', () => {
    expect(result.root.dataState).not.toBeNull()
  })

  test('root has click event handler', () => {
    expect(result.root.events).toContain('click')
  })

  test('root classes contain inline-flex', () => {
    expect(result.root.classes).toContain('inline-flex')
  })
})
