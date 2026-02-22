import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const spinnerSource = readFileSync(resolve(__dirname, '../spinner.tsx'), 'utf-8')

describe('Spinner', () => {
  const result = renderToTest(spinnerSource, 'spinner.tsx', 'Spinner')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Spinner', () => {
    expect(result.componentName).toBe('Spinner')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('root is an SVG element with data-slot=spinner', () => {
    const svg = result.find({ tag: 'svg' })
    expect(svg).not.toBeNull()
    expect(svg!.props['data-slot']).toBe('spinner')
  })

  test('has role=status for accessibility', () => {
    const svg = result.find({ tag: 'svg' }) as any
    expect(svg.role).toBe('status')
  })

  test('has aria-label for accessibility', () => {
    const svg = result.find({ tag: 'svg' }) as any
    expect(svg.aria).toEqual({ label: 'Loading' })
  })

  test('has animate-spin in class template', () => {
    const svg = result.find({ tag: 'svg' })!
    const classStr = svg.classes.join(' ')
    expect(classStr).toContain('animate-spin')
  })
})
