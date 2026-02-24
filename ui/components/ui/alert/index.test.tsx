import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const alertSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Alert', () => {
  const result = renderToTest(alertSource, 'alert.tsx', 'Alert')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Alert', () => {
    expect(result.componentName).toBe('Alert')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div with data-slot=alert', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('alert')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('rounded-lg')
    expect(result.root.classes).toContain('border')
    expect(result.root.classes).toContain('grid')
  })
})

describe('AlertTitle', () => {
  const result = renderToTest(alertSource, 'alert.tsx', 'AlertTitle')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as h5 with data-slot=alert-title', () => {
    expect(result.root.tag).toBe('h5')
    expect(result.root.props['data-slot']).toBe('alert-title')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('font-medium')
    expect(result.root.classes).toContain('tracking-tight')
  })
})

describe('AlertDescription', () => {
  const result = renderToTest(alertSource, 'alert.tsx', 'AlertDescription')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('renders as div with data-slot=alert-description', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('alert-description')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('text-sm')
  })
})
