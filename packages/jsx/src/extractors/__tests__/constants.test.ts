/**
 * Module Constants Extractor Tests
 */

import { describe, expect, it } from 'bun:test'
import { extractModuleConstantsAsValues, parseModuleConstantValue } from '../constants'

describe('extractModuleConstantsAsValues', () => {
  it('extracts simple numeric constants', () => {
    const source = `
      const GRID_SIZE = 100
      const MAX_COUNT = 50
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')

    expect(result.get('GRID_SIZE')).toEqual({ kind: 'literal', value: 100 })
    expect(result.get('MAX_COUNT')).toEqual({ kind: 'literal', value: 50 })
  })

  it('extracts string constants', () => {
    const source = `
      const NAME = "hello"
      const PATH = '/home/user'
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')

    expect(result.get('NAME')).toEqual({ kind: 'literal', value: 'hello' })
    expect(result.get('PATH')).toEqual({ kind: 'literal', value: '/home/user' })
  })

  it('extracts object constants', () => {
    const source = `
      const sizeMap = {
        sm: 16,
        md: 20,
        lg: 24
      }
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')
    const sizeMap = result.get('sizeMap')

    expect(sizeMap).toBeDefined()
    expect(sizeMap!.kind).toBe('object')
    if (sizeMap && sizeMap.kind === 'object') {
      expect(sizeMap.entries.get('sm')).toEqual({ kind: 'literal', value: 16 })
      expect(sizeMap.entries.get('md')).toEqual({ kind: 'literal', value: 20 })
      expect(sizeMap.entries.get('lg')).toEqual({ kind: 'literal', value: 24 })
    }
  })

  it('extracts object constants with string values', () => {
    const source = `
      const strokeIcons = {
        'check': 'M20 6 9 17l-5-5',
        'chevron-down': 'm6 9 6 6 6-6',
        sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
        moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'
      }
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')
    const strokeIcons = result.get('strokeIcons')

    expect(strokeIcons).toBeDefined()
    expect(strokeIcons!.kind).toBe('object')
    if (strokeIcons && strokeIcons.kind === 'object') {
      expect(strokeIcons.entries.get('check')).toEqual({ kind: 'literal', value: 'M20 6 9 17l-5-5' })
      expect(strokeIcons.entries.get('chevron-down')).toEqual({ kind: 'literal', value: 'm6 9 6 6 6-6' })
      expect(strokeIcons.entries.get('sun')?.kind).toBe('literal')
      expect(strokeIcons.entries.get('moon')?.kind).toBe('literal')
    }
  })

  it('extracts array constants', () => {
    const source = `
      const items = [1, 2, 3]
      const names = ["a", "b", "c"]
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')

    const items = result.get('items')
    expect(items).toBeDefined()
    expect(items!.kind).toBe('array')
    if (items && items.kind === 'array') {
      expect(items.elements).toEqual([
        { kind: 'literal', value: 1 },
        { kind: 'literal', value: 2 },
        { kind: 'literal', value: 3 }
      ])
    }
  })

  it('skips function constants', () => {
    const source = `
      const handleClick = () => {}
      const NAME = "test"
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')

    // Function constants should not be included (they can't be used for compile-time eval)
    expect(result.has('handleClick')).toBe(false)
    expect(result.get('NAME')).toEqual({ kind: 'literal', value: 'test' })
  })

  it('handles as const assertions', () => {
    const source = `
      const sizes = {
        sm: 16,
        md: 20
      } as const
    `
    const result = extractModuleConstantsAsValues(source, 'test.ts')
    const sizes = result.get('sizes')

    expect(sizes).toBeDefined()
    expect(sizes!.kind).toBe('object')
  })
})

describe('parseModuleConstantValue', () => {
  it('parses numeric value', () => {
    const result = parseModuleConstantValue({
      name: 'SIZE',
      value: '100',
      code: 'const SIZE = 100'
    })
    expect(result).toEqual({ kind: 'literal', value: 100 })
  })

  it('parses string value', () => {
    const result = parseModuleConstantValue({
      name: 'NAME',
      value: '"hello"',
      code: 'const NAME = "hello"'
    })
    expect(result).toEqual({ kind: 'literal', value: 'hello' })
  })

  it('parses object value', () => {
    const result = parseModuleConstantValue({
      name: 'config',
      value: '{ a: 1, b: 2 }',
      code: 'const config = { a: 1, b: 2 }'
    })
    expect(result.kind).toBe('object')
    if (result.kind === 'object') {
      expect(result.entries.get('a')).toEqual({ kind: 'literal', value: 1 })
      expect(result.entries.get('b')).toEqual({ kind: 'literal', value: 2 })
    }
  })
})

describe('Icon component sizeMap scenario', () => {
  it('correctly extracts Icon sizeMap', () => {
    const source = `
      const sizeMap = {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
      }

      const strokeIcons = {
        'check': 'M20 6 9 17l-5-5',
        'chevron-down': 'm6 9 6 6 6-6',
        'chevron-up': 'm18 15-6-6-6 6',
        'chevron-left': 'm15 18-6-6 6-6',
        'chevron-right': 'm9 18 6-6-6-6',
        'x': 'M18 6 6 18M6 6l12 12',
        'plus': 'M5 12h14M12 5v14',
        'minus': 'M5 12h14',
        'sun': 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
        'moon': 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
      }

      export function Icon({ name, size, class: className }) {
        const pixelSize = sizeMap[size]
        const path = strokeIcons[name]
        // ...
      }
    `
    const result = extractModuleConstantsAsValues(source, 'icon.tsx')

    // Check sizeMap
    const sizeMap = result.get('sizeMap')
    expect(sizeMap).toBeDefined()
    expect(sizeMap!.kind).toBe('object')
    if (sizeMap && sizeMap.kind === 'object') {
      expect(sizeMap.entries.get('sm')).toEqual({ kind: 'literal', value: 16 })
      expect(sizeMap.entries.get('md')).toEqual({ kind: 'literal', value: 20 })
      expect(sizeMap.entries.get('lg')).toEqual({ kind: 'literal', value: 24 })
      expect(sizeMap.entries.get('xl')).toEqual({ kind: 'literal', value: 32 })
    }

    // Check strokeIcons
    const strokeIcons = result.get('strokeIcons')
    expect(strokeIcons).toBeDefined()
    expect(strokeIcons!.kind).toBe('object')
    if (strokeIcons && strokeIcons.kind === 'object') {
      expect(strokeIcons.entries.get('sun')?.kind).toBe('literal')
      expect(strokeIcons.entries.get('moon')?.kind).toBe('literal')
      expect(strokeIcons.entries.get('plus')?.kind).toBe('literal')
    }
  })
})
