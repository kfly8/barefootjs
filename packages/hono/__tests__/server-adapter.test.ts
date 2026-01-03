/**
 * Hono Marked JSX Adapter Tests
 */

import { describe, it, expect } from 'bun:test'
import { honoMarkedJsxAdapter } from '../src'

describe('honoMarkedJsxAdapter', () => {
  describe('generateMarkedJsxComponent', () => {
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'Hello',
        props: [],
        typeDefinitions: [],
        jsx: '<div>Hello</div>',
        ir,
        signals: [],
        memos: [],
        childComponents: [],
        moduleConstants: [],
        originalImports: [],
        sourcePath: 'Hello.tsx',
      })

      expect(result).toContain('export function Hello({ "data-key": __dataKey, __listIndex }')
      expect(result).toContain('useRequestContext')
      // Scripts are now collected for deferred rendering (via BfScripts)
      expect(result).toContain("bfOutputScripts")
      expect(result).toContain("bfCollectedScripts")
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'Counter',
        props: [{ name: 'initialCount', type: 'number', optional: true }],
        typeDefinitions: [],
        jsx: '<div>{initialCount}</div>',
        ir,
        signals: [],
        memos: [],
        childComponents: [],
        moduleConstants: [],
        originalImports: [],
        sourcePath: 'Counter.tsx',
      })

      expect(result).toContain('export function Counter({ initialCount, "data-key": __dataKey, __listIndex }')
      expect(result).toContain('__isRoot')
      expect(result).toContain('bfRootComponent')
      expect(result).toContain('data-bf-props="Counter"')
      expect(result).toContain('__hydrateProps')
    })

    it('generates imports for child components using originalImports paths', () => {
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'Parent',
        props: [],
        typeDefinitions: [],
        jsx: '<div><Child /><SharedButton /></div>',
        ir,
        signals: [],
        memos: [],
        childComponents: ['Child', 'SharedButton'],
        moduleConstants: [],
        originalImports: [
          { name: 'Child', path: './Child', isDefault: true },
          { name: 'SharedButton', path: '../shared/Button', isDefault: false },
        ],
        sourcePath: 'Parent.tsx',
      })

      // Imports use original paths and respect isDefault flag
      expect(result).toContain("import Child from './Child'")
      expect(result).toContain("import { SharedButton } from '../shared/Button'")
    })

    it('falls back to named imports when originalImports is empty', () => {
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'Parent',
        props: [],
        typeDefinitions: [],
        jsx: '<div><Child /></div>',
        ir,
        signals: [],
        memos: [],
        childComponents: ['Child'],
        moduleConstants: [],
        originalImports: [],
        sourcePath: 'Parent.tsx',
      })

      // Local components (in childComponents but not originalImports) get ./ComponentName imports
      expect(result).toContain("import { Child } from './Child'")
    })

    it('includes module constants in output', () => {
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'Game',
        props: [],
        typeDefinitions: [],
        jsx: '<div className={className}>Game</div>',
        ir,
        signals: [],
        memos: [],
        childComponents: [],
        moduleConstants: [
          { name: 'GRID_SIZE', value: '100', code: 'const GRID_SIZE = 100' },
          { name: 'MAX_ENEMIES', value: '30', code: 'const MAX_ENEMIES = 30' },
        ],
        originalImports: [],
        sourcePath: 'Game.tsx',
      })

      expect(result).toContain('const GRID_SIZE = 100')
      expect(result).toContain('const MAX_ENEMIES = 30')
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'Counter',
        props: [],
        typeDefinitions: [],
        jsx: '<div>0</div>',
        ir,
        signals: [],
        memos: [],
        childComponents: [],
        moduleConstants: [],
        originalImports: [],
        sourcePath: 'Counter.tsx',
      })

      // Should use try/catch for useRequestContext to handle Suspense boundaries
      expect(result).toContain('try {')
      expect(result).toContain('const c = useRequestContext()')
      expect(result).toContain('} catch {')
      expect(result).toContain('// Inside Suspense boundary')
      // Inside Suspense, falls back to inline scripts
      expect(result).toContain('__inSuspense = true')
      expect(result).toContain('{__inSuspense && __barefootSrc &&')
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

      const result = honoMarkedJsxAdapter.generateMarkedJsxComponent({
        name: 'TodoApp',
        props: [{ name: 'initialTodos', type: 'Todo[]', optional: false }],
        typeDefinitions: ['type Todo = { id: number; text: string; done: boolean }'],
        jsx: '<div>{initialTodos}</div>',
        ir,
        signals: [],
        memos: [],
        childComponents: [],
        moduleConstants: [],
        originalImports: [],
        sourcePath: 'TodoApp.tsx',
      })

      // Should check bfRootComponent context (with try/catch for Suspense boundaries)
      expect(result).toContain("let __isRoot = false")
      expect(result).toContain("__isRoot = !c.get('bfRootComponent')")
      expect(result).toContain("c.set('bfRootComponent', 'TodoApp')")
      // Props scripts are collected for deferred rendering
      expect(result).toContain("bfCollectedPropsScripts")
      // data-bf-props should only render inline when __inSuspense is true
      expect(result).toContain('{__inSuspense && __isRoot && __hasHydrateProps && (')
    })
  })
})
