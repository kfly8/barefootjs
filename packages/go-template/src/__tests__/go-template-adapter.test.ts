/**
 * GoTemplateAdapter - Tests
 *
 * Conformance tests (shared across adapters) + Go-template-specific tests.
 */

import { describe, test, expect } from 'bun:test'
import { GoTemplateAdapter } from '../adapter/go-template-adapter'
import { runConformanceTests } from '@barefootjs/adapter-tests'
import type {
  ComponentIR,
  IRLoop,
  IRComponent,
  IRExpression,
  IRConditional,
} from '@barefootjs/jsx'
import { parseBlockBody } from '@barefootjs/jsx'
import ts from 'typescript'

// Helper to create minimal source location
const loc = {
  file: 'test.tsx',
  start: { line: 1, column: 0 },
  end: { line: 1, column: 0 },
}

// =============================================================================
// Shared Conformance Tests (~50 cases)
// =============================================================================

runConformanceTests({
  createAdapter: () => new GoTemplateAdapter(),
})

// =============================================================================
// Go-Template-Specific Tests
// =============================================================================

describe('GoTemplateAdapter - Adapter Specific', () => {
  const adapter = new GoTemplateAdapter()

  describe('generate - Go struct types', () => {
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
      expect(result).toContain('.Portals.Add')
      expect(result).toContain('data-slot=\\"dialog-overlay\\"')
    })

    test('renders Portal with dynamic attribute in children', () => {
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
      expect(result).toContain('.Portals.Add')
    })

    test('non-Portal component renders normally', () => {
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
      const expr: IRExpression = {
        type: 'expression',
        expr: 'todos().every(t => t.done)',
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('{{bf_every .Todos "Done"}}')
    })
  })

  describe('find/findIndex - adapter specific', () => {
    test('renders find() with equality + comparison mixed predicate', () => {
      const expr: IRExpression = {
        type: 'expression',
        expr: "items().find(t => t.price > 100 && t.category === type())",
        typeInfo: null,
        reactive: false,
        slotId: null,
        loc,
      }

      const result = adapter.renderExpression(expr)
      expect(result).toBe('{{range .Items}}{{if and (gt .Price 100) (eq .Category $.Type)}}{{.}}{{break}}{{end}}{{end}}')
    })

    test('renders find() in condition without {{with}}', () => {
      const cond: IRConditional = {
        type: 'conditional',
        condition: 'items().find(t => t.done)',
        conditionType: null,
        reactive: false,
        whenTrue: { type: 'text', value: 'Found', loc },
        whenFalse: { type: 'expression', expr: 'null', typeInfo: null, reactive: false, slotId: null, loc },
        slotId: null,
        loc,
      }

      const result = adapter.renderConditional(cond)
      expect(result).toContain('bf_find .Items "Done" true')
      expect(result).toContain('Found')
    })
  })
})
