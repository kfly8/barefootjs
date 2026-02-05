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
import { parseExpression, parseBlockBody } from '@barefootjs/jsx'
import ts from 'typescript'

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

    test('converts className to class attribute', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'div',
        attrs: [{ name: 'className', value: 'container', dynamic: false, isLiteral: true, loc }],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<div class="container"></div>')
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

    test('renders simple ternary in attribute', () => {
      const element: IRElement = {
        type: 'element',
        tag: 'div',
        attrs: [
          {
            name: 'class',
            value: "isActive ? 'active' : ''",
            dynamic: true,
            isLiteral: false,
            loc,
          },
        ],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe('<div class="{{if .IsActive}}active{{else}}{{end}}"></div>')
    })

    test('renders nested ternary in class attribute', () => {
      // Bug fix: PR #222 - nested ternary was generating broken Go template
      // Input: todo.done ? (todo.editing ? 'completed editing' : 'completed') : (todo.editing ? 'editing' : '')
      const element: IRElement = {
        type: 'element',
        tag: 'li',
        attrs: [
          {
            name: 'class',
            value:
              "todo.done ? (todo.editing ? 'completed editing' : 'completed') : (todo.editing ? 'editing' : '')",
            dynamic: true,
            isLiteral: false,
            loc,
          },
        ],
        events: [],
        ref: null,
        children: [],
        slotId: null,
        needsScope: false,
        loc,
      }

      const result = adapter.renderElement(element)
      expect(result).toBe(
        '<li class="{{if .Todo.Done}}{{if .Todo.Editing}}completed editing{{else}}completed{{end}}{{else}}{{if .Todo.Editing}}editing{{else}}{{end}}{{end}}"></li>'
      )
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
      expect(result).toBe('<div data-bf-scope="{{.ScopeID}}" {{bfIsChild .ScopeID}}></div>')
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

    test('renders reactive conditional with null false branch as comment markers', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'isChecked()',
        conditionType: null,
        reactive: true,
        whenTrue: {
          type: 'element',
          tag: 'svg',
          attrs: [],
          events: [],
          ref: null,
          children: [],
          slotId: null,
          needsScope: false,
          loc,
        },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: 'slot_1',
        loc,
      }

      const result = adapter.renderConditional(cond)
      // Should output empty markers for null branch (for client hydration)
      expect(result).toContain('{{else}}')
      expect(result).toContain('{{bfComment "cond-start:slot_1"}}')
      expect(result).toContain('{{bfComment "cond-end:slot_1"}}')
    })

    test('renders reactive conditional with undefined false branch as comment markers', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'isChecked()',
        conditionType: null,
        reactive: true,
        whenTrue: {
          type: 'element',
          tag: 'svg',
          attrs: [],
          events: [],
          ref: null,
          children: [],
          slotId: null,
          needsScope: false,
          loc,
        },
        whenFalse: { type: 'expression', expr: 'undefined', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: 'slot_1',
        loc,
      }

      const result = adapter.renderConditional(cond)
      // Should output empty markers for undefined branch (for client hydration)
      expect(result).toContain('{{else}}')
      expect(result).toContain('{{bfComment "cond-start:slot_1"}}')
      expect(result).toContain('{{bfComment "cond-end:slot_1"}}')
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
        isStaticArray: true,
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
        isStaticArray: true,
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
      // Outside of loops, components are referenced via .ComponentName
      expect(result).toBe('{{template "Button" .Button}}')
    })

    test('renders component with slotId using unique field name', () => {
      const comp: IRComponent = {
        type: 'component',
        name: 'ReactiveChild',
        props: [
          { name: 'value', value: 'count()', dynamic: true, isLiteral: false, loc },
          { name: 'label', value: 'Child A', dynamic: false, isLiteral: true, loc },
        ],
        propsType: null,
        children: [],
        template: '',
        slotId: 'slot_6',
        loc,
      }

      const result = adapter.renderComponent(comp)
      // With slotId, use unique field name: ComponentName + Slot + number
      expect(result).toBe('{{template "ReactiveChild" .ReactiveChildSlot6}}')
    })

    test('renders different components with different slotIds', () => {
      const comp1: IRComponent = {
        type: 'component',
        name: 'ReactiveChild',
        props: [],
        propsType: null,
        children: [],
        template: '',
        slotId: 'slot_6',
        loc,
      }

      const comp2: IRComponent = {
        type: 'component',
        name: 'ReactiveChild',
        props: [],
        propsType: null,
        children: [],
        template: '',
        slotId: 'slot_7',
        loc,
      }

      expect(adapter.renderComponent(comp1)).toBe('{{template "ReactiveChild" .ReactiveChildSlot6}}')
      expect(adapter.renderComponent(comp2)).toBe('{{template "ReactiveChild" .ReactiveChildSlot7}}')
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

    test('generates fields for multiple static child components with slotId', () => {
      // Parent component with two child components having different slotIds
      const ir: ComponentIR = {
        version: '0.1',
        metadata: {
          componentName: 'ReactiveProps',
          hasDefaultExport: true,
          isClientComponent: true,
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
          memos: [
            {
              name: 'doubled',
              computation: '() => count() * 2',
              deps: ['count'],
              type: { kind: 'primitive', raw: 'number', primitive: 'number' },
            },
          ],
          effects: [],
          onMounts: [],
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
          needsScope: true,
          slotId: null,
          loc,
          children: [
            {
              type: 'component',
              name: 'ReactiveChild',
              props: [
                { name: 'value', value: 'count()', dynamic: true, isLiteral: false, loc },
                { name: 'label', value: 'Child A', dynamic: false, isLiteral: true, loc },
              ],
              propsType: null,
              children: [],
              template: '',
              slotId: 'slot_6',
              loc,
            },
            {
              type: 'component',
              name: 'ReactiveChild',
              props: [
                { name: 'value', value: 'doubled()', dynamic: true, isLiteral: false, loc },
                { name: 'label', value: 'Child B (doubled)', dynamic: false, isLiteral: true, loc },
              ],
              propsType: null,
              children: [],
              template: '',
              slotId: 'slot_7',
              loc,
            },
          ],
        },
        errors: [],
      }

      const types = adapter.generateTypes(ir)

      // Props struct should have fields for each child instance
      expect(types).toContain('ReactiveChildSlot6 ReactiveChildProps `json:"-"`')
      expect(types).toContain('ReactiveChildSlot7 ReactiveChildProps `json:"-"`')

      // NewReactivePropsProps should initialize each child
      expect(types).toContain('ReactiveChildSlot6: NewReactiveChildProps(ReactiveChildInput{')
      expect(types).toContain('ReactiveChildSlot7: NewReactiveChildProps(ReactiveChildInput{')
      expect(types).toContain('ScopeID: scopeID + "_slot_6"')
      expect(types).toContain('ScopeID: scopeID + "_slot_7"')
      expect(types).toContain('Label: "Child A"')
      expect(types).toContain('Label: "Child B (doubled)"')
    })
  })

  describe('expression conversion improvements', () => {
    test('converts string literal comparison', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: "filter() === 'all'",
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'All', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if eq .Filter "all"}}All{{end}}')
    })

    test('converts numeric comparison', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'count() > 0',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Has items', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if gt .Count 0}}Has items{{end}}')
    })

    test('converts .length to len', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'items().length',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('{{len .Items}}')
    })

    test('converts .length in condition', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'todos().length > 0',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Has todos', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if gt (len .Todos) 0}}Has todos{{end}}')
    })

    test('converts logical AND', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'isLoggedIn() && isAdmin()',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Admin', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if and .IsLoggedIn .IsAdmin}}Admin{{end}}')
    })

    test('converts negation', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: '!isLoading()',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Loaded', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('{{if not .IsLoading}}Loaded{{end}}')
    })
  })

  describe('higher-order methods SSR support', () => {
    test('renders filter().length using bf_filter function', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'todos().filter(t => !t.done).length',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      // Should render as: {{len (bf_filter .Todos "Done" false)}}
      expect(result).toBe('{{len (bf_filter .Todos "Done" false)}}')
    })

    test('renders every() using bf_every function', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'todos().every(t => t.done)',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      // Should render as: {{bf_every .Todos "Done"}}
      expect(result).toBe('{{bf_every .Todos "Done"}}')
    })

    test('renders some() using bf_some function', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: 'todos().some(t => t.important)',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      // Should render as: {{bf_some .Todos "Important"}}
      expect(result).toBe('{{bf_some .Todos "Important"}}')
    })

    test('renders filter().length in condition', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'todos().filter(t => !t.done).length > 0',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Has incomplete', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      // filter().length > 0 should be supported now
      expect(result).toContain('{{if gt')
      expect(result).toContain('Has incomplete')
    })

    test('renders loop with filterPredicate as range+if', () => {
      const predicateExpr = '!t.done'
      const loop: IRLoop = {
        type: 'loop',
        array: 'todos',
        arrayType: null,
        itemType: null,
        param: 'todo',
        index: null,
        key: null,
        children: [{ type: 'text', value: 'Item', loc }],
        slotId: null,
        isStaticArray: true,
        filterPredicate: {
          param: 't',
          predicate: parseExpression(predicateExpr),
          raw: predicateExpr,
        },
        loc,
      }

      const result = adapter.renderLoop(loop)
      // Should render as: {{range $_, $todo := .Todos}}{{if not .Done}}Item{{end}}{{end}}
      expect(result).toContain('{{range')
      expect(result).toContain('{{if not .Done}}')
      expect(result).toContain('Item')
      expect(result).toContain('{{end}}{{end}}')
    })
  })

  describe('@client directive', () => {
    test('renders client-only expression as comment marker', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: "todos().every(t => t.done)",
        typeInfo: null,
        reactive: false,
        slotId: 'slot_5',
        loc,
        clientOnly: true,
      }

      const result = adapter.renderExpression(expr)
      // New implementation: renders comment marker instead of template element
      expect(result).toBe('{{bfComment "client:slot_5"}}')
    })

    test('renders client-only expression without slotId as empty string', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: "todos().every(t => t.done)",
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
        clientOnly: true,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('')
    })

    test('renders client-only conditional as comment markers', () => {
      // Client-only conditionals use comment markers for insert() on client side
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'todos().every(t => t.done)',
        conditionType: null,
        reactive: false,
        whenTrue: {
          type: 'element',
          tag: 'span',
          attrs: [],
          events: [],
          ref: null,
          children: [{ type: 'text', value: 'All done!', loc }],
          slotId: null,
          needsScope: false,
          loc,
        },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: 'slot_3',
        loc,
        clientOnly: true,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toContain('{{bfComment "cond-start:slot_3"}}')
      expect(result).toContain('{{bfComment "cond-end:slot_3"}}')
    })

    test('renders empty for client-only conditional without slotId', () => {
      // Client-only conditionals without slotId return empty string
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'todos().every(t => t.done)',
        conditionType: null,
        reactive: false,
        whenTrue: {
          type: 'element',
          tag: 'span',
          attrs: [],
          events: [],
          ref: null,
          children: [{ type: 'text', value: 'All done!', loc }],
          slotId: null,
          needsScope: false,
          loc,
        },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
        clientOnly: true,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toBe('')
    })
  })

  describe('Portal component handling', () => {
    test('renders Portal component with children as portal collection', () => {
      // Portal component should add its children to PortalCollector
      const portalComp: IRComponent = {
        type: 'component',
        name: 'Portal',
        props: [],
        propsType: null,
        children: [
          {
            type: 'element',
            tag: 'div',
            attrs: [{ name: 'data-slot', value: 'dialog-overlay', dynamic: false, isLiteral: true, loc }],
            events: [],
            ref: null,
            children: [],
            slotId: null,
            needsScope: false,
            loc,
          },
        ],
        template: '',
        slotId: 'slot_portal_1',
        loc,
      }

      const result = adapter.renderComponent(portalComp)
      // Portal should use PortalCollector instead of normal template call
      expect(result).toContain('.Portals.Add')
      // Content is escaped for Go string literal (quotes become \")
      expect(result).toContain('data-slot=\\"dialog-overlay\\"')
    })

    test('renders Portal with dynamic attribute in children', () => {
      // Portal with dynamic content (e.g., data-state based on open prop)
      const portalComp: IRComponent = {
        type: 'component',
        name: 'Portal',
        props: [],
        propsType: null,
        children: [
          {
            type: 'element',
            tag: 'div',
            attrs: [
              { name: 'data-slot', value: 'dialog-overlay', dynamic: false, isLiteral: true, loc },
              { name: 'data-state', value: "open ? 'open' : 'closed'", dynamic: true, isLiteral: false, loc },
            ],
            events: [],
            ref: null,
            children: [],
            slotId: null,
            needsScope: false,
            loc,
          },
        ],
        template: '',
        slotId: 'slot_portal_2',
        loc,
      }

      const result = adapter.renderComponent(portalComp)
      // Should use PortalCollector with bfPortalHTML for dynamic data-state
      expect(result).toContain('.Portals.Add')
      expect(result).toContain('bfPortalHTML')
      expect(result).toContain('data-state')
    })

    test('Portal without children renders empty portal add', () => {
      const portalComp: IRComponent = {
        type: 'component',
        name: 'Portal',
        props: [],
        propsType: null,
        children: [],
        template: '',
        slotId: 'slot_portal_empty',
        loc,
      }

      const result = adapter.renderComponent(portalComp)
      // Empty Portal should still call Add but with empty content
      expect(result).toContain('.Portals.Add')
    })

    test('non-Portal component renders normally', () => {
      // Ensure non-Portal components are not affected
      const comp: IRComponent = {
        type: 'component',
        name: 'DialogTrigger',
        props: [],
        propsType: null,
        children: [],
        template: '',
        slotId: 'slot_1',
        loc,
      }

      const result = adapter.renderComponent(comp)
      // Should render as normal template call
      expect(result).toBe('{{template "DialogTrigger" .DialogTriggerSlot1}}')
      expect(result).not.toContain('.Portals.Add')
    })
  })

  describe('block body filter rendering', () => {
    // Helper to parse block body from code string
    function parseBlock(code: string) {
      const sourceFile = ts.createSourceFile(
        'test.ts',
        `(t => ${code})`,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      )
      const exprStmt = sourceFile.statements[0] as ts.ExpressionStatement
      const paren = exprStmt.expression as ts.ParenthesizedExpression
      const arrow = paren.expression as ts.ArrowFunction
      const block = arrow.body as ts.Block
      return parseBlockBody(block, sourceFile)
    }

    test('renders loop with simple block body filter', () => {
      // filter(t => { return !t.done })
      const blockBody = parseBlock('{ return !t.done }')
      expect(blockBody).not.toBeNull()

      const loop: IRLoop = {
        type: 'loop',
        array: 'todos',
        arrayType: null,
        itemType: null,
        param: 'todo',
        index: null,
        key: null,
        children: [{ type: 'text', value: 'Item', loc }],
        slotId: null,
        isStaticArray: true,
        filterPredicate: {
          param: 't',
          blockBody: blockBody!,
          raw: '{ return !t.done }',
        },
        loc,
      }

      const result = adapter.renderLoop(loop)
      // Should render as: {{range $_, $todo := .Todos}}{{if not .Done}}Item{{end}}{{end}}
      expect(result).toContain('{{range')
      expect(result).toContain('not .Done')
      expect(result).toContain('Item')
    })

    test('renders loop with variable declaration and simple if', () => {
      // filter(t => { const f = filter(); if (f === 'active') return !t.done; return true })
      const blockBody = parseBlock(`{
        const f = filter()
        if (f === 'active') return !t.done
        return true
      }`)
      expect(blockBody).not.toBeNull()

      const loop: IRLoop = {
        type: 'loop',
        array: 'todos',
        arrayType: null,
        itemType: null,
        param: 'todo',
        index: null,
        key: null,
        children: [{ type: 'text', value: 'TodoItem', loc }],
        slotId: null,
        isStaticArray: true,
        filterPredicate: {
          param: 't',
          blockBody: blockBody!,
          raw: 'block body',
        },
        loc,
      }

      const result = adapter.renderLoop(loop)
      // Should contain filter condition and negated !t.done
      expect(result).toContain('{{range')
      expect(result).toContain('{{if')
      expect(result).toContain('$.Filter') // local var f maps to $.Filter
      expect(result).toContain('TodoItem')
    })

    test('renders loop with TodoApp filter pattern', () => {
      // The classic TodoApp filter pattern:
      // filter(t => {
      //   const f = filter()
      //   if (f === 'active') return !t.done
      //   if (f === 'completed') return t.done
      //   return true
      // })
      const blockBody = parseBlock(`{
        const f = filter()
        if (f === 'active') return !t.done
        if (f === 'completed') return t.done
        return true
      }`)
      expect(blockBody).not.toBeNull()

      const loop: IRLoop = {
        type: 'loop',
        array: 'todos',
        arrayType: null,
        itemType: null,
        param: 'todo',
        index: null,
        key: null,
        children: [{ type: 'text', value: 'TodoItem', loc }],
        slotId: null,
        isStaticArray: true,
        filterPredicate: {
          param: 't',
          blockBody: blockBody!,
          raw: 'block body',
        },
        loc,
      }

      const result = adapter.renderLoop(loop)
      // Should have condition that handles all three cases
      expect(result).toContain('{{range')
      expect(result).toContain('{{if')
      expect(result).toContain('$.Filter')
      expect(result).toContain('active')
      expect(result).toContain('completed')
      expect(result).toContain('TodoItem')
    })
  })
})
