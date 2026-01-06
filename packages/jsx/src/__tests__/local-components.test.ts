import { describe, test, expect } from 'bun:test'
import { extractLocalComponentFunctions } from '../extractors/local-components'
import { extractSignals } from '../extractors/signals'
import { extractMemos } from '../extractors/memos'
import { extractComponentPropsWithTypes } from '../extractors/props'
import { extractLocalFunctions } from '../extractors/local-functions'

describe('Same-file child component extraction', () => {
  const source = `
import { createSignal } from '@barefootjs/dom'

// Reusable toggle component with label
function ToggleItem({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = createSignal(defaultOn)
  const handleClick = () => setOn(!on())
  return (
    <div class="toggle-item">
      <span>{label}</span>
      <button onClick={handleClick}>{on() ? 'ON' : 'OFF'}</button>
    </div>
  )
}

// Settings panel with multiple toggles
function Toggle() {
  return (
    <div class="settings-panel">
      <h3>Settings</h3>
      <ToggleItem label="Setting 1" defaultOn={true} />
      <ToggleItem label="Setting 2" defaultOn={false} />
    </div>
  )
}

export default Toggle
`

  describe('extractLocalComponentFunctions', () => {
    test('extracts local component (ToggleItem) when main component is Toggle', () => {
      const localComponents = extractLocalComponentFunctions(source, 'Toggle.tsx', 'Toggle')
      expect(localComponents.length).toBe(1)
      expect(localComponents[0].name).toBe('ToggleItem')
      expect(localComponents[0].source).toContain('function ToggleItem')
    })

    test('does not extract main component as local', () => {
      const localComponents = extractLocalComponentFunctions(source, 'Toggle.tsx', 'Toggle')
      expect(localComponents.some(c => c.name === 'Toggle')).toBe(false)
    })
  })

  describe('extractSignals with targetComponentName', () => {
    test('extracts signals from ToggleItem only', () => {
      const signals = extractSignals(source, 'Toggle.tsx', 'ToggleItem')
      expect(signals.length).toBe(1)
      expect(signals[0].getter).toBe('on')
      expect(signals[0].setter).toBe('setOn')
    })

    test('extracts no signals from Toggle (has none)', () => {
      const signals = extractSignals(source, 'Toggle.tsx', 'Toggle')
      expect(signals.length).toBe(0)
    })
  })

  describe('extractMemos with targetComponentName', () => {
    const sourceWithMemo = `
import { createSignal, createMemo } from '@barefootjs/dom'

function Child() {
  const [count, setCount] = createSignal(0)
  const doubled = createMemo(() => count() * 2)
  return <div>{doubled()}</div>
}

function Parent() {
  return <div><Child /></div>
}

export default Parent
`

    test('extracts memos from Child only', () => {
      const memos = extractMemos(sourceWithMemo, 'Parent.tsx', 'Child')
      expect(memos.length).toBe(1)
      expect(memos[0].getter).toBe('doubled')
    })

    test('extracts no memos from Parent (has none)', () => {
      const memos = extractMemos(sourceWithMemo, 'Parent.tsx', 'Parent')
      expect(memos.length).toBe(0)
    })
  })

  describe('extractComponentPropsWithTypes with targetComponentName', () => {
    test('extracts props from ToggleItem only', () => {
      const result = extractComponentPropsWithTypes(source, 'Toggle.tsx', 'ToggleItem')
      expect(result.props.length).toBe(2)
      expect(result.props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
      expect(result.props).toContainEqual({ name: 'defaultOn', type: 'boolean', optional: true, defaultValue: 'false' })
      expect(result.restPropsName).toBeNull()
    })

    test('extracts no props from Toggle (has none)', () => {
      const result = extractComponentPropsWithTypes(source, 'Toggle.tsx', 'Toggle')
      expect(result.props.length).toBe(0)
      expect(result.restPropsName).toBeNull()
    })
  })

  describe('extractLocalFunctions with targetComponentName', () => {
    test('extracts local functions from ToggleItem only', () => {
      const signals = extractSignals(source, 'Toggle.tsx', 'ToggleItem')
      const localFns = extractLocalFunctions(source, 'Toggle.tsx', signals, 'ToggleItem')
      expect(localFns.length).toBe(1)
      expect(localFns[0].name).toBe('handleClick')
    })

    test('extracts no local functions from Toggle (has none)', () => {
      const signals = extractSignals(source, 'Toggle.tsx', 'Toggle')
      const localFns = extractLocalFunctions(source, 'Toggle.tsx', signals, 'Toggle')
      expect(localFns.length).toBe(0)
    })
  })
})
