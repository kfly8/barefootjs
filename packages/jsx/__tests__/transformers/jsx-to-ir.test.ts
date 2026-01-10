/**
 * JSX to IR Transformer Tests
 *
 * Tests for converting JSX AST to Intermediate Representation (IR).
 */

import { describe, it, expect } from 'bun:test'
import ts from 'typescript'
import { jsxToIR, findAndConvertJsxReturn } from '../../src/transformers/jsx-to-ir'
import type {
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRComponent,
  IRConditional,
  IRFragment,
} from '../../src/types'
import {
  parseJsx,
  createContext,
  findJsxElement,
  testSignals,
  testMemos,
  createMockCompileResult,
} from './test-utils'

describe('jsxToIR', () => {
  describe('text node conversion', () => {
    // JSX-001: Plain text preserved
    it('JSX-001: converts plain text to IRText', () => {
      const source = '<div>Hello World</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.type).toBe('element')
      expect(result.children.length).toBe(1)
      expect(result.children[0].type).toBe('text')
      expect((result.children[0] as IRText).content).toBe('Hello World')
    })

    // JSX-002: Indentation whitespace removed
    it('JSX-002: removes whitespace-only text with newlines (indentation)', () => {
      const source = `<div>
        Hello
      </div>`
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      // Only the text "Hello" should remain, indentation whitespace is removed
      const textChildren = result.children.filter(c => c.type === 'text') as IRText[]
      expect(textChildren.length).toBe(1)
      expect(textChildren[0].content).toBe('Hello')
    })

    // JSX-003: Inline spaces preserved
    it('JSX-003: preserves inline spaces between elements', () => {
      // When JSX is on single line, inline whitespace between elements is preserved
      // But the JSX parser normalizes " " between sibling elements
      // Let's test with explicit text content
      const source = '<div><span>A</span>{" "}<span>B</span></div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      // Should have: span, expression " ", span
      expect(result.children.length).toBe(3)
      expect(result.children[0].type).toBe('element')
      expect(result.children[1].type).toBe('expression')
      expect((result.children[1] as IRExpression).expression).toBe('" "')
      expect(result.children[2].type).toBe('element')
    })
  })

  describe('element conversion', () => {
    // ATTR-001: String literals preserved
    it('ATTR-001: converts simple element with static attributes', () => {
      const source = '<div class="container" id="main">Content</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.type).toBe('element')
      expect(result.tagName).toBe('div')
      expect(result.staticAttrs).toContainEqual({ name: 'class', value: 'container' })
      expect(result.staticAttrs).toContainEqual({ name: 'id', value: 'main' })
      expect(result.id).toBeNull() // No dynamic features, no ID needed
    })

    // ATTR-010: Dynamic class
    it('ATTR-010: converts element with dynamic attributes', () => {
      const source = '<div class={isActive() ? "active" : "inactive"}>Content</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.type).toBe('element')
      expect(result.dynamicAttrs.length).toBe(1)
      expect(result.dynamicAttrs[0].name).toBe('class')
      expect(result.dynamicAttrs[0].expression).toContain('isActive()')
      expect(result.id).not.toBeNull() // Has dynamic attrs, needs ID
    })

    // EVT-001: Click handler
    it('EVT-001: converts element with events', () => {
      const source = '<button onClick={() => setCount(n => n + 1)}>Click me</button>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.type).toBe('element')
      expect(result.tagName).toBe('button')
      expect(result.events.length).toBe(1)
      expect(result.events[0].name).toBe('onClick')
      expect(result.events[0].eventName).toBe('click')
      expect(result.events[0].handler).toContain('setCount')
      expect(result.id).not.toBeNull() // Has events, needs ID
    })

    // EVT-002: Multiple same-type handlers
    it('EVT-002: converts element with multiple events', () => {
      const source = '<input onInput={(e) => setName(e.target.value)} onBlur={() => console.log("blur")} />'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.events.length).toBe(2)
      expect(result.events[0].eventName).toBe('input')
      expect(result.events[1].eventName).toBe('blur')
    })

    // REF-001: Ref callback
    it('REF-001: converts element with ref', () => {
      const source = '<input ref={(el) => inputRef = el} />'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.ref).toBe('(el) => inputRef = el')
      expect(result.id).not.toBeNull() // Has ref, needs ID
    })

    // JSX-004: Nested elements preserved
    it('JSX-004: converts nested elements', () => {
      const source = '<div><p>Paragraph</p><span>Span</span></div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children.length).toBe(2)
      expect((result.children[0] as IRElement).tagName).toBe('p')
      expect((result.children[1] as IRElement).tagName).toBe('span')
    })

    // ATTR-002: Boolean shorthand → true
    it('ATTR-002: converts element with boolean shorthand attribute', () => {
      const source = '<input disabled />'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.staticAttrs).toContainEqual({ name: 'disabled', value: '' })
    })

    // ATTR-020: Spread preserved
    it('ATTR-020: handles spread attributes', () => {
      const source = '<div {...props}>Content</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.spreadAttrs.length).toBe(1)
      expect(result.spreadAttrs[0].expression).toBe('props')
    })
  })

  describe('self-closing element conversion', () => {
    // JSX-005: Self-closing preserved
    it('JSX-005: converts self-closing element', () => {
      const source = '<input type="text" />'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.type).toBe('element')
      expect(result.tagName).toBe('input')
      expect(result.children).toEqual([])
      expect(result.staticAttrs).toContainEqual({ name: 'type', value: 'text' })
    })

    // JSX-006: Void elements supported
    it('JSX-006: converts br tag', () => {
      const source = '<br />'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.tagName).toBe('br')
      expect(result.children).toEqual([])
    })

    // JSX-007: Attributes on void elements
    it('JSX-007: converts img tag with attributes', () => {
      const source = '<img src="test.png" alt="Test" />'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.tagName).toBe('img')
      expect(result.staticAttrs).toContainEqual({ name: 'src', value: 'test.png' })
      expect(result.staticAttrs).toContainEqual({ name: 'alt', value: 'Test' })
    })
  })

  describe('fragment conversion', () => {
    // JSX-008: Empty fragment
    it('JSX-008: converts empty fragment', () => {
      const source = '<></>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRFragment
      expect(result.type).toBe('fragment')
      expect(result.children).toEqual([])
    })

    // JSX-009: Fragment with children
    it('JSX-009: converts fragment with children', () => {
      const source = '<><p>First</p><p>Second</p></>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRFragment
      expect(result.type).toBe('fragment')
      expect(result.children.length).toBe(2)
      expect((result.children[0] as IRElement).tagName).toBe('p')
      expect((result.children[1] as IRElement).tagName).toBe('p')
    })
  })

  describe('expression conversion', () => {
    // Static expression (not in SPEC as it's basic JS)
    it('converts static expression', () => {
      const source = '<div>{1 + 1}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children.length).toBe(1)
      expect(result.children[0].type).toBe('expression')
      expect((result.children[0] as IRExpression).expression).toBe('1 + 1')
      expect((result.children[0] as IRExpression).isDynamic).toBe(false)
    })

    // EXPR-020: Signal call
    it('EXPR-020: converts signal call expression as dynamic', () => {
      const source = '<div>{count()}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children.length).toBe(1)
      expect(result.children[0].type).toBe('expression')
      expect((result.children[0] as IRExpression).expression).toBe('count()')
      expect((result.children[0] as IRExpression).isDynamic).toBe(true)
      expect(result.id).not.toBeNull() // Has dynamic content
    })

    // EXPR-024: Memo call
    it('EXPR-024: converts memo call expression as dynamic', () => {
      const source = '<div>{doubled()}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals, memos: testMemos })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children[0].type).toBe('expression')
      expect((result.children[0] as IRExpression).isDynamic).toBe(true)
    })

    // EXPR-025: Prop reference is static (accessed via props.propName in SolidJS style)
    // Props are now accessed via getter pattern, so standalone prop names are not reactive
    it('EXPR-025: prop reference alone is not reactive (use props.propName pattern)', () => {
      const source = '<div>{value}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { valueProps: ['value'] })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children[0].type).toBe('expression')
      // Props accessed via props.propName pattern - standalone prop name is not reactive
      expect((result.children[0] as IRExpression).isDynamic).toBe(false)
    })

    // EXPR-026: Children always dynamic
    it('EXPR-026: treats children as dynamic for lazy children pattern', () => {
      const source = '<div>{children}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children[0].type).toBe('expression')
      expect((result.children[0] as IRExpression).expression).toBe('children')
      expect((result.children[0] as IRExpression).isDynamic).toBe(true)
    })
  })

  describe('conditional conversion', () => {
    // CTRL-002: Dynamic text ternary
    it('CTRL-002: converts ternary operator to IRConditional', () => {
      const source = '<div>{isActive() ? "Yes" : "No"}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.children.length).toBe(1)
      expect(result.children[0].type).toBe('conditional')
      const cond = result.children[0] as IRConditional
      expect(cond.condition).toBe('isActive()')
      expect(cond.whenTrue.type).toBe('expression')
      expect(cond.whenFalse.type).toBe('expression')
    })

    // CTRL-003: Element ternary
    it('CTRL-003: converts ternary with JSX elements', () => {
      const source = '<div>{isActive() ? <span>Active</span> : <span>Inactive</span>}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      const cond = result.children[0] as IRConditional
      expect(cond.whenTrue.type).toBe('element')
      expect((cond.whenTrue as IRElement).tagName).toBe('span')
      expect(cond.whenFalse.type).toBe('element')
      expect(cond.id).not.toBeNull() // Dynamic conditional with JSX branches
    })

    // CTRL-004: Logical AND
    it('CTRL-004: converts logical AND with JSX', () => {
      const source = '<div>{isActive() && <span>Active</span>}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      const cond = result.children[0] as IRConditional
      expect(cond.type).toBe('conditional')
      expect(cond.condition).toBe('isActive()')
      expect(cond.whenTrue.type).toBe('element')
      expect(cond.whenFalse.type).toBe('expression')
      expect((cond.whenFalse as IRExpression).expression).toBe('null')
    })

    // CTRL-005: Logical OR
    it('CTRL-005: converts logical OR with JSX', () => {
      const source = '<div>{loading || <span>Content</span>}</div>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile)
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      const cond = result.children[0] as IRConditional
      expect(cond.type).toBe('conditional')
      expect(cond.condition).toBe('!(loading)')
      expect(cond.whenTrue.type).toBe('element')
    })

    // CTRL-009: Static conditional
    it('CTRL-009: assigns ID only for dynamic conditionals with JSX branches', () => {
      // Static condition (no signals)
      const sourceStatic = '<div>{true ? <span>Yes</span> : <span>No</span>}</div>'
      const sourceFileStatic = parseJsx(sourceStatic)
      const ctxStatic = createContext(sourceFileStatic)
      const jsxStatic = findJsxElement(sourceFileStatic)!

      const resultStatic = jsxToIR(jsxStatic, ctxStatic) as IRElement
      const condStatic = resultStatic.children[0] as IRConditional
      expect(condStatic.id).toBeNull() // Static condition

      // Dynamic condition
      const sourceDynamic = '<div>{isActive() ? <span>Yes</span> : <span>No</span>}</div>'
      const sourceFileDynamic = parseJsx(sourceDynamic)
      const ctxDynamic = createContext(sourceFileDynamic, { signals: testSignals })
      const jsxDynamic = findJsxElement(sourceFileDynamic)!

      const resultDynamic = jsxToIR(jsxDynamic, ctxDynamic) as IRElement
      const condDynamic = resultDynamic.children[0] as IRConditional
      expect(condDynamic.id).not.toBeNull() // Dynamic condition
    })
  })

  describe('component conversion', () => {
    // COMP-002: Static props
    it('COMP-002: converts component with static props', () => {
      const source = '<Counter initial={5} />'
      const sourceFile = parseJsx(source)
      const components = new Map([['Counter', createMockCompileResult('Counter')]])
      const ctx = createContext(sourceFile, { components })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.type).toBe('component')
      expect(result.name).toBe('Counter')
      expect(result.props.length).toBe(1)
      expect(result.props[0].name).toBe('initial')
      expect(result.props[0].value).toBe('5')
      expect(result.props[0].isDynamic).toBe(false)
    })

    // COMP-003: Dynamic props (marked reactive)
    it('COMP-003: converts component with dynamic props', () => {
      const source = '<Counter value={count()} />'
      const sourceFile = parseJsx(source)
      const components = new Map([['Counter', createMockCompileResult('Counter')]])
      const ctx = createContext(sourceFile, { components, signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.props[0].isDynamic).toBe(true)
    })

    // COMP-002: Static props (string)
    it('COMP-002b: converts component with string props', () => {
      const source = '<Button label="Click me" />'
      const sourceFile = parseJsx(source)
      const components = new Map([['Button', createMockCompileResult('Button')]])
      const ctx = createContext(sourceFile, { components })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.props[0].name).toBe('label')
      expect(result.props[0].value).toBe('"Click me"')
      expect(result.props[0].isDynamic).toBe(false)
    })

    // COMP-006: Boolean shorthand prop
    it('COMP-006: converts component with boolean shorthand', () => {
      const source = '<Toggle checked />'
      const sourceFile = parseJsx(source)
      const components = new Map([['Toggle', createMockCompileResult('Toggle')]])
      const ctx = createContext(sourceFile, { components })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.props[0].name).toBe('checked')
      expect(result.props[0].value).toBe('true')
    })

    // COMP-005: Children
    it('COMP-005: converts component with children', () => {
      const source = '<Card><p>Content</p></Card>'
      const sourceFile = parseJsx(source)
      const components = new Map([['Card', createMockCompileResult('Card')]])
      const ctx = createContext(sourceFile, { components })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.children.length).toBe(1)
      expect((result.children[0] as IRElement).tagName).toBe('p')
    })

    // COMP-004: Spread props
    it('COMP-004: converts component with spread props', () => {
      const source = '<Button {...buttonProps} />'
      const sourceFile = parseJsx(source)
      const components = new Map([['Button', createMockCompileResult('Button')]])
      const ctx = createContext(sourceFile, { components })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.spreadProps.length).toBe(1)
      expect(result.spreadProps[0].expression).toBe('buttonProps')
    })

    // COMP-032: Child init calling
    it('COMP-032: sets childInits for component needing client init', () => {
      const source = '<Counter value={count()} />'
      const sourceFile = parseJsx(source)
      const counterResult = createMockCompileResult('Counter')
      counterResult.signals = [{ getter: 'count', setter: 'setCount', initialValue: '0' }]
      const components = new Map([['Counter', counterResult]])
      const ctx = createContext(sourceFile, { components, signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.childInits).not.toBeNull()
      expect(result.childInits!.name).toBe('Counter')
    })

    // COMP-020: Lazy children (reactive)
    it('COMP-020: marks reactive children as lazy', () => {
      const source = '<Card>{count()}</Card>'
      const sourceFile = parseJsx(source)
      const components = new Map([['Card', createMockCompileResult('Card')]])
      const ctx = createContext(sourceFile, { components, signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRComponent
      expect(result.hasLazyChildren).toBe(true)
    })
  })

  describe('list (map) processing', () => {
    // CTRL-010: Basic map (key is required)
    it('CTRL-010: extracts listInfo from map expression', () => {
      const source = '<ul>{items().map(item => <li key={item.id}>{item}</li>)}</ul>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.tagName).toBe('ul')
      expect(result.listInfo).not.toBeNull()
      expect(result.listInfo!.arrayExpression).toBe('items()')
      expect(result.listInfo!.paramName).toBe('item')
      expect(result.listInfo!.keyExpression).toBe('item.id')
      expect(result.id).not.toBeNull() // Has list, needs ID
    })

    // CTRL-012: Key attribute
    it('CTRL-012: extracts key from list item', () => {
      const source = '<ul>{items().map(item => <li key={item.id}>{item.name}</li>)}</ul>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.listInfo!.keyExpression).toBe('item.id')
    })

    // CTRL-013: Index key
    it('CTRL-013: uses __index for index-based key', () => {
      const source = '<ul>{items().map((item, index) => <li key={index}>{item}</li>)}</ul>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.listInfo!.keyExpression).toBe('__index')
    })

    // CTRL-010: Basic map (item IR generation)
    it('CTRL-010b: generates itemIR for server JSX', () => {
      const source = '<ul>{items().map(item => <li key={item.id} class="todo">{item.text}</li>)}</ul>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.listInfo!.itemIR).not.toBeNull()
      expect(result.listInfo!.itemIR!.type).toBe('element')
      expect((result.listInfo!.itemIR as IRElement).tagName).toBe('li')
    })
  })

  describe('dynamic content detection', () => {
    // EXPR-020: Signal call (dynamic content detection)
    it('EXPR-020b: detects dynamic content and sets dynamicContent', () => {
      const source = '<span>{count()}</span>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.dynamicContent).not.toBeNull()
      expect(result.dynamicContent!.expression).toBe('count()')
      expect(result.dynamicContent!.fullContent).toBe('count()')
    })

    // EXPR-023: Text + dynamic
    it('EXPR-023: builds fullContent with multiple parts', () => {
      const source = '<span>Count: {count()}</span>'
      const sourceFile = parseJsx(source)
      const ctx = createContext(sourceFile, { signals: testSignals })
      const jsx = findJsxElement(sourceFile)!

      const result = jsxToIR(jsx, ctx) as IRElement
      expect(result.dynamicContent).not.toBeNull()
      expect(result.dynamicContent!.fullContent).toContain('"Count: "')
      expect(result.dynamicContent!.fullContent).toContain('count()')
    })
  })
})

describe('findAndConvertJsxReturn', () => {
  it('finds and converts component JSX return', () => {
    const source = `
      "use client"
      function Counter() {
        return <div>Counter</div>
      }
    `
    const sourceFile = parseJsx(source)
    const ctx = createContext(sourceFile)

    const result = findAndConvertJsxReturn(sourceFile, ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('element')
    expect((result as IRElement).tagName).toBe('div')
  })

  it('finds specific component by name', () => {
    const source = `
      "use client"
      function Header() {
        return <header>Header</header>
      }
      function Footer() {
        return <footer>Footer</footer>
      }
    `
    const sourceFile = parseJsx(source)
    const ctx = createContext(sourceFile)

    const result = findAndConvertJsxReturn(sourceFile, ctx, 'Footer')
    expect(result).not.toBeNull()
    expect((result as IRElement).tagName).toBe('footer')
  })

  it('handles parenthesized return', () => {
    const source = `
      "use client"
      function Component() {
        return (
          <div>
            <p>Content</p>
          </div>
        )
      }
    `
    const sourceFile = parseJsx(source)
    const ctx = createContext(sourceFile)

    const result = findAndConvertJsxReturn(sourceFile, ctx)
    expect(result).not.toBeNull()
    expect((result as IRElement).tagName).toBe('div')
  })

  it('handles fragment return', () => {
    const source = `
      "use client"
      function Component() {
        return (
          <>
            <p>First</p>
            <p>Second</p>
          </>
        )
      }
    `
    const sourceFile = parseJsx(source)
    const ctx = createContext(sourceFile)

    const result = findAndConvertJsxReturn(sourceFile, ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('fragment')
  })

  it('returns null for non-component functions', () => {
    const source = `
      "use client"
      function helper() {
        return 42
      }
    `
    const sourceFile = parseJsx(source)
    const ctx = createContext(sourceFile)

    const result = findAndConvertJsxReturn(sourceFile, ctx)
    expect(result).toBeNull()
  })
})
