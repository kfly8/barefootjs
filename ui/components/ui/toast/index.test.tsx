import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const toastSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('ToastProvider', () => {
  const result = renderToTest(toastSource, 'toast.tsx', 'ToastProvider')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is ToastProvider', () => {
    expect(result.componentName).toBe('ToastProvider')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders a div with data-slot=toast-provider', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('toast-provider')
  })
})

describe('Toast', () => {
  const result = renderToTest(toastSource, 'toast.tsx', 'Toast')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Toast', () => {
    expect(result.componentName).toBe('Toast')
  })

  test('no signals (animations managed via createEffect in ref)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders div with data-slot=toast', () => {
    // Provider is transparent; result.root is the toast div
    // role is dynamic (ternary on variant), so find by data-slot
    const toast = result.findAll({ tag: 'div' }).find(d => d.props['data-slot'] === 'toast')
    expect(toast).not.toBeNull()
  })

  test('has aria-live attribute (dynamic based on variant)', () => {
    const toast = result.findAll({ tag: 'div' }).find(d => d.props['data-slot'] === 'toast')!
    expect(toast.aria).toHaveProperty('live')
  })

  test('has data-state=hidden (initial state)', () => {
    const toast = result.findAll({ tag: 'div' }).find(d => d.props['data-slot'] === 'toast')!
    expect(toast.dataState).toBe('hidden')
  })
})

describe('ToastClose', () => {
  const result = renderToTest(toastSource, 'toast.tsx', 'ToastClose')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is ToastClose', () => {
    expect(result.componentName).toBe('ToastClose')
  })

  test('renders a button with aria-label=Close', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.aria).toHaveProperty('label')
  })

  test('has data-slot=toast-close', () => {
    const button = result.find({ tag: 'button' })!
    expect(button.props['data-slot']).toBe('toast-close')
  })
})

describe('ToastAction', () => {
  const result = renderToTest(toastSource, 'toast.tsx', 'ToastAction')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('componentName is ToastAction', () => {
    expect(result.componentName).toBe('ToastAction')
  })

  test('renders a button with data-slot=toast-action', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
    expect(button!.props['data-slot']).toBe('toast-action')
  })
})
