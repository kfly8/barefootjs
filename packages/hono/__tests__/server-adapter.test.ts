/**
 * Hono Server Component Adapter Tests
 */

import { describe, it, expect } from 'bun:test'
import { honoServerAdapter } from '../src'

describe('honoServerAdapter', () => {
  describe('generateServerComponent', () => {
    it('generates component without props', () => {
      // IR is not used by the adapter, just passed through
      const ir = {
        type: 'element',
        tagName: 'div',
        id: null,
        staticAttrs: [],
        dynamicAttrs: [],
        events: [],
        children: [{ type: 'text', content: 'Hello' }],
        listInfo: null,
        dynamicContent: null,
      }

      const result = honoServerAdapter.generateServerComponent({
        name: 'Hello',
        props: [],
        typeDefinitions: [],
        jsx: '<div>Hello</div>',
        ir,
        signals: [],
        childComponents: [],
      })

      expect(result).toContain('export function Hello({ "data-key": __dataKey, __listIndex }')
      expect(result).toContain('useRequestContext')
      expect(result).toContain("bfOutputScripts")
    })

    it('generates component with props and hydration script', () => {
      const ir = {
        type: 'element',
        tagName: 'div',
        id: null,
        staticAttrs: [],
        dynamicAttrs: [],
        events: [],
        children: [],
        listInfo: null,
        dynamicContent: null,
      }

      const result = honoServerAdapter.generateServerComponent({
        name: 'Counter',
        props: [{ name: 'initialCount', type: 'number', optional: true }],
        typeDefinitions: [],
        jsx: '<div>{initialCount}</div>',
        ir,
        signals: [],
        childComponents: [],
      })

      expect(result).toContain('export function Counter({ initialCount, "data-key": __dataKey, __listIndex }')
      expect(result).toContain('__isRoot')
      expect(result).toContain('bfRootComponent')
      expect(result).toContain('data-bf-props="Counter"')
      expect(result).toContain('__hydrateProps')
    })

    it('generates imports for child components', () => {
      const ir = {
        type: 'element',
        tagName: 'div',
        id: null,
        staticAttrs: [],
        dynamicAttrs: [],
        events: [],
        children: [],
        listInfo: null,
        dynamicContent: null,
      }

      const result = honoServerAdapter.generateServerComponent({
        name: 'Parent',
        props: [],
        typeDefinitions: [],
        jsx: '<div><Child /></div>',
        ir,
        signals: [],
        childComponents: ['Child', 'AnotherChild'],
      })

      expect(result).toContain("import { Child } from './Child'")
      expect(result).toContain("import { AnotherChild } from './AnotherChild'")
    })

    it('handles Suspense boundaries gracefully with try/catch', () => {
      const ir = {
        type: 'element',
        tagName: 'div',
        id: null,
        staticAttrs: [],
        dynamicAttrs: [],
        events: [],
        children: [],
        listInfo: null,
        dynamicContent: null,
      }

      const result = honoServerAdapter.generateServerComponent({
        name: 'Counter',
        props: [],
        typeDefinitions: [],
        jsx: '<div>0</div>',
        ir,
        signals: [],
        childComponents: [],
      })

      // Should use try/catch for useRequestContext to handle Suspense boundaries
      expect(result).toContain('try {')
      expect(result).toContain('const c = useRequestContext()')
      expect(result).toContain('} catch {')
      expect(result).toContain('// Inside Suspense boundary - context unavailable')
      // Should default to outputting scripts when context is unavailable
      expect(result).toContain('let __needsBarefoot = true')
      expect(result).toContain('let __needsThis = true')
    })

    it('only outputs data-bf-props for root component (first to render)', () => {
      const ir = {
        type: 'element',
        tagName: 'div',
        id: null,
        staticAttrs: [],
        dynamicAttrs: [],
        events: [],
        children: [],
        listInfo: null,
        dynamicContent: null,
      }

      const result = honoServerAdapter.generateServerComponent({
        name: 'TodoApp',
        props: [{ name: 'initialTodos', type: 'Todo[]', optional: false }],
        typeDefinitions: ['type Todo = { id: number; text: string; done: boolean }'],
        jsx: '<div>{initialTodos}</div>',
        ir,
        signals: [],
        childComponents: [],
      })

      // Should check bfRootComponent context (with try/catch for Suspense boundaries)
      expect(result).toContain("let __isRoot = true")
      expect(result).toContain("__isRoot = !c.get('bfRootComponent')")
      expect(result).toContain("c.set('bfRootComponent', 'TodoApp')")
      // data-bf-props should only render when __isRoot is true
      expect(result).toContain('{__isRoot && __hasHydrateProps && (')
    })
  })
})
