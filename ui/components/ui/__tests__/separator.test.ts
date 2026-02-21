import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, '../separator.tsx'), 'utf-8')

describe('Separator', () => {
  const result = renderToTest(source, 'separator.tsx', 'Separator')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Separator', () => {
    expect(result.componentName).toBe('Separator')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('has data-slot=separator', () => {
    expect(result.root.props['data-slot']).toBe('separator')
  })

  test('has data-orientation attribute', () => {
    // data-orientation is dynamic (resolved from orientation variable), just check it exists
    expect(result.root.props['data-orientation']).not.toBeUndefined()
  })

  test('has resolved CSS classes: bg-border and shrink-0', () => {
    expect(result.root.classes).toContain('bg-border')
    expect(result.root.classes).toContain('shrink-0')
  })
})
