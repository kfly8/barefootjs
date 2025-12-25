import { describe, test, expect } from 'bun:test'
import { extractModuleConstants, isConstantUsedInClientCode } from '../../src/extractors/constants'

describe('extractModuleConstants', () => {
  test('extracts numeric constants', () => {
    const source = `
      const SIZE = 100
      const SPEED = 1.5
      function Component() { return <div /> }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([
      { name: 'SIZE', value: '100', code: 'const SIZE = 100' },
      { name: 'SPEED', value: '1.5', code: 'const SPEED = 1.5' }
    ])
  })

  test('extracts string constants', () => {
    const source = `
      const NAME = "hello"
      const LABEL = 'world'
      function Component() { return <div /> }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([
      { name: 'NAME', value: '"hello"', code: 'const NAME = "hello"' },
      { name: 'LABEL', value: "'world'", code: "const LABEL = 'world'" }
    ])
  })

  test('extracts boolean constants', () => {
    const source = `
      const ENABLED = true
      const DISABLED = false
      function Component() { return <div /> }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([
      { name: 'ENABLED', value: 'true', code: 'const ENABLED = true' },
      { name: 'DISABLED', value: 'false', code: 'const DISABLED = false' }
    ])
  })

  test('ignores let and var', () => {
    const source = `
      let x = 1
      var y = 2
      function Component() { return <div /> }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([])
  })

  test('ignores non-literal values', () => {
    const source = `
      const fn = () => {}
      const obj = { a: 1 }
      const arr = [1, 2, 3]
      const expr = 1 + 2
      function Component() { return <div /> }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([])
  })

  test('ignores constants inside functions', () => {
    const source = `
      function Component() {
        const SIZE = 100
        return <div />
      }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([])
  })

  test('handles multiple declarations on one line', () => {
    const source = `
      const A = 1, B = 2
      function Component() { return <div /> }
    `
    const constants = extractModuleConstants(source, 'test.tsx')
    expect(constants).toEqual([
      { name: 'A', value: '1', code: 'const A = 1' },
      { name: 'B', value: '2', code: 'const B = 2' }
    ])
  })
})

describe('isConstantUsedInClientCode', () => {
  test('detects usage in local functions', () => {
    const localFunctions = [
      { name: 'initGame', code: 'const initGame = () => { return GRID_SIZE * 2 }' }
    ]
    expect(isConstantUsedInClientCode('GRID_SIZE', localFunctions, [], [])).toBe(true)
    expect(isConstantUsedInClientCode('OTHER', localFunctions, [], [])).toBe(false)
  })

  test('detects usage in event handlers', () => {
    const eventHandlers = ['() => setCount(MAX_COUNT)']
    expect(isConstantUsedInClientCode('MAX_COUNT', [], eventHandlers, [])).toBe(true)
    expect(isConstantUsedInClientCode('OTHER', [], eventHandlers, [])).toBe(false)
  })

  test('detects usage in ref callbacks', () => {
    const refCallbacks = ['(el) => { el.style.width = CELL_SIZE + "px" }']
    expect(isConstantUsedInClientCode('CELL_SIZE', [], [], refCallbacks)).toBe(true)
    expect(isConstantUsedInClientCode('OTHER', [], [], refCallbacks)).toBe(false)
  })

  test('returns false when not used', () => {
    expect(isConstantUsedInClientCode('UNUSED', [], [], [])).toBe(false)
  })
})
