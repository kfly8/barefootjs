/**
 * Issue #140: AST-based Prop Substitution Tests
 *
 * Tests for substituteIdentifiersAST and substitutePropCallsAST functions
 * that replace regex-based parameter substitution with AST transformation.
 *
 * @see https://github.com/kfly8/barefootjs/issues/140
 */

import { describe, it, expect } from 'bun:test'
import { substituteIdentifiersAST, substitutePropCallsAST } from '../../src/extractors/expression'

describe('substituteIdentifiersAST', () => {
  it('replaces simple identifier', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('item.done', subs)
    expect(result).toBe('todo.done')
  })

  it('replaces multiple identifiers', () => {
    const subs = new Map([['a', 'x'], ['b', 'y']])
    const result = substituteIdentifiersAST('a + b', subs)
    expect(result).toBe('x + y')
  })

  it('skips property access right side', () => {
    const subs = new Map([['name', 'value']])
    const result = substituteIdentifiersAST('obj.name', subs)
    expect(result).toBe('obj.name')
  })

  it('replaces property access left side', () => {
    const subs = new Map([['obj', 'item']])
    const result = substituteIdentifiersAST('obj.name', subs)
    expect(result).toBe('item.name')
  })

  it('skips string literals', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('"item is here"', subs)
    expect(result).toBe('"item is here"')
  })

  it('handles template literals correctly', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('`Hello ${item}`', subs)
    expect(result).toBe('`Hello ${todo}`')
  })

  it('skips identifiers inside string part of template literal', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('`item is ${item}`', subs)
    expect(result).toBe('`item is ${todo}`')
  })

  it('skips property definition key', () => {
    const subs = new Map([['name', 'value']])
    const result = substituteIdentifiersAST('const x = { name: 123 }', subs)
    expect(result).toBe('const x = { name: 123 }')
  })

  it('skips already function call callee', () => {
    const subs = new Map([['fn', 'other']])
    const result = substituteIdentifiersAST('fn()', subs)
    expect(result).toBe('fn()')
  })

  it('replaces function call arguments', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('process(item)', subs)
    expect(result).toBe('process(todo)')
  })

  it('skips parameter definition', () => {
    const subs = new Map([['x', 'y']])
    const result = substituteIdentifiersAST('(x) => x + 1', subs)
    // Parameter definition is skipped, but usage in body is replaced
    expect(result).toBe('(x) => y + 1')
  })

  it('skips variable declaration left side', () => {
    const subs = new Map([['name', 'value']])
    const result = substituteIdentifiersAST('const name = 1', subs)
    expect(result).toBe('const name = 1')
  })

  it('skips destructuring binding', () => {
    const subs = new Map([['name', 'value']])
    const result = substituteIdentifiersAST('const { name } = obj', subs)
    expect(result).toBe('const { name } = obj')
  })

  it('handles shorthand property', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('fn({ item })', subs)
    expect(result).toBe('fn({ item: todo })')
  })

  it('handles complex expressions', () => {
    const subs = new Map([['item', 'todo'], ['fn', 'process']])
    const result = substituteIdentifiersAST('item.done && fn(item.id)', subs)
    // fn is a function call callee so skipped, item is replaced
    expect(result).toBe('todo.done && fn(todo.id)')
  })

  it('returns empty string unchanged', () => {
    const subs = new Map([['item', 'todo']])
    const result = substituteIdentifiersAST('', subs)
    expect(result).toBe('')
  })

  it('returns code unchanged when no substitutions', () => {
    const subs = new Map<string, string>()
    const result = substituteIdentifiersAST('const x = item', subs)
    expect(result).toBe('const x = item')
  })
})

describe('substitutePropCallsAST', () => {
  it('expands arrow function without args', () => {
    const propsMap = new Map([['onToggle', '() => handleToggle(id)']])
    const result = substitutePropCallsAST('onToggle()', propsMap)
    expect(result).toBe('handleToggle(id)')
  })

  it('expands arrow function with single arg', () => {
    const propsMap = new Map([['onDelete', '(x) => remove(x)']])
    const result = substitutePropCallsAST('onDelete(item.id)', propsMap)
    expect(result).toBe('remove(item.id)')
  })

  it('expands arrow function with multiple args', () => {
    const propsMap = new Map([['onUpdate', '(a, b) => update(a, b)']])
    const result = substitutePropCallsAST('onUpdate(x, y)', propsMap)
    expect(result).toBe('update(x, y)')
  })

  it('wraps non-arrow function calls', () => {
    const propsMap = new Map([['handler', 'myHandler']])
    const result = substitutePropCallsAST('handler(arg)', propsMap)
    expect(result).toBe('(myHandler)(arg)')
  })

  it('handles nested parentheses in args', () => {
    const propsMap = new Map([['fn', '(x) => process(x)']])
    const result = substitutePropCallsAST('fn((a, b) => a + b)', propsMap)
    expect(result).toBe('process((a, b) => a + b)')
  })

  it('handles multiple function calls', () => {
    const propsMap = new Map([
      ['onA', '() => handleA()'],
      ['onB', '() => handleB()']
    ])
    const result = substitutePropCallsAST('onA() && onB()', propsMap)
    expect(result).toBe('handleA() && handleB()')
  })

  it('does not replace non-prop function calls', () => {
    const propsMap = new Map([['onToggle', '() => toggle()']])
    const result = substitutePropCallsAST('onClick()', propsMap)
    expect(result).toBe('onClick()')
  })

  it('handles arrow function with complex body', () => {
    const propsMap = new Map([['onAction', '(id) => { doSomething(id); return true }']])
    const result = substitutePropCallsAST('onAction(123)', propsMap)
    expect(result).toBe('doSomething(123); return true')
  })

  it('returns empty string unchanged', () => {
    const propsMap = new Map([['fn', '() => doIt()']])
    const result = substitutePropCallsAST('', propsMap)
    expect(result).toBe('')
  })

  it('returns code unchanged when no props', () => {
    const propsMap = new Map<string, string>()
    const result = substitutePropCallsAST('onClick()', propsMap)
    expect(result).toBe('onClick()')
  })

  it('handles prop call inside template literal', () => {
    const propsMap = new Map([['getValue', '() => count']])
    const result = substitutePropCallsAST('`Result: ${getValue()}`', propsMap)
    expect(result).toBe('`Result: ${count}`')
  })
})

describe('substituteIdentifiersAST + substitutePropCallsAST combined', () => {
  it('handles both calls and references', () => {
    const propsMap = new Map([
      ['item', 'todo'],
      ['onToggle', '(id) => toggle(id)']
    ])

    // First substitute calls, then identifiers
    let result = substitutePropCallsAST('item.done && onToggle(item.id)', propsMap)
    result = substituteIdentifiersAST(result, propsMap)

    expect(result).toBe('todo.done && toggle(todo.id)')
  })

  it('handles complex inline component expression', () => {
    const propsMap = new Map([
      ['item', 'todo'],
      ['onToggle', '() => handleToggle(todo.id)'],
      ['onDelete', '() => handleDelete(todo.id)']
    ])

    let result = substitutePropCallsAST(
      'item.done ? onToggle() : onDelete()',
      propsMap
    )
    result = substituteIdentifiersAST(result, propsMap)

    expect(result).toBe('todo.done ? handleToggle(todo.id) : handleDelete(todo.id)')
  })
})
