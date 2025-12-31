import { describe, expect, test } from 'bun:test'
import {
  generateScopedElementFinder,
  generateEffectWithPreCheck,
  generateEffectWithInnerFinder,
} from './effect-helpers'

describe('generateScopedElementFinder', () => {
  test('generates path-based access when path is provided', () => {
    const result = generateScopedElementFinder({
      varName: '_el1',
      elementId: 'el1',
      path: 'firstChild',
    })
    expect(result).toBe('const _el1 = __scope?.firstChild')
  })

  test('generates direct __scope access when path is empty string', () => {
    const result = generateScopedElementFinder({
      varName: '_el1',
      elementId: 'el1',
      path: '',
    })
    expect(result).toBe('const _el1 = __scope')
  })

  test('generates nested path access', () => {
    const result = generateScopedElementFinder({
      varName: '_el1',
      elementId: 'el1',
      path: 'firstChild.nextSibling',
    })
    expect(result).toBe('const _el1 = __scope?.firstChild.nextSibling')
  })

  test('uses __findInScope when path is null', () => {
    const result = generateScopedElementFinder({
      varName: '_el1',
      elementId: 'el1',
      path: null,
    })
    expect(result).toBe("const _el1 = __findInScope('[data-bf=\"el1\"]')")
  })

  test('uses __findInScope when path is undefined', () => {
    const result = generateScopedElementFinder({
      varName: '_el1',
      elementId: 'el1',
      path: undefined,
    })
    expect(result).toBe("const _el1 = __findInScope('[data-bf=\"el1\"]')")
  })
})

describe('generateEffectWithPreCheck', () => {
  test('wraps effect body with existence check', () => {
    const result = generateEffectWithPreCheck({
      varName: '_el1',
      effectBody: '_el1.textContent = value',
    })
    expect(result).toEqual([
      'if (_el1) {',
      '  createEffect(() => {',
      '    _el1.textContent = value',
      '  })',
      '}',
    ])
  })

  test('handles multi-line effect body', () => {
    const result = generateEffectWithPreCheck({
      varName: '_el1',
      effectBody: '_el1.textContent = value\n_el1.className = "active"',
    })
    expect(result).toEqual([
      'if (_el1) {',
      '  createEffect(() => {',
      '    _el1.textContent = value',
      '    _el1.className = "active"',
      '  })',
      '}',
    ])
  })
})

describe('generateEffectWithInnerFinder', () => {
  test('generates effect with path-based finder', () => {
    const result = generateEffectWithInnerFinder({
      varName: '_el1',
      elementId: 'el1',
      path: 'firstChild',
      effectBody: '_el1.textContent = String(__textValue)',
      evaluateFirst: 'const __textValue = count()',
    })
    expect(result).toEqual([
      'createEffect(() => {',
      '  const _el1 = __scope?.firstChild',
      '  const __textValue = count()',
      '  if (_el1) {',
      '    _el1.textContent = String(__textValue)',
      '  }',
      '})',
    ])
  })

  test('generates effect with scoped finder when path is null', () => {
    const result = generateEffectWithInnerFinder({
      varName: '_el1',
      elementId: 'el1',
      path: null,
      effectBody: '_el1.textContent = String(__textValue)',
      evaluateFirst: 'const __textValue = count()',
    })
    expect(result).toEqual([
      'createEffect(() => {',
      "  const _el1 = __findInScope('[data-bf=\"el1\"]')",
      '  const __textValue = count()',
      '  if (_el1) {',
      '    _el1.textContent = String(__textValue)',
      '  }',
      '})',
    ])
  })

  test('generates effect without evaluateFirst', () => {
    const result = generateEffectWithInnerFinder({
      varName: '_el1',
      elementId: 'el1',
      path: 'firstChild',
      effectBody: '_el1.textContent = "static"',
    })
    expect(result).toEqual([
      'createEffect(() => {',
      '  const _el1 = __scope?.firstChild',
      '  if (_el1) {',
      '    _el1.textContent = "static"',
      '  }',
      '})',
    ])
  })

  test('handles multi-line evaluateFirst', () => {
    const result = generateEffectWithInnerFinder({
      varName: '_el1',
      elementId: 'el1',
      path: 'firstChild',
      effectBody: '_el1.textContent = String(__result)',
      evaluateFirst: 'const __val = getValue()\nconst __result = __val + 1',
    })
    expect(result).toEqual([
      'createEffect(() => {',
      '  const _el1 = __scope?.firstChild',
      '  const __val = getValue()',
      '  const __result = __val + 1',
      '  if (_el1) {',
      '    _el1.textContent = String(__result)',
      '  }',
      '})',
    ])
  })

  test('handles multi-line effect body', () => {
    const result = generateEffectWithInnerFinder({
      varName: '_el1',
      elementId: 'el1',
      path: 'firstChild',
      effectBody: '_el1.textContent = value\n_el1.className = "active"',
    })
    expect(result).toEqual([
      'createEffect(() => {',
      '  const _el1 = __scope?.firstChild',
      '  if (_el1) {',
      '    _el1.textContent = value',
      '    _el1.className = "active"',
      '  }',
      '})',
    ])
  })
})
