/**
 * IR to Marked JSX Transformer Tests
 */

import { describe, it, expect } from 'bun:test'
import { irToMarkedJsx } from '../../src/transformers/ir-to-marked-jsx'
import type { IRNode, IRElement, SignalDeclaration } from '../../src/types'

describe('irToMarkedJsx', () => {
  const signals: SignalDeclaration[] = [
    { getter: 'count', setter: 'setCount', initialValue: '0' },
    { getter: 'todos', setter: 'setTodos', initialValue: 'initialTodos' },
  ]

  it('converts text node', () => {
    const node: IRNode = { type: 'text', content: 'Hello World' }
    expect(irToMarkedJsx(node, 'Test', [])).toBe('Hello World')
  })

  it('converts expression node preserving expression', () => {
    const node: IRNode = { type: 'expression', expression: 'count()', isDynamic: true }
    const result = irToMarkedJsx(node, 'Test', signals)
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
    const result = irToMarkedJsx(node, 'Test', [])
    // data-bf-scope is now conditional for list compatibility
    expect(result).toContain('data-bf-scope": "Test"')
    expect(result).toContain('className="container"')
    expect(result).toContain('Hello')
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
    const result = irToMarkedJsx(node, 'Test', signals)
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
    const result = irToMarkedJsx(node, 'Test', signals)
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
    const result = irToMarkedJsx(node, 'Test', signals)
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
    const result = irToMarkedJsx(node, 'Test', isOnSignal)
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
    const result = irToMarkedJsx(node, 'Test', isOnSignal)
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
    const result = irToMarkedJsx(node, 'Test', [])
    // data-bf-scope is now conditional for list compatibility
    expect(result).toContain('data-bf-scope": "Test"')
    expect(result).toContain('type="text"')
  })
})

describe('irToMarkedJsx - fragment handling', () => {
  it('converts empty fragment', () => {
    const node: IRNode = {
      type: 'fragment',
      children: [],
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toBe('<></>')
  })

  it('converts fragment with multiple children', () => {
    const node: IRNode = {
      type: 'fragment',
      children: [
        { type: 'element', tagName: 'p', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [{ type: 'text', content: 'First' }], listInfo: null, dynamicContent: null },
        { type: 'element', tagName: 'p', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [{ type: 'text', content: 'Second' }], listInfo: null, dynamicContent: null },
      ],
    }
    const result = irToMarkedJsx(node, 'Test', [])
    // data-bf-scope is now conditional for list compatibility
    expect(result).toContain('data-bf-scope": "Test"')
    expect(result).toContain('First')
    expect(result).toContain('<p>Second</p>')
  })

  it('passes data-bf-scope to first element child in fragment', () => {
    const node: IRNode = {
      type: 'fragment',
      children: [
        { type: 'element', tagName: 'header', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [], listInfo: null, dynamicContent: null },
        { type: 'element', tagName: 'main', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [], listInfo: null, dynamicContent: null },
      ],
    }
    const result = irToMarkedJsx(node, 'TestComponent', [])
    // data-bf-scope is now conditional for list compatibility
    expect(result).toContain('data-bf-scope": "TestComponent"')
    // The first element should have the scope, not the second
    expect(result).toContain('<header')
    expect(result).toContain('<main></main>')
  })
})

describe('irToMarkedJsx - component handling', () => {
  it('converts component with static props', () => {
    const node: IRNode = {
      type: 'component',
      name: 'Button',
      props: [
        { name: 'label', value: '"Click me"', isDynamic: false },
        { name: 'size', value: '"lg"', isDynamic: false },
      ],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('<Button')
    expect(result).toContain('label="Click me"')
    expect(result).toContain('size="lg"')
  })

  it('converts component with dynamic props using signal initial values', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'count', setter: 'setCount', initialValue: '0' },
    ]
    const node: IRNode = {
      type: 'component',
      name: 'Counter',
      props: [
        { name: 'value', value: 'count()', isDynamic: true },
      ],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', signals)
    expect(result).toContain('value={0}')
  })

  it('converts component with spread props', () => {
    const node: IRNode = {
      type: 'component',
      name: 'Input',
      props: [],
      spreadProps: [{ expression: 'inputProps' }],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('{...inputProps}')
  })

  it('converts component with children', () => {
    const node: IRNode = {
      type: 'component',
      name: 'Card',
      props: [],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [
        { type: 'element', tagName: 'p', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [{ type: 'text', content: 'Content' }], listInfo: null, dynamicContent: null },
      ],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('<Card>')
    expect(result).toContain('<p>Content</p>')
    expect(result).toContain('</Card>')
  })

  it('skips event handler props (they reference undefined functions on server)', () => {
    const node: IRNode = {
      type: 'component',
      name: 'Toggle',
      props: [
        { name: 'checked', value: 'false', isDynamic: false },
        { name: 'onToggle', value: 'handleToggle', isDynamic: true },
      ],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('checked={false}')
    expect(result).not.toContain('onToggle')
  })

  it('wraps root component in div with data-bf-scope', () => {
    const node: IRNode = {
      type: 'component',
      name: 'Child',
      props: [],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Parent', [])
    expect(result).toContain('data-bf-scope="Parent"')
    expect(result).toContain('<Child />')
  })

  it('handles comparison expressions in component props (not misidentified as string literals)', () => {
    // Regression test for issue #77: expressions like `errorMsg() !== ''` were being
    // misidentified as string literals because they start with a single quote,
    // resulting in invalid JSX like `open='' !== ''` instead of `open={'' !== ''}`
    const signals: SignalDeclaration[] = [
      { getter: 'errorMsg', setter: 'setErrorMsg', initialValue: "''" },
    ]
    const node: IRNode = {
      type: 'component',
      name: 'Toast',
      props: [
        { name: 'variant', value: '"error"', isDynamic: false },
        { name: 'open', value: "errorMsg() !== ''", isDynamic: true },
      ],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', signals)
    // The comparison expression should be wrapped in braces, not treated as string literal
    expect(result).toContain("open={'' !== ''}")
    // And should NOT produce invalid JSX like open='' !== ''
    expect(result).not.toMatch(/open=''[^}]/)
  })

  it('handles empty string props correctly', () => {
    // Empty string literals should still be handled correctly
    const node: IRNode = {
      type: 'component',
      name: 'Input',
      props: [
        { name: 'placeholder', value: "''", isDynamic: false },
      ],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    // Empty string literal should be output as attribute without braces
    expect(result).toContain("placeholder=''")
  })
})

describe('irToMarkedJsx - nested structures', () => {
  it('handles element inside conditional', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'show', setter: 'setShow', initialValue: 'true' },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [
        {
          type: 'conditional',
          id: 'c0',
          condition: 'show()',
          whenTrue: { type: 'element', tagName: 'span', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [{ type: 'text', content: 'Visible' }], listInfo: null, dynamicContent: null },
          whenFalse: { type: 'expression', expression: 'null', isDynamic: false },
        },
      ],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals)
    expect(result).toContain('true ?')
    expect(result).toContain('data-bf-cond="c0"')
    expect(result).toContain('Visible')
  })

  it('handles conditional inside element', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'isActive', setter: 'setIsActive', initialValue: 'false' },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [{ name: 'class', value: 'wrapper' }],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [
        {
          type: 'conditional',
          id: null,  // Static conditional (text-only)
          condition: 'isActive()',
          whenTrue: { type: 'expression', expression: '"Active"', isDynamic: false },
          whenFalse: { type: 'expression', expression: '"Inactive"', isDynamic: false },
        },
      ],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals)
    expect(result).toContain('false ? "Active" : "Inactive"')
  })

  it('handles list with nested elements', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'todos', setter: 'setTodos', initialValue: 'initialTodos' },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'ul',
      id: 'l0',
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: {
        arrayExpression: 'todos()',
        paramName: 'todo',
        indexParamName: null,
        itemTemplate: '`<li>${todo.text}</li>`',
        itemIR: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [{ type: 'expression', expression: 'todo.text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        itemEvents: [],
        keyExpression: 'todo.id',
      },
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals)
    expect(result).toContain('initialTodos?.map')
    expect(result).toContain('(todo, __index)')
    expect(result).toContain('{todo.text}')
    expect(result).toContain('data-key={todo.id}')
  })

  it('renames user index param to __index in list expressions', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'fields', setter: 'setFields', initialValue: '[]' },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: 'l0',
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: {
        arrayExpression: 'fields()',
        paramName: 'field',
        indexParamName: 'index',  // User wrote (field, index) => ...
        itemTemplate: '`<input placeholder="Email ${index + 1}" />`',
        itemIR: {
          type: 'element',
          tagName: 'input',
          id: null,
          staticAttrs: [{ name: 'placeholder', value: '`Email ${index + 1}`' }],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [],
          listInfo: null,
          dynamicContent: null,
        },
        itemEvents: [],
        keyExpression: 'field.id',
      },
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals)
    // Should use __index in map callback
    expect(result).toContain('(field, __index)')
    // Should rename 'index' to '__index' in expressions
    expect(result).toContain('__index + 1')
    // Should NOT contain the original 'index' variable (except in __index)
    expect(result).not.toMatch(/[^_]index\s*\+/)
  })
})

describe('irToMarkedJsx - edge cases', () => {
  it('handles empty element', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    // data-bf-scope is now conditional for list compatibility
    expect(result).toContain('data-bf-scope": "Test"')
    expect(result).toContain('<div')
    expect(result).toContain('</div>')
  })

  it('handles element with spread attributes', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [{ expression: 'props' }],
      ref: null,
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('{...props}')
  })

  it('handles children prop with lazy evaluation (typeof check)', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [
        { type: 'expression', expression: 'children', isDynamic: true },
      ],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain("typeof children === 'function' ? children() : children")
  })

  it('handles memo calls with signal replacement', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'count', setter: 'setCount', initialValue: '5' },
    ]
    const memos = [
      { getter: 'doubled', computation: '() => count() * 2' },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'span',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [
        { type: 'expression', expression: 'doubled()', isDynamic: true },
      ],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals, new Set(), { memos })
    // doubled() -> () => count() * 2 -> 5 * 2
    expect(result).toContain('(5 * 2)')
  })

  it('handles memo calls with block body (if statements) - generates IIFE', () => {
    // Regression test for issue #76: createMemo with block body containing if statements
    // was generating invalid code like ({if (!false) return ''; ...}) instead of IIFE
    const signals: SignalDeclaration[] = [
      { getter: 'touched', setter: 'setTouched', initialValue: 'false' },
      { getter: 'name', setter: 'setName', initialValue: "''" },
    ]
    const memos = [
      {
        getter: 'error',
        computation: `() => {
    if (!touched()) return ''
    return name().trim() === '' ? 'Name is required' : ''
  }`,
      },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'p',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [
        { type: 'expression', expression: 'error()', isDynamic: true },
      ],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals, new Set(), { memos })
    // Block body should be wrapped as IIFE: (() => {...})()
    // NOT as invalid object literal: ({...})
    expect(result).toContain('(() =>')
    expect(result).toContain('})()')
    // Verify signal calls are replaced with initial values
    expect(result).toContain('!false')
    expect(result).toContain("''.trim()")
  })

  it('handles memo referencing another memo (nested memo replacement)', () => {
    // Regression test for issue #77: when a memo references another memo,
    // both should be expanded. E.g., isValid() referencing error()
    const signals: SignalDeclaration[] = [
      { getter: 'email', setter: 'setEmail', initialValue: "''" },
    ]
    const memos = [
      {
        getter: 'error',
        computation: `() => {
    if (''.trim() === '') return 'Email is required'
    return ''
  }`,
      },
      {
        getter: 'isValid',
        computation: `() => error() === '' && email().trim() !== ''`,
      },
    ]
    const node: IRElement = {
      type: 'element',
      tagName: 'button',
      id: null,
      staticAttrs: [],
      dynamicAttrs: [{ name: 'disabled', expression: '!isValid()' }],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', signals, new Set(), { memos })
    // isValid() should be expanded, and error() inside it should also be expanded
    // The result should NOT contain error() as that function is not defined on server
    expect(result).not.toContain('error()')
    expect(result).not.toContain('isValid()')
    // Should contain the expanded expressions
    expect(result).toContain('disabled=')
  })

  it('adds xmlns for svg root element', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'svg',
      id: null,
      staticAttrs: [{ name: 'width', value: '100' }],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('converts class to className', () => {
    const node: IRElement = {
      type: 'element',
      tagName: 'div',
      id: null,
      staticAttrs: [{ name: 'class', value: 'container' }],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: null,
      dynamicContent: null,
    }
    const result = irToMarkedJsx(node, 'Test', [])
    expect(result).toContain('className="container"')
    expect(result).not.toContain('class="container"')
  })
})

describe('irToMarkedJsx with honoMarkedJsxAdapter integration', () => {
  it('generates JSX that works with Hono adapter', async () => {
    const { honoMarkedJsxAdapter } = await import('@barefootjs/hono')

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

    const jsx = irToMarkedJsx(ir, 'Counter', [])
    const result = honoMarkedJsxAdapter.generateMarkedJsxFile({
      sourcePath: 'Counter.tsx',
      components: [{
        name: 'Counter',
        props: [],
        typeDefinitions: [],
        jsx,
        ir,
        signals: [],
        memos: [],
        childComponents: [],
      }],
      moduleConstants: [],
      originalImports: [],
    })

    expect(result).toContain('import { useRequestContext }')
    expect(result).toContain('function Counter({ "data-key": __dataKey, __listIndex }')
    expect(result).toContain("c.get('bfOutputScripts')")
    expect(result).toContain('className="counter"')
  })

  it('generates JSX with props that Hono adapter can use for hydration', async () => {
    const { honoMarkedJsxAdapter } = await import('@barefootjs/hono')

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

    const jsx = irToMarkedJsx(ir, 'Counter', signals)
    const result = honoMarkedJsxAdapter.generateMarkedJsxFile({
      sourcePath: 'TodoApp.tsx',
      components: [{
        name: 'TodoApp',
        props: [{ name: 'initialTodos', type: 'Todo[]', optional: false }],
        typeDefinitions: ['type Todo = { id: number; text: string; done: boolean }'],
        jsx,
        ir,
        signals,
        memos: [],
        childComponents: [],
      }],
      moduleConstants: [],
      originalImports: [],
    })

    expect(result).toContain('export function TodoApp({ initialTodos, "data-key": __dataKey, __listIndex }')
    expect(result).toContain('data-bf-props="TodoApp"')
    expect(result).toContain('__hydrateProps')
    // Check that list is generated with map
    expect(result).toContain('initialTodos?.map')
  })
})
