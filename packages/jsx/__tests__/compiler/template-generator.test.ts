/**
 * Template Generator Tests
 *
 * Tests for converting JSX elements in map expressions to template literal strings.
 */

import { describe, it, expect } from 'bun:test'
import ts from 'typescript'
import { jsxToTemplateString } from '../../src/compiler/template-generator'
import type { CompileResult } from '../../src/types'

/**
 * Parses JSX and extracts the first JSX element
 */
function parseJsxElement(source: string): {
  element: ts.JsxElement | ts.JsxSelfClosingElement
  sourceFile: ts.SourceFile
} {
  const sourceFile = ts.createSourceFile(
    'test.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  let element: ts.JsxElement | ts.JsxSelfClosingElement | null = null

  function visit(node: ts.Node): void {
    if (element) return

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      element = node
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (!element) {
    throw new Error('No JSX element found in source')
  }

  return { element, sourceFile }
}

/**
 * Creates a minimal CompileResult for testing component inlining
 */
function createMockCompileResult(
  name: string,
  options: {
    source?: string
    ir?: CompileResult['ir']
    props?: CompileResult['props']
  } = {}
): CompileResult {
  return {
    componentName: name,
    clientJs: '',
    signals: [],
    memos: [],
    moduleConstants: [],
    localFunctions: [],
    childInits: [],
    interactiveElements: [],
    dynamicElements: [],
    listElements: [],
    dynamicAttributes: [],
    refElements: [],
    conditionalElements: [],
    props: options.props ?? [],
    typeDefinitions: [],
    source: options.source ?? `function ${name}() { return <div /> }`,
    ir: options.ir ?? null,
    imports: [],
  }
}

describe('jsxToTemplateString', () => {
  describe('basic template generation', () => {
    it('converts simple element to template string', () => {
      const { element, sourceFile } = parseJsxElement('<li>Item</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<li>Item</li>`')
      expect(result.events).toEqual([])
    })

    it('converts self-closing element', () => {
      const { element, sourceFile } = parseJsxElement('<input type="text" />')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<input type="text" />`')
    })

    it('converts element with static attributes', () => {
      const { element, sourceFile } = parseJsxElement('<li class="item" id="test">Content</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<li class="item" id="test">Content</li>`')
    })

    it('converts element with dynamic expressions', () => {
      const { element, sourceFile } = parseJsxElement('<li>{item.name}</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<li>${item.name}</li>`')
    })

    it('converts element with dynamic attribute', () => {
      const { element, sourceFile } = parseJsxElement('<li class={item.className}>Content</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<li class="${item.className}">Content</li>`')
    })

    it('converts key attribute to data-key', () => {
      const { element, sourceFile } = parseJsxElement('<li key={item.id}>Content</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toContain('data-key="${item.id}"')
    })
  })

  describe('event handling', () => {
    it('converts onClick to data-event-id and collects event', () => {
      const { element, sourceFile } = parseJsxElement('<button onClick={() => remove(item.id)}>Delete</button>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toContain('data-index="${__index}"')
      expect(result.template).toContain('data-event-id="0"')
      expect(result.events.length).toBe(1)
      expect(result.events[0].eventName).toBe('click')
      expect(result.events[0].handler).toBe('() => remove(item.id)')
    })

    it('handles multiple events on same element', () => {
      const { element, sourceFile } = parseJsxElement('<input onInput={(e) => handleInput(e)} onBlur={() => validate()} />')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.events.length).toBe(2)
      expect(result.events[0].eventName).toBe('input')
      expect(result.events[1].eventName).toBe('blur')
      // Same element, same event-id
      expect(result.events[0].eventId).toBe(result.events[1].eventId)
    })

    it('assigns different event-id to different elements', () => {
      const { element, sourceFile } = parseJsxElement('<div><button onClick={() => a()}>A</button><button onClick={() => b()}>B</button></div>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.events.length).toBe(2)
      expect(result.events[0].eventId).toBe(0)
      expect(result.events[1].eventId).toBe(1)
    })
  })

  describe('nested elements', () => {
    it('converts nested elements', () => {
      const { element, sourceFile } = parseJsxElement('<li><span class="name">{item.name}</span></li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<li><span class="name">${item.name}</span></li>`')
    })

    it('converts deeply nested structure', () => {
      const { element, sourceFile } = parseJsxElement('<li><div><span>{item.text}</span></div></li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toBe('`<li><div><span>${item.text}</span></div></li>`')
    })

    it('preserves events on nested elements', () => {
      const { element, sourceFile } = parseJsxElement('<li><button onClick={() => remove(item.id)}>X</button></li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.events.length).toBe(1)
      expect(result.template).toContain('data-event-id')
    })
  })

  describe('conditional expressions', () => {
    it('converts ternary operator with text', () => {
      const { element, sourceFile } = parseJsxElement('<li>{item.done ? "Done" : "Pending"}</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toContain('${item.done ? "Done" : "Pending"}')
    })

    it('converts ternary operator with JSX elements', () => {
      const { element, sourceFile } = parseJsxElement('<li>{item.done ? <span class="done">Done</span> : <span class="pending">Pending</span>}</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toContain('${item.done ?')
      expect(result.template).toContain('class="done"')
      expect(result.template).toContain('class="pending"')
    })
  })

  describe('component inlining', () => {
    it('inlines component using IR', () => {
      const componentResult = createMockCompileResult('TodoItem', {
        ir: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [{ name: 'class', value: 'todo-item' }],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [{ type: 'expression', expression: 'text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        props: [{ name: 'text', type: 'string', optional: false }],
      })

      const components = new Map([['TodoItem', componentResult]])
      const { element, sourceFile } = parseJsxElement('<TodoItem text={todo.text} />')
      const result = jsxToTemplateString(element, sourceFile, 'todo', components)

      expect(result.template).toContain('class="todo-item"')
      expect(result.template).toContain('${todo.text}')
    })

    it('injects data-key when key prop is passed', () => {
      const componentResult = createMockCompileResult('TodoItem', {
        ir: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [{ type: 'expression', expression: 'text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        props: [{ name: 'text', type: 'string', optional: false }],
      })

      const components = new Map([['TodoItem', componentResult]])
      const { element, sourceFile } = parseJsxElement('<TodoItem key={todo.id} text={todo.text} />')
      const result = jsxToTemplateString(element, sourceFile, 'todo', components)

      expect(result.template).toContain('data-key="${todo.id}"')
    })

    it('handles event handlers in inlined component', () => {
      const componentResult = createMockCompileResult('TodoItem', {
        ir: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [{ name: 'onClick', eventName: 'click', handler: 'onToggle' }],
          children: [{ type: 'expression', expression: 'text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        props: [
          { name: 'text', type: 'string', optional: false },
          { name: 'onToggle', type: '() => void', optional: false },
        ],
      })

      const components = new Map([['TodoItem', componentResult]])
      const { element, sourceFile } = parseJsxElement('<TodoItem text={todo.text} onToggle={() => toggleTodo(todo.id)} />')
      const result = jsxToTemplateString(element, sourceFile, 'todo', components)

      expect(result.template).toContain('data-event-id')
      expect(result.events.length).toBe(1)
      // Handler should be substituted with the passed prop value
      expect(result.events[0].handler).toContain('toggleTodo(todo.id)')
    })

    it('handles spread props in component', () => {
      const componentResult = createMockCompileResult('TodoItem', {
        ir: {
          type: 'element',
          tagName: 'li',
          id: null,
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [{ type: 'expression', expression: 'text', isDynamic: false }],
          listInfo: null,
          dynamicContent: null,
        },
        props: [{ name: 'text', type: 'string', optional: false }],
      })

      const components = new Map([['TodoItem', componentResult]])
      const { element, sourceFile } = parseJsxElement('<TodoItem {...todo} />')
      const result = jsxToTemplateString(element, sourceFile, 'todo', components)

      // Spread props should be expanded to todo.text
      expect(result.template).toContain('${todo.text}')
    })
  })

  describe('complex scenarios', () => {
    it('handles todo item with checkbox and delete button', () => {
      const { element, sourceFile } = parseJsxElement(`
        <li class="todo-item">
          <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
          <span class={todo.done ? "done" : ""}>{todo.text}</span>
          <button onClick={() => remove(todo.id)}>X</button>
        </li>
      `)
      const result = jsxToTemplateString(element, sourceFile, 'todo')

      // Should have checkbox and button events
      expect(result.events.length).toBe(2)

      // Check event names
      const eventNames = result.events.map(e => e.eventName)
      expect(eventNames).toContain('change')
      expect(eventNames).toContain('click')

      // Template should have dynamic content (checked is boolean, so conditional output)
      expect(result.template).toContain("todo.done ? ' checked' : ''")
      expect(result.template).toContain('${todo.done ? "done" : ""}')
      expect(result.template).toContain('${todo.text}')
    })

    it('handles multiple dynamic attributes', () => {
      const { element, sourceFile } = parseJsxElement('<li class={item.className} style={item.style} data-id={item.id}>{item.name}</li>')
      const result = jsxToTemplateString(element, sourceFile, 'item')

      expect(result.template).toContain('class="${item.className}"')
      expect(result.template).toContain('style="${item.style}"')
      expect(result.template).toContain('data-id="${item.id}"')
    })
  })
})
