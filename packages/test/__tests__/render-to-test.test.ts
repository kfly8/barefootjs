import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '../src/index'

// Read real UI component sources
const uiDir = resolve(__dirname, '../../../ui/components/ui')
const buttonSource = readFileSync(resolve(uiDir, 'button.tsx'), 'utf-8')
const checkboxSource = readFileSync(resolve(uiDir, 'checkbox.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// Button (stateless — destructured props, no signals)
// ---------------------------------------------------------------------------

describe('Button', () => {
  const result = renderToTest(buttonSource, 'button.tsx')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Button', () => {
    expect(result.componentName).toBe('Button')
  })

  test('no signals (stateless component)', () => {
    expect(result.signals).toEqual([])
  })

  test('root is an if-statement (asChild branch)', () => {
    // Button has: if (asChild) return <Slot ...>; return <button ...>
    expect(result.root.type).toBe('conditional')
  })

  test('contains a <button> element', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
  })

  test('button has resolved base classes from constants', () => {
    const button = result.find({ tag: 'button' })!
    // Constants are resolved: baseClasses string is expanded,
    // variantClasses[variant] and sizeClasses[size] are unresolvable (skipped)
    expect(button.classes).toContain('inline-flex')
    expect(button.classes).toContain('items-center')
    expect(button.classes).toContain('rounded-md')
  })

  test('contains a Slot component for asChild', () => {
    const slot = result.find({ componentName: 'Slot' })
    expect(slot).not.toBeNull()
  })

  test('toStructure() returns non-empty string', () => {
    const structure = result.toStructure()
    expect(structure.length).toBeGreaterThan(0)
    expect(structure).toContain('button')
  })
})

// ---------------------------------------------------------------------------
// Checkbox (stateful — signals, events, aria)
// ---------------------------------------------------------------------------

describe('Checkbox', () => {
  const result = renderToTest(checkboxSource, 'checkbox.tsx')

  test('has no compiler errors', () => {
    const realErrors = result.errors.filter(e => e.code !== 'BF043')
    expect(realErrors).toEqual([])
  })

  test('isClient is true', () => {
    expect(result.isClient).toBe(true)
  })

  test('componentName is Checkbox', () => {
    expect(result.componentName).toBe('Checkbox')
  })

  test('has signals: internalChecked, controlledChecked', () => {
    expect(result.signals).toContain('internalChecked')
    expect(result.signals).toContain('controlledChecked')
  })

  test('renders as <button>', () => {
    const button = result.find({ tag: 'button' })
    expect(button).not.toBeNull()
  })

  test('has role=checkbox', () => {
    const button = result.find({ role: 'checkbox' })
    expect(button).not.toBeNull()
    expect(button!.tag).toBe('button')
  })

  test('has aria-checked attribute', () => {
    const button = result.find({ role: 'checkbox' })!
    expect(button.aria).toHaveProperty('checked')
  })

  test('has data-state attribute', () => {
    const button = result.find({ role: 'checkbox' })!
    expect(button.dataState).not.toBeNull()
  })

  test('has click event handler', () => {
    const button = result.find({ role: 'checkbox' })!
    expect(button.events).toContain('click')
  })

  test('contains conditional SVG child (checkmark)', () => {
    const svg = result.find({ tag: 'svg' })
    expect(svg).not.toBeNull()
  })

  test('toStructure() includes role and aria info', () => {
    const structure = result.toStructure()
    expect(structure).toContain('[role=checkbox]')
    expect(structure).toContain('[aria-checked]')
  })
})

// ---------------------------------------------------------------------------
// Error detection
// ---------------------------------------------------------------------------

describe('Error detection', () => {
  test('missing "use client" reports BF001', () => {
    const source = `
import { createSignal } from '@barefootjs/dom'

function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}

export { Counter }
`
    const result = renderToTest(source, 'counter.tsx')
    const errorCodes = result.errors.map(e => e.code)
    expect(errorCodes).toContain('BF001')
  })
})

// ---------------------------------------------------------------------------
// toStructure() snapshots
// ---------------------------------------------------------------------------

describe('toStructure()', () => {
  test('Button structure snapshot', () => {
    const result = renderToTest(buttonSource, 'button.tsx')
    const structure = result.toStructure()
    // Verify key structural elements are present
    expect(structure).toContain('button')
    expect(structure).toContain('<Slot>')
    // Tree connectors
    expect(structure).toMatch(/[├└]/)
  })

  test('Checkbox structure snapshot', () => {
    const result = renderToTest(checkboxSource, 'checkbox.tsx')
    const structure = result.toStructure()
    expect(structure).toContain('[role=checkbox]')
    expect(structure).toContain('[aria-checked]')
    expect(structure).toContain('(click)')
    expect(structure).toContain('svg')
    expect(structure).toContain('path')
  })
})
