import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const popoverSource = readFileSync(resolve(__dirname, '../popover.tsx'), 'utf-8')

describe('Popover', () => {
  const result = renderToTest(popoverSource, 'popover.tsx', 'Popover')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Popover', () => {
    expect(result.componentName).toBe('Popover')
  })

  test('no signals (open state from props via context)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders a div with data-slot=popover', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('popover')
  })
})

describe('PopoverTrigger', () => {
  const result = renderToTest(popoverSource, 'popover.tsx', 'PopoverTrigger')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is PopoverTrigger', () => {
    expect(result.componentName).toBe('PopoverTrigger')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('has aria-expanded attribute', () => {
    const trigger = result.find({ tag: 'button' })
    expect(trigger).not.toBeNull()
    expect(trigger!.aria).toHaveProperty('expanded')
  })

})

describe('PopoverContent', () => {
  const result = renderToTest(popoverSource, 'popover.tsx', 'PopoverContent')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is PopoverContent', () => {
    expect(result.componentName).toBe('PopoverContent')
  })

  test('has data-slot=popover-content', () => {
    const div = result.find({ tag: 'div' })
    expect(div!.props['data-slot']).toBe('popover-content')
  })

  test('has data-state attribute', () => {
    const div = result.find({ tag: 'div' })!
    expect(div.dataState).not.toBeNull()
  })
})

describe('PopoverClose', () => {
  const result = renderToTest(popoverSource, 'popover.tsx', 'PopoverClose')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is PopoverClose', () => {
    expect(result.componentName).toBe('PopoverClose')
  })

  test('renders as <button>', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.props['data-slot']).toBe('popover-close')
  })

})
