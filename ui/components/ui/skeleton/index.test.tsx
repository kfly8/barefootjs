import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const source = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Skeleton', () => {
  const result = renderToTest(source, 'skeleton.tsx', 'Skeleton')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Skeleton', () => {
    expect(result.componentName).toBe('Skeleton')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as div', () => {
    expect(result.root.tag).toBe('div')
  })

  test('has data-slot=skeleton', () => {
    expect(result.root.props['data-slot']).toBe('skeleton')
  })

  test('has resolved CSS classes: bg-muted, animate-pulse, rounded-md', () => {
    expect(result.root.classes).toContain('bg-muted')
    expect(result.root.classes).toContain('animate-pulse')
    expect(result.root.classes).toContain('rounded-md')
  })
})
