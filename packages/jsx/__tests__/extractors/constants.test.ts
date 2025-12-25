import { describe, test, expect } from 'bun:test'
import { extractModuleVariables, isConstantUsedInClientCode } from '../../src/extractors/constants'

describe('extractModuleVariables', () => {
  test('extracts numeric constants', () => {
    const source = `
      const SIZE = 100
      const SPEED = 1.5
      function Component() { return <div /> }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toEqual([
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
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toEqual([
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
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toEqual([
      { name: 'ENABLED', value: 'true', code: 'const ENABLED = true' },
      { name: 'DISABLED', value: 'false', code: 'const DISABLED = false' }
    ])
  })

  test('extracts let declarations', () => {
    const source = `
      let counter = 0
      let state = { count: 0 }
      function Component() { return <div /> }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toHaveLength(2)
    expect(variables[0].name).toBe('counter')
    expect(variables[1].name).toBe('state')
  })

  test('extracts arrow functions', () => {
    const source = `
      const handleClick = () => console.log('clicked')
      const handleSubmit = async (data) => await api.post(data)
      function Component() { return <div /> }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toHaveLength(2)
    expect(variables[0].name).toBe('handleClick')
    expect(variables[1].name).toBe('handleSubmit')
  })

  test('extracts arrays and objects', () => {
    const source = `
      const items = [1, 2, 3]
      const config = { a: 1, b: 'hello' }
      function Component() { return <div /> }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toHaveLength(2)
    expect(variables[0].name).toBe('items')
    expect(variables[1].name).toBe('config')
  })

  test('extracts template literals', () => {
    const source = `
      const code = \`const x = 1\`
      function Component() { return <div /> }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toHaveLength(1)
    expect(variables[0].name).toBe('code')
  })

  test('ignores var declarations', () => {
    const source = `
      var x = 1
      function Component() { return <div /> }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toEqual([])
  })

  test('ignores constants inside functions', () => {
    const source = `
      function Component() {
        const SIZE = 100
        return <div />
      }
    `
    const variables = extractModuleVariables(source, 'test.tsx')
    expect(variables).toEqual([])
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

  test('detects function reference in event handlers', () => {
    const eventHandlers = ['handleClick']
    expect(isConstantUsedInClientCode('handleClick', [], eventHandlers, [])).toBe(true)
  })

  test('detects usage in ref callbacks', () => {
    const refCallbacks = ['(el) => { el.style.width = CELL_SIZE + "px" }']
    expect(isConstantUsedInClientCode('CELL_SIZE', [], [], refCallbacks)).toBe(true)
    expect(isConstantUsedInClientCode('OTHER', [], [], refCallbacks)).toBe(false)
  })

  test('returns false when not used', () => {
    expect(isConstantUsedInClientCode('UNUSED', [], [], [])).toBe(false)
  })

  test('detects usage in child component props expressions', () => {
    const childPropsExpressions = ['{ title: "Variants", code: variantCode }']
    expect(isConstantUsedInClientCode('variantCode', [], [], [], childPropsExpressions)).toBe(true)
    expect(isConstantUsedInClientCode('OTHER', [], [], [], childPropsExpressions)).toBe(false)
  })

  test('detects multiple constants in child props', () => {
    const childPropsExpressions = ['{ items: itemList, config: CONFIG }']
    expect(isConstantUsedInClientCode('itemList', [], [], [], childPropsExpressions)).toBe(true)
    expect(isConstantUsedInClientCode('CONFIG', [], [], [], childPropsExpressions)).toBe(true)
    expect(isConstantUsedInClientCode('OTHER', [], [], [], childPropsExpressions)).toBe(false)
  })
})
