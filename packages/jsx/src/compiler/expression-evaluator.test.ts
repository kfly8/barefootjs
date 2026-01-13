/**
 * Expression Evaluator Tests
 */

import { describe, expect, it } from 'bun:test'
import {
  evaluateExpression,
  evaluatedValueToExpression,
  getLiteralValue,
  isStaticallyKnown,
  parseObjectLiteral,
  createEmptyContext,
  type EvalContext,
  type EvaluatedValue
} from './expression-evaluator'

describe('evaluateExpression', () => {
  describe('literals', () => {
    it('evaluates string literals', () => {
      const ctx = createEmptyContext()
      const result = evaluateExpression('"hello"', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'hello' })
    })

    it('evaluates numeric literals', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('42', ctx)).toEqual({ kind: 'literal', value: 42 })
      expect(evaluateExpression('3.14', ctx)).toEqual({ kind: 'literal', value: 3.14 })
    })

    it('evaluates boolean literals', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('true', ctx)).toEqual({ kind: 'literal', value: true })
      expect(evaluateExpression('false', ctx)).toEqual({ kind: 'literal', value: false })
    })

    it('evaluates null', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('null', ctx)).toEqual({ kind: 'literal', value: null })
    })
  })

  describe('variable references', () => {
    it('resolves local variables', () => {
      const ctx = createEmptyContext()
      ctx.variables.set('pixelSize', { kind: 'literal', value: 20 })

      const result = evaluateExpression('pixelSize', ctx)
      expect(result).toEqual({ kind: 'literal', value: 20 })
    })

    it('resolves props', () => {
      const ctx = createEmptyContext()
      ctx.props.set('size', { kind: 'literal', value: 'md' })

      const result = evaluateExpression('size', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'md' })
    })

    it('resolves module constants', () => {
      const ctx = createEmptyContext()
      const sizeMap = new Map<string, EvaluatedValue>()
      sizeMap.set('sm', { kind: 'literal', value: 16 })
      sizeMap.set('md', { kind: 'literal', value: 20 })
      ctx.moduleConstants.set('sizeMap', { kind: 'object', entries: sizeMap })

      const result = evaluateExpression('sizeMap', ctx)
      expect(result.kind).toBe('object')
    })

    it('returns dynamic for signal getters', () => {
      const ctx = createEmptyContext()
      ctx.signalGetters.add('count')

      const result = evaluateExpression('count', ctx)
      expect(result).toEqual({ kind: 'dynamic', expression: 'count()' })
    })

    it('returns unknown for unknown identifiers', () => {
      const ctx = createEmptyContext()
      const result = evaluateExpression('unknownVar', ctx)
      expect(result).toEqual({ kind: 'unknown' })
    })
  })

  describe('object property access', () => {
    it('evaluates bracket notation', () => {
      const ctx = createEmptyContext()
      const sizeMap = new Map<string, EvaluatedValue>()
      sizeMap.set('md', { kind: 'literal', value: 20 })
      ctx.moduleConstants.set('sizeMap', { kind: 'object', entries: sizeMap })

      const result = evaluateExpression('sizeMap["md"]', ctx)
      expect(result).toEqual({ kind: 'literal', value: 20 })
    })

    it('evaluates dot notation', () => {
      const ctx = createEmptyContext()
      const strokeIcons = new Map<string, EvaluatedValue>()
      strokeIcons.set('sun', { kind: 'literal', value: 'M12...' })
      ctx.moduleConstants.set('strokeIcons', { kind: 'object', entries: strokeIcons })

      const result = evaluateExpression('strokeIcons.sun', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'M12...' })
    })

    it('evaluates chained property access', () => {
      const ctx = createEmptyContext()
      ctx.props.set('size', { kind: 'literal', value: 'md' })

      const sizeMap = new Map<string, EvaluatedValue>()
      sizeMap.set('md', { kind: 'literal', value: 20 })
      ctx.moduleConstants.set('sizeMap', { kind: 'object', entries: sizeMap })

      // First evaluate size to get 'md', then use it for lookup
      const sizeValue = evaluateExpression('size', ctx)
      expect(sizeValue).toEqual({ kind: 'literal', value: 'md' })
    })
  })

  describe('binary expressions', () => {
    it('evaluates equality', () => {
      const ctx = createEmptyContext()
      ctx.props.set('name', { kind: 'literal', value: 'github' })

      expect(evaluateExpression('name === "github"', ctx)).toEqual({ kind: 'literal', value: true })
      expect(evaluateExpression('name === "sun"', ctx)).toEqual({ kind: 'literal', value: false })
      expect(evaluateExpression('name !== "sun"', ctx)).toEqual({ kind: 'literal', value: true })
    })

    it('evaluates string concatenation', () => {
      const ctx = createEmptyContext()
      const result = evaluateExpression('"hello" + " " + "world"', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'hello world' })
    })

    it('evaluates arithmetic', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('10 + 5', ctx)).toEqual({ kind: 'literal', value: 15 })
      expect(evaluateExpression('10 - 5', ctx)).toEqual({ kind: 'literal', value: 5 })
      expect(evaluateExpression('10 * 5', ctx)).toEqual({ kind: 'literal', value: 50 })
      expect(evaluateExpression('10 / 5', ctx)).toEqual({ kind: 'literal', value: 2 })
    })

    it('evaluates logical operators', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('true && true', ctx)).toEqual({ kind: 'literal', value: true })
      expect(evaluateExpression('true && false', ctx)).toEqual({ kind: 'literal', value: false })
      expect(evaluateExpression('false || true', ctx)).toEqual({ kind: 'literal', value: true })
    })

    it('returns dynamic when operand is dynamic', () => {
      const ctx = createEmptyContext()
      ctx.signalGetters.add('count')

      const result = evaluateExpression('count === 5', ctx)
      expect(result.kind).toBe('dynamic')
    })
  })

  describe('ternary expressions', () => {
    it('evaluates when condition is known true', () => {
      const ctx = createEmptyContext()
      ctx.props.set('name', { kind: 'literal', value: 'github' })

      const result = evaluateExpression('name === "github" ? "yes" : "no"', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'yes' })
    })

    it('evaluates when condition is known false', () => {
      const ctx = createEmptyContext()
      ctx.props.set('name', { kind: 'literal', value: 'sun' })

      const result = evaluateExpression('name === "github" ? "yes" : "no"', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'no' })
    })

    it('returns dynamic when condition is dynamic', () => {
      const ctx = createEmptyContext()
      ctx.signalGetters.add('isDark')

      const result = evaluateExpression('isDark ? "dark" : "light"', ctx)
      expect(result.kind).toBe('dynamic')
      expect((result as { kind: 'dynamic'; expression: string }).expression).toContain('isDark()')
    })
  })

  describe('object literals', () => {
    it('parses object literals', () => {
      const ctx = createEmptyContext()
      const result = evaluateExpression('{ sm: 16, md: 20, lg: 24 }', ctx)

      expect(result.kind).toBe('object')
      if (result.kind === 'object') {
        expect(result.entries.get('sm')).toEqual({ kind: 'literal', value: 16 })
        expect(result.entries.get('md')).toEqual({ kind: 'literal', value: 20 })
        expect(result.entries.get('lg')).toEqual({ kind: 'literal', value: 24 })
      }
    })
  })

  describe('array literals', () => {
    it('parses array literals', () => {
      const ctx = createEmptyContext()
      const result = evaluateExpression('[1, 2, 3]', ctx)

      expect(result.kind).toBe('array')
      if (result.kind === 'array') {
        expect(result.elements).toEqual([
          { kind: 'literal', value: 1 },
          { kind: 'literal', value: 2 },
          { kind: 'literal', value: 3 }
        ])
      }
    })
  })

  describe('template literals', () => {
    it('evaluates static template literals', () => {
      const ctx = createEmptyContext()
      ctx.variables.set('className', { kind: 'literal', value: 'icon-class' })

      const result = evaluateExpression('`shrink-0 ${className}`', ctx)
      expect(result).toEqual({ kind: 'literal', value: 'shrink-0 icon-class' })
    })

    it('returns dynamic for dynamic template literals', () => {
      const ctx = createEmptyContext()
      ctx.signalGetters.add('count')

      const result = evaluateExpression('`count: ${count}`', ctx)
      expect(result.kind).toBe('dynamic')
    })
  })

  describe('unary expressions', () => {
    it('evaluates negation', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('!true', ctx)).toEqual({ kind: 'literal', value: false })
      expect(evaluateExpression('!false', ctx)).toEqual({ kind: 'literal', value: true })
    })

    it('evaluates numeric negation', () => {
      const ctx = createEmptyContext()
      expect(evaluateExpression('-5', ctx)).toEqual({ kind: 'literal', value: -5 })
    })
  })
})

describe('evaluatedValueToExpression', () => {
  it('converts literals', () => {
    expect(evaluatedValueToExpression({ kind: 'literal', value: 'hello' })).toBe('"hello"')
    expect(evaluatedValueToExpression({ kind: 'literal', value: 42 })).toBe('42')
    expect(evaluatedValueToExpression({ kind: 'literal', value: true })).toBe('true')
    expect(evaluatedValueToExpression({ kind: 'literal', value: null })).toBe('null')
  })

  it('converts dynamic values', () => {
    expect(evaluatedValueToExpression({ kind: 'dynamic', expression: 'count()' })).toBe('count()')
  })

  it('converts objects', () => {
    const entries = new Map<string, EvaluatedValue>()
    entries.set('a', { kind: 'literal', value: 1 })
    entries.set('b', { kind: 'literal', value: 2 })
    expect(evaluatedValueToExpression({ kind: 'object', entries })).toBe('{ a: 1, b: 2 }')
  })

  it('converts arrays', () => {
    const elements: EvaluatedValue[] = [
      { kind: 'literal', value: 1 },
      { kind: 'literal', value: 2 }
    ]
    expect(evaluatedValueToExpression({ kind: 'array', elements })).toBe('[1, 2]')
  })

  it('returns null for unknown', () => {
    expect(evaluatedValueToExpression({ kind: 'unknown' })).toBe(null)
  })
})

describe('getLiteralValue', () => {
  it('extracts literal value', () => {
    expect(getLiteralValue({ kind: 'literal', value: 'test' })).toBe('test')
    expect(getLiteralValue({ kind: 'literal', value: 42 })).toBe(42)
  })

  it('returns null for non-literals', () => {
    expect(getLiteralValue({ kind: 'dynamic', expression: 'x()' })).toBe(null)
    expect(getLiteralValue({ kind: 'unknown' })).toBe(null)
  })
})

describe('isStaticallyKnown', () => {
  it('returns true for literals', () => {
    expect(isStaticallyKnown({ kind: 'literal', value: 'test' })).toBe(true)
  })

  it('returns true for objects with all static values', () => {
    const entries = new Map<string, EvaluatedValue>()
    entries.set('a', { kind: 'literal', value: 1 })
    expect(isStaticallyKnown({ kind: 'object', entries })).toBe(true)
  })

  it('returns false for objects with dynamic values', () => {
    const entries = new Map<string, EvaluatedValue>()
    entries.set('a', { kind: 'dynamic', expression: 'x()' })
    expect(isStaticallyKnown({ kind: 'object', entries })).toBe(false)
  })

  it('returns false for dynamic values', () => {
    expect(isStaticallyKnown({ kind: 'dynamic', expression: 'x()' })).toBe(false)
  })

  it('returns false for unknown values', () => {
    expect(isStaticallyKnown({ kind: 'unknown' })).toBe(false)
  })
})

describe('parseObjectLiteral', () => {
  it('parses simple object', () => {
    const result = parseObjectLiteral('{ sm: 16, md: 20 }')
    expect(result).not.toBe(null)
    expect(result!.get('sm')).toEqual({ kind: 'literal', value: 16 })
    expect(result!.get('md')).toEqual({ kind: 'literal', value: 20 })
  })

  it('returns null for non-object', () => {
    expect(parseObjectLiteral('42')).toBe(null)
  })
})

describe('Icon component scenario', () => {
  it('evaluates sizeMap[size] lookup', () => {
    const ctx = createEmptyContext()

    // Module constants (from icon.tsx)
    const sizeMap = new Map<string, EvaluatedValue>()
    sizeMap.set('sm', { kind: 'literal', value: 16 })
    sizeMap.set('md', { kind: 'literal', value: 20 })
    sizeMap.set('lg', { kind: 'literal', value: 24 })
    sizeMap.set('xl', { kind: 'literal', value: 32 })
    ctx.moduleConstants.set('sizeMap', { kind: 'object', entries: sizeMap })

    // Props (from <SunIcon size="md" />)
    ctx.props.set('size', { kind: 'literal', value: 'md' })

    // Simulate: const pixelSize = sizeMap[size]
    // First get size value
    const sizeValue = evaluateExpression('size', ctx)
    expect(sizeValue).toEqual({ kind: 'literal', value: 'md' })

    // Then lookup in sizeMap
    ctx.variables.set('size', sizeValue)
    const pixelSizeResult = evaluateExpression('sizeMap[size]', ctx)
    expect(pixelSizeResult).toEqual({ kind: 'literal', value: 20 })
  })

  it('evaluates name === "github" condition', () => {
    const ctx = createEmptyContext()
    ctx.props.set('name', { kind: 'literal', value: 'sun' })
    ctx.variables.set('name', ctx.props.get('name')!)

    const result = evaluateExpression('name === "github"', ctx)
    expect(result).toEqual({ kind: 'literal', value: false })
  })

  it('evaluates strokeIcons lookup', () => {
    const ctx = createEmptyContext()

    const strokeIcons = new Map<string, EvaluatedValue>()
    strokeIcons.set('sun', { kind: 'literal', value: 'M12 16a4 4 0 1 0 0-8...' })
    strokeIcons.set('moon', { kind: 'literal', value: 'M12 3a6 6 0 0 0 9 9...' })
    ctx.moduleConstants.set('strokeIcons', { kind: 'object', entries: strokeIcons })

    ctx.props.set('name', { kind: 'literal', value: 'sun' })
    ctx.variables.set('name', ctx.props.get('name')!)

    const result = evaluateExpression('strokeIcons[name]', ctx)
    expect(result).toEqual({ kind: 'literal', value: 'M12 16a4 4 0 1 0 0-8...' })
  })
})
