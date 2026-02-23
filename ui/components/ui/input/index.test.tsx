import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const inputSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Input', () => {
  const result = renderToTest(inputSource, 'input.tsx', 'Input')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Input', () => {
    expect(result.componentName).toBe('Input')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as <input>', () => {
    const input = result.find({ tag: 'input' })
    expect(input).not.toBeNull()
  })

  test('has data-slot=input', () => {
    const input = result.find({ tag: 'input' })
    expect(input!.props['data-slot']).toBe('input')
  })

  test('has resolved base CSS classes', () => {
    const input = result.find({ tag: 'input' })!
    expect(input.classes).toContain('h-9')
    expect(input.classes).toContain('w-full')
    expect(input.classes).toContain('rounded-md')
    expect(input.classes).toContain('border')
  })
})
