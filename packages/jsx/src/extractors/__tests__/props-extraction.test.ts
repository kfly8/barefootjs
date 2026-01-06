import { describe, test, expect } from 'bun:test'
import { extractComponentPropsWithTypes, extractTypeDefinitions } from '../props'

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
    const result = extractComponentPropsWithTypes(source, 'Toggle.tsx', 'Toggle')
    expect(result.props).toEqual([])
    expect(result.typeRefName).toBeNull()
    expect(result.restPropsName).toBeNull()
  })

  test('extracts props for ToggleItem', () => {
    const result = extractComponentPropsWithTypes(source, 'Toggle.tsx', 'ToggleItem')
    expect(result.props.length).toBe(2)
    expect(result.props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
    expect(result.props).toContainEqual({ name: 'defaultOn', type: 'boolean', optional: true, defaultValue: 'false' })
    expect(result.typeRefName).toBeNull() // inline type literal
    expect(result.restPropsName).toBeNull()
  })
})

describe('extractComponentPropsWithTypes with type reference', () => {
  test('returns typeRefName for type alias', () => {
    const source = `
type ButtonProps = { label: string; variant?: 'primary' | 'secondary' }

function Button({ label, variant }: ButtonProps) {
  return <button class={variant}>{label}</button>
}
`
    const result = extractComponentPropsWithTypes(source, 'Button.tsx', 'Button')
    expect(result.typeRefName).toBe('ButtonProps')
    expect(result.props.length).toBe(2)
    expect(result.props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
    expect(result.props).toContainEqual({ name: 'variant', type: "'primary' | 'secondary'", optional: true, defaultValue: undefined })
  })

  test('returns typeRefName for interface', () => {
    const source = `
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary'
}

function Button({ label, variant }: ButtonProps) {
  return <button class={variant}>{label}</button>
}
`
    const result = extractComponentPropsWithTypes(source, 'Button.tsx', 'Button')
    expect(result.typeRefName).toBe('ButtonProps')
    expect(result.props.length).toBe(2)
    expect(result.props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
    expect(result.props).toContainEqual({ name: 'variant', type: "'primary' | 'secondary'", optional: true, defaultValue: undefined })
  })

  test('resolves interface with extends', () => {
    const source = `
interface BaseProps {
  id: string
}

interface ButtonProps extends BaseProps {
  label: string
}

function Button({ id, label }: ButtonProps) {
  return <button id={id}>{label}</button>
}
`
    const result = extractComponentPropsWithTypes(source, 'Button.tsx', 'Button')
    expect(result.typeRefName).toBe('ButtonProps')
    expect(result.props.length).toBe(2)
    expect(result.props).toContainEqual({ name: 'id', type: 'string', optional: false, defaultValue: undefined })
    expect(result.props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
  })

  test('handles intersection type alias', () => {
    const source = `
type BaseProps = { id: string }
type ButtonProps = BaseProps & { label: string }

function Button({ id, label }: ButtonProps) {
  return <button id={id}>{label}</button>
}
`
    const result = extractComponentPropsWithTypes(source, 'Button.tsx', 'Button')
    expect(result.typeRefName).toBe('ButtonProps')
    expect(result.props.length).toBe(2)
    expect(result.props).toContainEqual({ name: 'id', type: 'string', optional: false, defaultValue: undefined })
    expect(result.props).toContainEqual({ name: 'label', type: 'string', optional: false, defaultValue: undefined })
  })
})

describe('extractTypeDefinitions with interfaces', () => {
  test('extracts interface declarations', () => {
    const source = `
interface ButtonProps { variant?: string }
function Button({ variant }: ButtonProps) { return <button /> }
`
    const typeDefs = extractTypeDefinitions(source, 'Button.tsx', ['ButtonProps'])
    expect(typeDefs.length).toBe(1)
    expect(typeDefs[0]).toContain('interface ButtonProps')
    expect(typeDefs[0]).toContain("variant?: string")
  })

  test('extracts interface with extends (local parent)', () => {
    const source = `
interface BaseProps { id: string }
interface ButtonProps extends BaseProps { variant?: string }
function Button({ id, variant }: ButtonProps) { return <button /> }
`
    const typeDefs = extractTypeDefinitions(source, 'Button.tsx', ['ButtonProps'])
    expect(typeDefs.length).toBe(2)
    expect(typeDefs.some(t => t.includes('interface ButtonProps extends BaseProps'))).toBe(true)
    expect(typeDefs.some(t => t.includes('interface BaseProps'))).toBe(true)
  })

  test('does not extract external types in extends', () => {
    const source = `
import type { HTMLAttributes } from 'react'
interface ButtonProps extends HTMLAttributes<HTMLButtonElement> { variant?: string }
function Button({ variant }: ButtonProps) { return <button /> }
`
    const typeDefs = extractTypeDefinitions(source, 'Button.tsx', ['ButtonProps'])
    expect(typeDefs.length).toBe(1)
    expect(typeDefs[0]).toContain('extends HTMLAttributes<HTMLButtonElement>')
=======
    expect(result.restPropsName).toBeNull()
>>>>>>> ef101ff (WIP: CVA lookup map implementation for Button reactive variant/size)
  })
})
