/**
 * IR to Server JSX Transformer Tests
 */

import { describe, it, expect } from 'bun:test'
import { irToServerJsx } from '../../src/transformers/ir-to-server-jsx'
import type { IRNode, IRElement, SignalDeclaration } from '../../src/types'

describe('irToServerJsx', () => {
  const signals: SignalDeclaration[] = [
    { getter: 'count', setter: 'setCount', initialValue: '0' },
    { getter: 'todos', setter: 'setTodos', initialValue: 'initialTodos' },
  ]

  it('converts text node', () => {
    const node: IRNode = { type: 'text', content: 'Hello World' }
    expect(irToServerJsx(node, 'Test', [])).toBe('Hello World')
  })

  it('converts expression node preserving expression', () => {
    const node: IRNode = { type: 'expression', expression: 'count()', isDynamic: true }
    const result = irToServerJsx(node, 'Test', signals)
    expect(result).toBe('{0}')  // count() replaced with initial value
  })

  it('converts simple element', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [{ name: 'class', value: 'container' }],
      dynamicAttrs: [],
      events: [],
      children: [{ type: 'text', content: 'Hello' }],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToServerJsx(node, 'Test', [])
    expect(result).toBe('<div data-bf-scope="Test" className="container">Hello</div>')
  })

  it('converts element with dynamic attributes', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'span',
      id: 'd0',
      staticAttrs: [],
      dynamicAttrs: [{ name: 'class', expression: 'count() > 0 ? "active" : ""' }],
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToServerJsx(node, 'Test', signals)
    // Root elements use path-based navigation (empty path), no data-bf needed
    expect(result).not.toContain('data-bf="d0"')
    expect(result).toContain('className={0 > 0 ? "active" : ""}')
  })

  it('converts element with list info', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'ul',
      id: 'l0',
      staticAttrs: [{ name: 'class', value: 'todo-list' }],
      dynamicAttrs: [],
      events: [],
      children: [],
      listInfo: {
        arrayExpression: 'todos()',
        paramName: 'todo',
        itemTemplate: '<li class="todo-item">' + '${todo.text}' + '</li>',
        itemIR: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [{ name: 'class', value: 'todo-item' }],
          dynamicAttrs: [],
          events: [],
          children: [{ type: 'expression', expression: 'todo.text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        itemEvents: [],
      },
      dynamicContent: null,
    }
    const result = irToServerJsx(node, 'Test', signals)
    expect(result).toContain('<ul')
    expect(result).toContain('className="todo-list"')
    // With itemIR, the list generates proper JSX instead of template string
    expect(result).toContain('initialTodos?.map((todo, __index) => (<li className="todo-item">{todo.text}</li>))')
  })

  it('converts conditional node with text branches (quoted strings)', () => {
    const node: IRNode = {
      type: 'conditional',
      condition: 'count() > 0',
      whenTrue: { type: 'text', content: 'Positive' },
      whenFalse: { type: 'text', content: 'Zero or Negative' },
    }
    const result = irToServerJsx(node, 'Test', signals)
    // Text inside ternary must be quoted strings for valid JSX
    expect(result).toBe('{0 > 0 ? "Positive" : "Zero or Negative"}')
  })

  it('converts conditional node with expression branches (no extra braces)', () => {
    const node: IRNode = {
      type: 'conditional',
      condition: 'isOn()',
      whenTrue: { type: 'expression', expression: "'ON'", isDynamic: false },
      whenFalse: { type: 'expression', expression: "'OFF'", isDynamic: false },
    }
    const isOnSignal: SignalDeclaration[] = [
      { getter: 'isOn', setter: 'setIsOn', initialValue: 'false' },
    ]
    const result = irToServerJsx(node, 'Test', isOnSignal)
    // Expression inside ternary should NOT have extra curly braces
    // Valid: {false ? 'ON' : 'OFF'}
    // Invalid: {false ? {'ON'} : {'OFF'}}
    expect(result).toBe("{false ? 'ON' : 'OFF'}")
  })

  it('converts conditional node with element branches', () => {
    const node: IRNode = {
      type: 'conditional',
      condition: 'isOn()',
      whenTrue: {
        type: 'element',
        tagName: 'span',
        id: null,
        staticAttrs: [{ name: 'class', value: 'on' }],
        dynamicAttrs: [],
        events: [],
        children: [{ type: 'text', content: 'ON' }],
        listInfo: null,
        dynamicContent: null,
      },
      whenFalse: {
        type: 'element',
        tagName: 'span',
        id: null,
        staticAttrs: [{ name: 'class', value: 'off' }],
        dynamicAttrs: [],
        events: [],
        children: [{ type: 'text', content: 'OFF' }],
        listInfo: null,
        dynamicContent: null,
      },
    }
    const isOnSignal: SignalDeclaration[] = [
      { getter: 'isOn', setter: 'setIsOn', initialValue: 'false' },
    ]
    const result = irToServerJsx(node, 'Test', isOnSignal)
    // Element branches are valid JSX as-is
    expect(result).toBe('{false ? <span className="on">ON</span> : <span className="off">OFF</span>}')
  })

  it('handles self-closing tags', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'input',
      id: 'i0',
      staticAttrs: [{ name: 'type', value: 'text' }],
      dynamicAttrs: [],
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToServerJsx(node, 'Test', [])
    // Root elements use path-based navigation, no data-bf needed
    expect(result).toBe('<input data-bf-scope="Test" type="text" />')
  })
})

describe('irToServerJsx with honoServerAdapter integration', () => {
  it('generates JSX that works with Hono adapter', async () => {
    const { honoServerAdapter } = await import('../../src/adapters/hono')

    const ir: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [{ name: 'class', value: 'counter' }],
      dynamicAttrs: [],
      events: [],
      children: [{
        type: 'element',
        tagName: 'span',
        id: 'd0',
        staticAttrs: [],
        dynamicAttrs: [],
        events: [],
        children: [{ type: 'text', content: '0' }],
        listInfo: null,
        dynamicContent: null,
      }],
      listInfo: null,
      dynamicContent: null,
    }

    const jsx = irToServerJsx(ir, 'Counter', [])
    const result = honoServerAdapter.generateServerComponent({
      name: 'Counter',
      props: [],
      jsx,
      ir,
      signals: [],
      childComponents: [],
    })

    expect(result).toContain('import { useRequestContext }')
    expect(result).toContain('function Counter({ "data-key": __dataKey, __listIndex }')
    expect(result).toContain("c.get('bfOutputScripts')")
    expect(result).toContain('className="counter"')
  })

  it('generates JSX with props that Hono adapter can use for hydration', async () => {
    const { honoServerAdapter } = await import('../../src/adapters/hono')

    const signals: SignalDeclaration[] = [
      { getter: 'todos', setter: 'setTodos', initialValue: 'initialTodos' },
    ]

    const ir: IRElement = {
      type: 'element',
      tagName: 'ul',
      id: 'l0',
      staticAttrs: [{ name: 'class', value: 'todo-list' }],
      dynamicAttrs: [],
      events: [],
      children: [],
      listInfo: {
        arrayExpression: 'todos()',
        paramName: 'todo',
        itemTemplate: '<li className="todo-item">${todo.text}</li>',
        itemIR: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [{ name: 'class', value: 'todo-item' }],
          dynamicAttrs: [],
          events: [],
          children: [{ type: 'expression', expression: 'todo.text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        itemEvents: [],
      },
      dynamicContent: null,
    }

    const jsx = irToServerJsx(ir, 'Counter', signals)
    const result = honoServerAdapter.generateServerComponent({
      name: 'TodoApp',
      props: ['initialTodos'],
      jsx,
      ir,
      signals,
      childComponents: [],
    })

    expect(result).toContain('export function TodoApp({ initialTodos, "data-key": __dataKey, __listIndex }')
    expect(result).toContain('data-bf-props="TodoApp"')
    expect(result).toContain('__hydrateProps')
    // Check that list is generated with map
    expect(result).toContain('initialTodos?.map')
  })
})
