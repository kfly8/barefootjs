/**
 * IR tests for event callbacks on stateless components (Issue #467).
 *
 * Verifies that stateless child components can wire event callback props
 * to DOM events without requiring "use client".
 */

import { describe, test, expect } from 'bun:test'
import { renderToTest } from '../src/index'

describe('Event callbacks on stateless components', () => {
  test('stateless component with event-forwarding prop has click event in IR', () => {
    const source = `
interface SortHeaderProps {
  label: string
  onSort: () => void
}

export function SortHeader({ label, onSort }: SortHeaderProps) {
  return <th onClick={onSort}>{label}</th>
}
`
    const result = renderToTest(source, 'SortHeader.tsx')
    expect(result.errors).toHaveLength(0)
    expect(result.componentName).toBe('SortHeader')
    expect(result.isClient).toBe(false)

    const th = result.find({ tag: 'th' })
    expect(th).not.toBeNull()
    expect(th!.events).toContain('click')
  })

  test('stateless component with inline event handler has click event in IR', () => {
    const source = `
export function LogButton() {
  return <button onClick={() => console.log('clicked')}>Log</button>
}
`
    const result = renderToTest(source, 'LogButton.tsx')
    expect(result.errors).toHaveLength(0)
    expect(result.isClient).toBe(false)

    const btn = result.find({ tag: 'button' })
    expect(btn).not.toBeNull()
    expect(btn!.events).toContain('click')
  })

  test('stateless component without events has no events in IR', () => {
    const source = `
interface LabelProps {
  text: string
}

export function Label({ text }: LabelProps) {
  return <span>{text}</span>
}
`
    const result = renderToTest(source, 'Label.tsx')
    expect(result.errors).toHaveLength(0)

    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.events).toHaveLength(0)
  })

  test('no BF001 error for stateless event-only component', () => {
    const source = `
interface ClickableProps {
  onClick: () => void
  children: any
}

export function Clickable({ onClick, children }: ClickableProps) {
  return <div onClick={onClick}>{children}</div>
}
`
    const result = renderToTest(source, 'Clickable.tsx')
    const errorCodes = result.errors.map(e => e.code)
    expect(errorCodes).not.toContain('BF001')
  })
})
