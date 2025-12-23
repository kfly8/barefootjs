/**
 * Element Path Calculator Tests
 */

import { describe, it, expect } from 'bun:test'
import { calculateElementPaths, generatePathExpression } from '../../utils/element-paths'
import type { IRElement, IRFragment } from '../../types'

describe('calculateElementPaths', () => {
  describe('simple element root', () => {
    it('calculates path for single element with ID', () => {
      const ir: IRElement = {
        type: 'element',
        tagName: 'div',
        id: '0',
        staticAttrs: [],
        dynamicAttrs: [],
        spreadAttrs: [],
        ref: null,
        events: [],
        children: [],
        listInfo: null,
        dynamicContent: null,
      }

      const paths = calculateElementPaths(ir)
      // Root element has empty path (it IS the scope)
      expect(paths).toEqual([{ id: '0', path: '' }])
    })

    it('calculates paths for nested children', () => {
      const ir: IRElement = {
        type: 'element',
        tagName: 'div',
        id: null,  // Root has no ID (scope only)
        staticAttrs: [],
        dynamicAttrs: [],
        spreadAttrs: [],
        ref: null,
        events: [],
        children: [
          {
            type: 'element',
            tagName: 'p',
            id: '0',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
          {
            type: 'element',
            tagName: 'button',
            id: '1',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
        ],
        listInfo: null,
        dynamicContent: null,
      }

      const paths = calculateElementPaths(ir)
      expect(paths).toEqual([
        { id: '0', path: 'firstElementChild' },
        { id: '1', path: 'firstElementChild.nextElementSibling' },
      ])
    })

    it('skips text nodes when counting siblings', () => {
      const ir: IRElement = {
        type: 'element',
        tagName: 'div',
        id: null,
        staticAttrs: [],
        dynamicAttrs: [],
        spreadAttrs: [],
        ref: null,
        events: [],
        children: [
          { type: 'text', content: 'Hello' },
          {
            type: 'element',
            tagName: 'span',
            id: '0',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
          { type: 'text', content: 'World' },
          {
            type: 'element',
            tagName: 'button',
            id: '1',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
        ],
        listInfo: null,
        dynamicContent: null,
      }

      const paths = calculateElementPaths(ir)
      // Text nodes don't affect element indices
      expect(paths).toEqual([
        { id: '0', path: 'firstElementChild' },
        { id: '1', path: 'firstElementChild.nextElementSibling' },
      ])
    })
  })

  describe('fragment root', () => {
    it('calculates path for fragment with single element', () => {
      const ir: IRFragment = {
        type: 'fragment',
        children: [
          {
            type: 'element',
            tagName: 'p',
            id: '0',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
        ],
      }

      const paths = calculateElementPaths(ir)
      // First element in fragment: path is empty (scope itself)
      expect(paths).toEqual([{ id: '0', path: '' }])
    })

    it('calculates paths for fragment with multiple siblings', () => {
      const ir: IRFragment = {
        type: 'fragment',
        children: [
          {
            type: 'element',
            tagName: 'p',
            id: '0',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
          {
            type: 'element',
            tagName: 'button',
            id: '1',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
          {
            type: 'element',
            tagName: 'button',
            id: '2',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
        ],
      }

      const paths = calculateElementPaths(ir)
      expect(paths).toEqual([
        { id: '0', path: '' },  // First element is scope
        { id: '1', path: 'nextElementSibling' },
        { id: '2', path: 'nextElementSibling.nextElementSibling' },
      ])
    })

    it('calculates paths for fragment with nested children', () => {
      const ir: IRFragment = {
        type: 'fragment',
        children: [
          {
            type: 'element',
            tagName: 'p',
            id: '0',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [
              {
                type: 'element',
                tagName: 'span',
                id: '1',
                staticAttrs: [],
                dynamicAttrs: [],
                spreadAttrs: [],
                ref: null,
                events: [],
                children: [],
                listInfo: null,
                dynamicContent: null,
              },
            ],
            listInfo: null,
            dynamicContent: null,
          },
          {
            type: 'element',
            tagName: 'button',
            id: '2',
            staticAttrs: [],
            dynamicAttrs: [],
            spreadAttrs: [],
            ref: null,
            events: [],
            children: [],
            listInfo: null,
            dynamicContent: null,
          },
        ],
      }

      const paths = calculateElementPaths(ir)
      expect(paths).toEqual([
        { id: '0', path: '' },  // First element is scope
        { id: '1', path: 'firstElementChild' },  // Child of scope
        { id: '2', path: 'nextElementSibling' },  // Sibling of scope
      ])
    })
  })
})

describe('component siblings', () => {
  it('returns null paths for elements after component sibling', () => {
    const ir: IRElement = {
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
          type: 'element',
          tagName: 'h1',
          id: '0',
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [],
          listInfo: null,
          dynamicContent: null,
        },
        {
          type: 'component',
          name: 'AddTodoForm',
          props: [],
        },
        {
          type: 'element',
          tagName: 'ul',
          id: '1',
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [],
          listInfo: null,
          dynamicContent: null,
        },
      ],
      listInfo: null,
      dynamicContent: null,
    }

    const paths = calculateElementPaths(ir)
    expect(paths).toEqual([
      { id: '0', path: 'firstElementChild' },  // Before component - valid path
      { id: '1', path: null },  // After component - null path (needs querySelector fallback)
    ])
  })

  it('returns valid paths for elements before component', () => {
    const ir: IRElement = {
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
          type: 'element',
          tagName: 'p',
          id: '0',
          staticAttrs: [],
          dynamicAttrs: [],
          spreadAttrs: [],
          ref: null,
          events: [],
          children: [
            {
              type: 'element',
              tagName: 'span',
              id: '1',
              staticAttrs: [],
              dynamicAttrs: [],
              spreadAttrs: [],
              ref: null,
              events: [],
              children: [],
              listInfo: null,
              dynamicContent: null,
            },
          ],
          listInfo: null,
          dynamicContent: null,
        },
        {
          type: 'component',
          name: 'SomeComponent',
          props: [],
        },
      ],
      listInfo: null,
      dynamicContent: null,
    }

    const paths = calculateElementPaths(ir)
    expect(paths).toEqual([
      { id: '0', path: 'firstElementChild' },  // Before component
      { id: '1', path: 'firstElementChild.firstElementChild' },  // Child of element before component
    ])
  })
})

describe('generatePathExpression', () => {
  it('returns scope variable for empty path', () => {
    expect(generatePathExpression('__scope', '')).toBe('__scope')
  })

  it('generates simple path expression', () => {
    expect(generatePathExpression('__scope', 'firstElementChild')).toBe('__scope?.firstElementChild')
  })

  it('generates chained path expression', () => {
    expect(generatePathExpression('__scope', 'firstElementChild.nextElementSibling')).toBe('__scope?.firstElementChild.nextElementSibling')
  })
})
