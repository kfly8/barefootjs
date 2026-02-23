/**
 * GoTemplateAdapter - Tests
 *
 * Conformance tests (shared across adapters) + Go-template-specific tests.
 */

import { describe, test, expect } from 'bun:test'
import { GoTemplateAdapter } from '../adapter/go-template-adapter'
import {
  runJSXConformanceTests,
  textNode, expression, element, conditional, loop, component,
  attr, prop, signal, memo, param, componentIR,
} from '@barefootjs/adapter-tests'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import { parseBlockBody } from '@barefootjs/jsx'
import ts from 'typescript'

// =============================================================================
// JSX-Based Conformance Tests
// =============================================================================

runJSXConformanceTests({
  createAdapter: () => new GoTemplateAdapter(),
  referenceAdapter: () => new HonoAdapter({ injectScriptCollection: false }),
})

// =============================================================================
// Go-Template-Specific Tests
// =============================================================================

describe('GoTemplateAdapter - Adapter Specific', () => {
  const adapter = new GoTemplateAdapter()

  describe('generate - Go struct types', () => {
    test('generates Go struct types', () => {
      const ir = componentIR('Counter', element('div'), {
        propsParams: [
          param('initial', { kind: 'primitive', raw: 'number', primitive: 'number' }, { optional: true, defaultValue: '0' }),
        ],
        signals: [signal('count', 'setCount', '0')],
      })

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

      const ir = componentIR('Button', element('button'), {
        propsParams: [
          param('label', { kind: 'primitive', raw: 'string', primitive: 'string' }),
        ],
      })

      const types = customAdapter.generateTypes(ir)

      expect(types).toContain('package views')
      expect(types).toContain('type ButtonProps struct')
      expect(types).toContain('Label string')
    })

    test('generates fields for multiple static child components with slotId', () => {
      const ir = componentIR(
        'ReactiveProps',
        element('div', {
          needsScope: true,
          children: [
            component('ReactiveChild', {
              props: [
                prop('value', 'count()', { dynamic: true, isLiteral: false }),
                prop('label', 'Child A'),
              ],
              slotId: 'slot_6',
            }),
            component('ReactiveChild', {
              props: [
                prop('value', 'doubled()', { dynamic: true, isLiteral: false }),
                prop('label', 'Child B (doubled)'),
              ],
              slotId: 'slot_7',
            }),
          ],
        }),
        {
          hasDefaultExport: true,
          isClientComponent: true,
          signals: [signal('count', 'setCount', '0')],
          memos: [memo('doubled', '() => count() * 2', ['count'])],
        },
      )

      const types = adapter.generateTypes(ir)

      expect(types).toContain('ReactiveChildSlot6 ReactiveChildProps `json:"-"`')
      expect(types).toContain('ReactiveChildSlot7 ReactiveChildProps `json:"-"`')
      expect(types).toContain('ReactiveChildSlot6: NewReactiveChildProps(ReactiveChildInput{')
      expect(types).toContain('ReactiveChildSlot7: NewReactiveChildProps(ReactiveChildInput{')
      expect(types).toContain('ScopeID: scopeID + "_slot_6"')
      expect(types).toContain('ScopeID: scopeID + "_slot_7"')
      expect(types).toContain('Label: "Child A"')
      expect(types).toContain('Label: "Child B (doubled)"')
    })
  })

  describe('Portal component handling', () => {
    test('renders Portal component with children as portal collection', () => {
      const portalComp = component('Portal', {
        children: [element('div', { attrs: [attr('data-slot', 'dialog-overlay')] })],
        slotId: 'slot_portal_1',
      })

      const result = adapter.renderComponent(portalComp)
      expect(result).toContain('.Portals.Add')
      expect(result).toContain('data-slot=\\"dialog-overlay\\"')
    })

    test('renders Portal with dynamic attribute in children', () => {
      const portalComp = component('Portal', {
        children: [
          element('div', {
            attrs: [
              attr('data-slot', 'dialog-overlay'),
              attr('data-state', "open ? 'open' : 'closed'", { dynamic: true, isLiteral: false }),
            ],
          }),
        ],
        slotId: 'slot_portal_2',
      })

      const result = adapter.renderComponent(portalComp)
      expect(result).toContain('.Portals.Add')
      expect(result).toContain('bfPortalHTML')
      expect(result).toContain('data-state')
    })

    test('Portal without children renders empty portal add', () => {
      const result = adapter.renderComponent(component('Portal', { slotId: 'slot_portal_empty' }))
      expect(result).toContain('.Portals.Add')
    })

    test('non-Portal component renders normally', () => {
      const result = adapter.renderComponent(component('DialogTrigger', { slotId: 'slot_1' }))
      expect(result).toBe('{{template "DialogTrigger" .DialogTriggerSlot1}}')
      expect(result).not.toContain('.Portals.Add')
    })
  })

  describe('block body filter rendering', () => {
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
      const blockBody = parseBlock('{ return !t.done }')
      expect(blockBody).not.toBeNull()

      const l = loop('todos', 'todo', [textNode('Item')], {
        filterPredicate: { param: 't', blockBody: blockBody!, raw: '{ return !t.done }' },
      })

      const result = adapter.renderLoop(l)
      expect(result).toContain('{{range')
      expect(result).toContain('not .Done')
      expect(result).toContain('Item')
    })

    test('renders loop with variable declaration and simple if', () => {
      const blockBody = parseBlock(`{
        const f = filter()
        if (f === 'active') return !t.done
        return true
      }`)
      expect(blockBody).not.toBeNull()

      const l = loop('todos', 'todo', [textNode('TodoItem')], {
        filterPredicate: { param: 't', blockBody: blockBody!, raw: 'block body' },
      })

      const result = adapter.renderLoop(l)
      expect(result).toContain('{{range')
      expect(result).toContain('{{if')
      expect(result).toContain('$.Filter')
      expect(result).toContain('TodoItem')
    })

    test('renders loop with TodoApp filter pattern', () => {
      const blockBody = parseBlock(`{
        const f = filter()
        if (f === 'active') return !t.done
        if (f === 'completed') return t.done
        return true
      }`)
      expect(blockBody).not.toBeNull()

      const l = loop('todos', 'todo', [textNode('TodoItem')], {
        filterPredicate: { param: 't', blockBody: blockBody!, raw: 'block body' },
      })

      const result = adapter.renderLoop(l)
      expect(result).toContain('{{range')
      expect(result).toContain('{{if')
      expect(result).toContain('$.Filter')
      expect(result).toContain('active')
      expect(result).toContain('completed')
      expect(result).toContain('TodoItem')
    })
  })

  describe('higher-order methods - regression', () => {
    test('simple every(t => t.done) still uses bf_every', () => {
      const result = adapter.renderExpression(expression('todos().every(t => t.done)'))
      expect(result).toBe('{{bf_every .Todos "Done"}}')
    })
  })

  describe('find/findIndex - adapter specific', () => {
    test('renders find() with equality + comparison mixed predicate', () => {
      const result = adapter.renderExpression(
        expression("items().find(t => t.price > 100 && t.category === type())"),
      )
      expect(result).toBe('{{range .Items}}{{if and (gt .Price 100) (eq .Category $.Type)}}{{.}}{{break}}{{end}}{{end}}')
    })

    test('renders find() in condition without {{with}}', () => {
      const result = adapter.renderConditional(
        conditional('items().find(t => t.done)', textNode('Found')),
      )
      expect(result).toContain('bf_find .Items "Done" true')
      expect(result).toContain('Found')
    })
  })
})
