/**
 * GoTemplateAdapter - Tests
 */

import { describe, test, expect } from 'bun:test'
import { GoTemplateAdapter } from '../adapter/go-template-adapter'
import type {
  ComponentIR,
  IRElement,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRSlot,
} from '@barefootjs/jsx'

// Helper to create minimal source location
const loc = {
  file: 'test.tsx',
  start: { line: 1, column: 0 },
  end: { line: 1, column: 0 },
}

describe('GoTemplateAdapter', () => {
  const adapter = new GoTemplateAdapter()

  describe('renderElement', () => {
    test('renders simple element', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'div',
        attrs: [],
        events: [],
        ref: null,
        children: [{ type: 'text', value: 'Hello', loc }],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<div>Hello</div>')
    })

    test('renders element with static attributes', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'div',
        attrs: [
          { name: 'class', value: 'container', dynamic: false, isLiteral: true, loc },
          { name: 'id', value: 'main', dynamic: false, isLiteral: true, loc },
        ],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<div class="container" id="main"></div>')
    })

    test('renders element with dynamic attribute', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'div',
        attrs: [{ name: 'class', value: 'className', dynamic: true, isLiteral: false, loc }],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<div class="{{.ClassName}}"></div>')
    })

    test('renders element with scope marker', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'div',
        attrs: [],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: true,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<div data-bf-scope="{{.ScopeID}}"></div>')
    })

    test('renders element with slot marker', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'span',
        attrs: [],
        events: [],
        ref: null,
        children: [],
        slotId: 's0',
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<span data-bf="s0"></span>')
    })

    test('renders void element without closing tag', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'input',
        attrs: [{ name: 'type', value: 'text', dynamic: false, isLiteral: true, loc }],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<input type="text">')
    })
  })

  describe('renderExpression', () => {
    test('renders simple expression', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'count',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('{{.Count}}')
    })

    test('renders signal call expression', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'count()',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('{{.Count}}')
    })

    test('renders property access expression', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'user.name',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('{{.User.Name}}')
    })

    test('renders reactive expression with slot marker', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'count()',
        typeInfo: null,
        reactive: true,
        slotId: 's0',
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('<span data-bf="s0">{{.Count}}</span>')
    })
  })

  describe('renderConditional', () => {
    test('renders conditional without else', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'isVisible',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Visible', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if .IsVisible}}Visible{{end}}')
    })

    test('renders conditional with else', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'isLoggedIn',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Welcome', loc },
        whenFalse: { type: 'text', value: 'Please login', loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if .IsLoggedIn}}Welcome{{else}}Please login{{end}}')
    })
  })

  describe('renderLoop', () => {
    test('renders loop with index', () => {
      const loop: IRLoop = {
        type: 'loop',
        array: 'items',
        arrayType: null,
        itemType: null,
        param: 'item',
        index: 'i',
        key: null,
        children: [{ type: 'text', value: 'Item', loc }],
        slotId: null,
        loc,
      }

      const result = adapter.renderLoop(loop)
      expect(result).toBe('{{range $i, $item := .Items}}Item{{end}}')
    })

    test('renders loop without index', () => {
      const loop: IRLoop = {
        type: 'loop',
        array: 'items',
        arrayType: null,
        itemType: null,
        param: 'item',
        index: null,
        key: null,
        children: [{ type: 'text', value: 'Item', loc }],
        slotId: null,
        loc,
      }

      const result = adapter.renderLoop(loop)
      expect(result).toBe('{{range $_, $item := .Items}}Item{{end}}')
    })
  })

  describe('renderComponent', () => {
    test('renders component as template call', () => {
      const comp: IRComponent = {
        type: 'component',
        name: 'Button',
        props: [],
        propsType: null,
        children: [],
        template: '',
        slotId: null,
        loc,
      }

      const result = adapter.renderComponent(comp)
      expect(result).toBe('{{template "Button" .}}')
    })
  })

  describe('generate', () => {
    test('generates complete template', () => {
      const ir: ComponentIR = {
        version: '0.1',
        metadata: {
          componentName: 'Counter',
          hasDefaultExport: false,
          typeDefinitions: [],
          propsType: null,
          propsParams: [],
          restPropsName: null,
          signals: [
            {
              getter: 'count',
              setter: 'setCount',
              initialValue: '0',
              type: { kind: 'primitive', raw: 'number', primitive: 'number' },
              loc,
            },
          ],
          memos: [],
          effects: [],
          imports: [],
          localFunctions: [],
          localConstants: [],
        },
        root: {
          type: 'element',
          tag: 'div',
          attrs: [],
          events: [],
          ref: null,
          children: [
            {
              type: 'element',
              tag: 'p',
              attrs: [],
              events: [],
              ref: null,
              children: [
                {
                  type: 'expression',
                  expr: 'count()',
                  typeInfo: null,
                  reactive: true,
                  slotId: 's0',
                  loc,
                },
              ],
              slotId: 's0',
              needsScope: false,
              loc,
            },
            {
              type: 'element',
              tag: 'button',
              attrs: [],
              events: [{ name: 'click', handler: '() => setCount(n => n + 1)', loc }],
              ref: null,
              children: [{ type: 'text', value: '+1', loc }],
              slotId: 's1',
              needsScope: false,
              loc,
            },
          ],
          slotId: null,
          needsScope: true,
          loc,
        },
        errors: [],
      }

      const result = adapter.generate(ir)

      expect(result.extension).toBe('.tmpl')
      expect(result.template).toContain('{{define "Counter"}}')
      expect(result.template).toContain('{{end}}')
      expect(result.template).toContain('data-bf-scope="{{.ScopeID}}"')
      expect(result.template).toContain('{{.Count}}')
    })

    test('generates Go struct types', () => {
      const ir: ComponentIR = {
        version: '0.1',
        metadata: {
          componentName: 'Counter',
          hasDefaultExport: false,
          typeDefinitions: [],
          propsType: null,
          propsParams: [
            {
              name: 'initial',
              type: { kind: 'primitive', raw: 'number', primitive: 'number' },
              optional: true,
              defaultValue: '0',
            },
          ],
          restPropsName: null,
          signals: [
            {
              getter: 'count',
              setter: 'setCount',
              initialValue: '0',
              type: { kind: 'primitive', raw: 'number', primitive: 'number' },
              loc,
            },
          ],
          memos: [],
          effects: [],
          imports: [],
          localFunctions: [],
          localConstants: [],
        },
        root: {
          type: 'element',
          tag: 'div',
          attrs: [],
          events: [],
          ref: null,
          children: [],
          slotId: null,
          needsScope: false,
          loc,
        },
        errors: [],
      }

      const result = adapter.generate(ir)

      expect(result.types).toBeDefined()
      expect(result.types).toContain('package components')
      expect(result.types).toContain('type CounterProps struct')
      expect(result.types).toContain('ScopeID string')
      expect(result.types).toContain('Initial int')
      expect(result.types).toContain('Count int')
    })
  })

  describe('generateTypes', () => {
    test('generates types with custom package name', () => {
      const customAdapter = new GoTemplateAdapter({ packageName: 'views' })

      const ir: ComponentIR = {
        version: '0.1',
        metadata: {
          componentName: 'Button',
          hasDefaultExport: false,
          typeDefinitions: [],
          propsType: null,
          propsParams: [
            {
              name: 'label',
              type: { kind: 'primitive', raw: 'string', primitive: 'string' },
              optional: false,
            },
          ],
          restPropsName: null,
          signals: [],
          memos: [],
          effects: [],
          imports: [],
          localFunctions: [],
          localConstants: [],
        },
        root: {
          type: 'element',
          tag: 'button',
          attrs: [],
          events: [],
          ref: null,
          children: [],
          slotId: null,
          needsScope: false,
          loc,
        },
        errors: [],
      }

      const types = customAdapter.generateTypes(ir)

      expect(types).toContain('package views')
      expect(types).toContain('type ButtonProps struct')
      expect(types).toContain('Label string')
    })
  })
})
