/**
 * Hono Server Component Adapter Tests
 */

import { describe, it, expect } from 'bun:test'
import { honoServerAdapter } from '../../src/adapters/hono'
import type { IRElement } from '../../src/types'

describe('honoServerAdapter', () => {
  describe('generateServerComponent', () => {
    it('generates component without props', () => {
      const ir: IRElement = {
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
      const ir: IRElement = {
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
        props: ['initialCount'],
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
      const ir: IRElement = {
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
        jsx: '<div><Child /></div>',
        ir,
        signals: [],
        childComponents: ['Child', 'AnotherChild'],
      })

      expect(result).toContain("import { Child } from './Child'")
      expect(result).toContain("import { AnotherChild } from './AnotherChild'")
    })

    it('only outputs data-bf-props for root component (first to render)', () => {
      const ir: IRElement = {
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
        props: ['initialTodos'],
        jsx: '<div>{initialTodos}</div>',
        ir,
        signals: [],
        childComponents: [],
      })

      // Should check bfRootComponent context
      expect(result).toContain("const __isRoot = !c.get('bfRootComponent')")
      expect(result).toContain("c.set('bfRootComponent', 'TodoApp')")
      // data-bf-props should only render when __isRoot is true
      expect(result).toContain('{__isRoot && __hasHydrateProps && (')
    })
  })
})
