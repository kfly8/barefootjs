/**
 * Unit tests for getControlledPropName() — controlled prop detection.
 *
 * Verifies that createSignal initializers referencing props are correctly
 * identified so the compiler generates sync effects for controlled components.
 */

import { describe, test, expect } from 'bun:test'
import { getControlledPropName } from '../ir-to-client-js/prop-handling'
import type { ParamInfo, SignalInfo, TypeInfo } from '../types'

const boolType: TypeInfo = { kind: 'primitive', raw: 'boolean', primitive: 'boolean' }
const strType: TypeInfo = { kind: 'primitive', raw: 'string', primitive: 'string' }
const numType: TypeInfo = { kind: 'primitive', raw: 'number', primitive: 'number' }
const loc = { file: 'test.tsx', start: { line: 1, column: 0 }, end: { line: 1, column: 0 } }

function makeSignal(initialValue: string): SignalInfo {
  return {
    getter: 'value',
    setter: 'setValue',
    initialValue,
    type: strType,
    loc,
  }
}

const propsParams: ParamInfo[] = [
  { name: 'checked', type: boolType, optional: true },
  { name: 'value', type: strType, optional: true },
  { name: 'initial', type: numType, optional: true },
  { name: 'defaultChecked', type: boolType, optional: true },
  { name: 'defaultValue', type: strType, optional: true },
]

describe('getControlledPropName', () => {
  test('direct props.xxx reference', () => {
    expect(getControlledPropName(makeSignal('props.checked'), propsParams)).toBe('checked')
  })

  test('props.xxx ?? default (bug fix: #434)', () => {
    expect(getControlledPropName(makeSignal('props.initial ?? 0'), propsParams)).toBe('initial')
  })

  test('props.xxx ?? string default (bug fix: #434)', () => {
    expect(getControlledPropName(makeSignal("props.value ?? ''"), propsParams)).toBe('value')
  })

  test('props.xxx || fallback', () => {
    expect(getControlledPropName(makeSignal("props.value || ''"), propsParams)).toBe('value')
  })

  test('default-prefixed prop is excluded', () => {
    expect(getControlledPropName(makeSignal('props.defaultChecked'), propsParams)).toBeNull()
  })

  test('default-prefixed prop with ?? is excluded', () => {
    expect(getControlledPropName(makeSignal('props.defaultChecked ?? false'), propsParams)).toBeNull()
  })

  test('destructured prop name', () => {
    expect(getControlledPropName(makeSignal('checked'), propsParams)).toBe('checked')
  })

  test('destructured prop with ?? fallback', () => {
    expect(getControlledPropName(makeSignal('checked ?? false'), propsParams)).toBe('checked')
  })

  test('destructured default-prefixed prop is excluded', () => {
    expect(getControlledPropName(makeSignal("defaultValue ?? ''"), propsParams)).toBeNull()
  })

  test('complex expression returns null', () => {
    expect(getControlledPropName(makeSignal('someFunction(props.value)'), propsParams)).toBeNull()
  })

  test('unknown prop name returns null', () => {
    expect(getControlledPropName(makeSignal('props.unknown'), propsParams)).toBeNull()
  })
})
