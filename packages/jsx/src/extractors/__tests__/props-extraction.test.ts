import { describe, test, expect } from 'bun:test'
import { extractComponentPropsWithTypes } from '../props'

describe('extractComponentPropsWithTypes with targetComponentName', () => {
  const source = `
import { createSignal } from '@barefootjs/dom'

function ToggleItem({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = createSignal(defaultOn)
  return (
    <div class="toggle-item">
      <span>{label}</span>
      <button onClick={() => setOn(!on())}>Toggle</button>
    </div>
  )
}

function Toggle() {
  return (
    <div class="settings-panel">
      <h3>Settings</h3>
      <ToggleItem label="Setting 1" defaultOn={true} />
    </div>
  )
}

export default Toggle
`

  test('extracts props for Toggle (should be empty)', () => {
    const props = extractComponentPropsWithTypes(source, 'Toggle.tsx', 'Toggle')
    expect(props).toEqual([])
  })

  test('extracts props for ToggleItem', () => {
    const props = extractComponentPropsWithTypes(source, 'Toggle.tsx', 'ToggleItem')
    expect(props.length).toBe(2)
    expect(props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
    expect(props).toContainEqual({ name: 'defaultOn', type: 'boolean', optional: true, defaultValue: 'false' })
  })
})
