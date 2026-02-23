import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const textareaSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Textarea', () => {
  const result = renderToTest(textareaSource, 'textarea.tsx', 'Textarea')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is Textarea', () => {
    expect(result.componentName).toBe('Textarea')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as <textarea>', () => {
    const textarea = result.find({ tag: 'textarea' })
    expect(textarea).not.toBeNull()
  })

  test('has data-slot=textarea', () => {
    const textarea = result.find({ tag: 'textarea' })
    expect(textarea!.props['data-slot']).toBe('textarea')
  })

  test('has resolved base CSS classes', () => {
    const textarea = result.find({ tag: 'textarea' })!
    expect(textarea.classes).toContain('w-full')
    expect(textarea.classes).toContain('rounded-md')
    expect(textarea.classes).toContain('border')
  })
})
