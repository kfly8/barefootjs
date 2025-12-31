/**
 * IR to Client JS Transformer Tests
 *
 * Tests for generating client-side JavaScript information from IR.
 */

import { describe, it, expect } from 'bun:test'
import {
  extractArrowBody,
  extractArrowParams,
  needsCapturePhase,
  parseConditionalHandler,
  isBooleanAttribute,
  generateAttributeUpdate,
  collectClientJsInfo,
  collectAllChildComponentNames,
} from '../../src/transformers/ir-to-client-js'
import type {
  IRNode,
  IRElement,
  IRComponent,
  IRConditional,
  IRFragment,
  InteractiveElement,
  DynamicElement,
  ListElement,
  DynamicAttribute,
  RefElement,
  ConditionalElement,
  SignalDeclaration,
  MemoDeclaration,
} from '../../src/types'

describe('extractArrowBody', () => {
  it('extracts body from simple arrow function', () => {
    const result = extractArrowBody('() => doSomething()')
    expect(result).toBe('doSomething()')
  })

  it('extracts body from arrow function with parameter', () => {
    const result = extractArrowBody('(n) => n + 1')
    expect(result).toBe('n + 1')
  })

  it('extracts body from arrow function with block (returns inner content)', () => {
    // The implementation strips the braces and returns the inner statements
    const result = extractArrowBody('() => { doA(); doB() }')
    expect(result).toBe('doA(); doB()')
  })

  it('handles complex expressions', () => {
    const result = extractArrowBody('(e) => setName(e.target.value)')
    expect(result).toBe('setName(e.target.value)')
  })
})

describe('extractArrowParams', () => {
  it('extracts empty params as parentheses', () => {
    // Implementation returns "()" for empty params for function rebuilding
    const result = extractArrowParams('() => doSomething()')
    expect(result).toBe('()')
  })

  it('extracts single parameter with parentheses', () => {
    // Implementation wraps params in parentheses
    const result = extractArrowParams('(n) => n + 1')
    expect(result).toBe('(n)')
  })

  it('extracts parameter without parentheses and adds them', () => {
    // Implementation normalizes to include parentheses
    const result = extractArrowParams('n => n + 1')
    expect(result).toBe('(n)')
  })

  it('extracts multiple parameters with parentheses', () => {
    const result = extractArrowParams('(a, b) => a + b')
    expect(result).toBe('(a, b)')
  })
})

describe('needsCapturePhase', () => {
  it('returns true for blur event', () => {
    expect(needsCapturePhase('blur')).toBe(true)
  })

  it('returns true for focus event', () => {
    expect(needsCapturePhase('focus')).toBe(true)
  })

  it('returns true for focusin event', () => {
    expect(needsCapturePhase('focusin')).toBe(true)
  })

  it('returns true for focusout event', () => {
    expect(needsCapturePhase('focusout')).toBe(true)
  })

  it('returns false for click event', () => {
    expect(needsCapturePhase('click')).toBe(false)
  })

  it('returns false for input event', () => {
    expect(needsCapturePhase('input')).toBe(false)
  })
})

describe('parseConditionalHandler', () => {
  it('parses simple conditional', () => {
    const result = parseConditionalHandler('e.key === "Enter" && submitForm()')
    expect(result).not.toBeNull()
    expect(result!.condition).toBe('e.key === "Enter"')
    expect(result!.action).toBe('submitForm()')
  })

  it('returns null for non-conditional', () => {
    const result = parseConditionalHandler('doSomething()')
    expect(result).toBeNull()
  })
})

describe('isBooleanAttribute', () => {
  it('returns true for disabled', () => {
    expect(isBooleanAttribute('disabled')).toBe(true)
  })

  it('returns true for checked', () => {
    expect(isBooleanAttribute('checked')).toBe(true)
  })

  it('returns true for hidden', () => {
    expect(isBooleanAttribute('hidden')).toBe(true)
  })

  it('returns true for readonly', () => {
    expect(isBooleanAttribute('readonly')).toBe(true)
  })

  it('returns true for required', () => {
    expect(isBooleanAttribute('required')).toBe(true)
  })

  it('returns false for class', () => {
    expect(isBooleanAttribute('class')).toBe(false)
  })

  it('returns false for value', () => {
    expect(isBooleanAttribute('value')).toBe(false)
  })
})

describe('generateAttributeUpdate', () => {
  it('generates class update using setAttribute', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'div',
      attrName: 'class',
      expression: 'isActive() ? "active" : ""',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toBe('el0.setAttribute(\'class\', isActive() ? "active" : "")')
  })

  it('generates className update using setAttribute', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'div',
      attrName: 'className',
      expression: 'className',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toBe("el0.setAttribute('class', className)")
  })

  it('generates style update with Object.assign for object literal', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'div',
      attrName: 'style',
      expression: '{ color: "red" }',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toBe('Object.assign(el0.style, { color: "red" })')
  })

  it('generates style update with cssText for string', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'div',
      attrName: 'style',
      expression: '`color: ${color()}`',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toBe('el0.style.cssText = `color: ${color()}`')
  })

  it('generates boolean attribute update', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'input',
      attrName: 'disabled',
      expression: 'isDisabled()',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toBe('el0.disabled = isDisabled()')
  })

  it('generates value update with undefined check', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'input',
      attrName: 'value',
      expression: 'inputValue()',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toContain('__val_el0')
    expect(result).toContain('if (__val_el0 !== undefined)')
    expect(result).toContain('el0.value = __val_el0')
  })

  it('generates generic attribute update with undefined check', () => {
    const da: DynamicAttribute = {
      id: 'el0',
      tagName: 'a',
      attrName: 'href',
      expression: 'url()',
    }
    const result = generateAttributeUpdate(da)
    expect(result).toContain('__val_el0')
    expect(result).toContain('if (__val_el0 !== undefined)')
    expect(result).toContain("el0.setAttribute('href', __val_el0)")
  })
})

describe('collectClientJsInfo', () => {
  // Helper to create a minimal element IR
  function createElement(options: Partial<IRElement> = {}): IRElement {
    return {
      type: 'element',
      tagName: options.tagName ?? 'div',
      id: options.id ?? null,
      staticAttrs: options.staticAttrs ?? [],
      dynamicAttrs: options.dynamicAttrs ?? [],
      spreadAttrs: options.spreadAttrs ?? [],
      ref: options.ref ?? null,
      events: options.events ?? [],
      children: options.children ?? [],
      listInfo: options.listInfo ?? null,
      dynamicContent: options.dynamicContent ?? null,
    }
  }

  it('collects interactive elements from element with events', () => {
    const node = createElement({
      id: 'btn0',
      tagName: 'button',
      events: [{ name: 'onClick', eventName: 'click', handler: '() => setCount(n => n + 1)' }],
    })

    const interactiveElements: InteractiveElement[] = []
    collectClientJsInfo(node, interactiveElements, [], [], [], [], [], [])

    expect(interactiveElements.length).toBe(1)
    expect(interactiveElements[0].id).toBe('btn0')
    expect(interactiveElements[0].tagName).toBe('button')
    expect(interactiveElements[0].events[0].eventName).toBe('click')
  })

  it('collects dynamic elements from element with dynamic content', () => {
    const node = createElement({
      id: 'd0',
      tagName: 'span',
      dynamicContent: { expression: 'count()', fullContent: 'count()' },
    })

    const dynamicElements: DynamicElement[] = []
    collectClientJsInfo(node, [], dynamicElements, [], [], [], [], [])

    expect(dynamicElements.length).toBe(1)
    expect(dynamicElements[0].id).toBe('d0')
    expect(dynamicElements[0].expression).toBe('count()')
  })

  it('collects list elements from element with listInfo', () => {
    const node = createElement({
      id: 'l0',
      tagName: 'ul',
      listInfo: {
        arrayExpression: 'items()',
        paramName: 'item',
        itemTemplate: '`<li>${item}</li>`',
        itemIR: null,
        itemEvents: [],
        keyExpression: 'item.id',
      },
    })

    const listElements: ListElement[] = []
    collectClientJsInfo(node, [], [], listElements, [], [], [], [])

    expect(listElements.length).toBe(1)
    expect(listElements[0].id).toBe('l0')
    expect(listElements[0].arrayExpression).toBe('items()')
    expect(listElements[0].keyExpression).toBe('item.id')
  })

  it('collects dynamic attributes', () => {
    const node = createElement({
      id: 'd0',
      dynamicAttrs: [
        { name: 'class', expression: 'isActive() ? "active" : ""' },
        { name: 'disabled', expression: 'isDisabled()' },
      ],
    })

    const dynamicAttributes: DynamicAttribute[] = []
    collectClientJsInfo(node, [], [], [], dynamicAttributes, [], [], [])

    expect(dynamicAttributes.length).toBe(2)
    expect(dynamicAttributes[0].attrName).toBe('class')
    expect(dynamicAttributes[1].attrName).toBe('disabled')
  })

  it('collects ref elements', () => {
    const node = createElement({
      id: 'r0',
      tagName: 'input',
      ref: '(el) => inputRef = el',
    })

    const refElements: RefElement[] = []
    collectClientJsInfo(node, [], [], [], [], [], refElements, [])

    expect(refElements.length).toBe(1)
    expect(refElements[0].id).toBe('r0')
    expect(refElements[0].callback).toBe('(el) => inputRef = el')
  })

  it('collects conditional elements from conditional with ID', () => {
    const signals: SignalDeclaration[] = [
      { getter: 'isOn', setter: 'setIsOn', initialValue: 'false' },
    ]
    const cond: IRConditional = {
      type: 'conditional',
      id: 'c0',
      condition: 'isOn()',
      whenTrue: { type: 'element', tagName: 'span', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [{ type: 'text', content: 'ON' }], listInfo: null, dynamicContent: null },
      whenFalse: { type: 'element', tagName: 'span', id: null, staticAttrs: [], dynamicAttrs: [], spreadAttrs: [], ref: null, events: [], children: [{ type: 'text', content: 'OFF' }], listInfo: null, dynamicContent: null },
    }

    const conditionalElements: ConditionalElement[] = []
    collectClientJsInfo(cond, [], [], [], [], [], [], conditionalElements, { signals, memos: [] })

    expect(conditionalElements.length).toBe(1)
    expect(conditionalElements[0].id).toBe('c0')
    expect(conditionalElements[0].condition).toBe('isOn()')
    expect(conditionalElements[0].whenTrueTemplate).toContain('ON')
    expect(conditionalElements[0].whenFalseTemplate).toContain('OFF')
  })

  it('collects childInits from component nodes', () => {
    const comp: IRComponent = {
      type: 'component',
      name: 'Counter',
      props: [{ name: 'initial', value: '0', isDynamic: false }],
      spreadProps: [],
      staticHtml: '',
      childInits: { name: 'Counter', propsExpr: '{ initial: 0 }' },
      children: [],
      hasLazyChildren: false,
    }

    const childInits: Array<{ name: string; propsExpr: string }> = []
    collectClientJsInfo(comp, [], [], [], [], childInits, [], [])

    expect(childInits.length).toBe(1)
    expect(childInits[0].name).toBe('Counter')
  })

  it('recursively processes children', () => {
    const node = createElement({
      children: [
        createElement({
          id: 'btn0',
          tagName: 'button',
          events: [{ name: 'onClick', eventName: 'click', handler: '() => {}' }],
        }),
      ],
    })

    const interactiveElements: InteractiveElement[] = []
    collectClientJsInfo(node, interactiveElements, [], [], [], [], [], [])

    expect(interactiveElements.length).toBe(1)
    expect(interactiveElements[0].id).toBe('btn0')
  })

  it('processes fragment children', () => {
    const fragment: IRFragment = {
      type: 'fragment',
      children: [
        createElement({
          id: 'd0',
          dynamicContent: { expression: 'count()', fullContent: 'count()' },
        }),
        createElement({
          id: 'd1',
          dynamicContent: { expression: 'name()', fullContent: 'name()' },
        }),
      ],
    }

    const dynamicElements: DynamicElement[] = []
    collectClientJsInfo(fragment, [], dynamicElements, [], [], [], [], [])

    expect(dynamicElements.length).toBe(2)
  })
})

describe('collectAllChildComponentNames', () => {
  it('collects component names from component nodes', () => {
    const comp: IRComponent = {
      type: 'component',
      name: 'Counter',
      props: [],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [],
      hasLazyChildren: false,
    }

    const names = collectAllChildComponentNames(comp)
    expect(names).toContain('Counter')
  })

  it('collects nested component names', () => {
    const comp: IRComponent = {
      type: 'component',
      name: 'Card',
      props: [],
      spreadProps: [],
      staticHtml: '',
      childInits: null,
      children: [
        {
          type: 'component',
          name: 'Header',
          props: [],
          spreadProps: [],
          staticHtml: '',
          childInits: null,
          children: [],
          hasLazyChildren: false,
        },
      ],
      hasLazyChildren: false,
    }

    const names = collectAllChildComponentNames(comp)
    expect(names).toContain('Card')
    expect(names).toContain('Header')
  })

  it('collects components from conditionals', () => {
    const cond: IRConditional = {
      type: 'conditional',
      id: null,
      condition: 'true',
      whenTrue: {
        type: 'component',
        name: 'TrueComponent',
        props: [],
        spreadProps: [],
        staticHtml: '',
        childInits: null,
        children: [],
        hasLazyChildren: false,
      },
      whenFalse: {
        type: 'component',
        name: 'FalseComponent',
        props: [],
        spreadProps: [],
        staticHtml: '',
        childInits: null,
        children: [],
        hasLazyChildren: false,
      },
    }

    const names = collectAllChildComponentNames(cond)
    expect(names).toContain('TrueComponent')
    expect(names).toContain('FalseComponent')
  })

  it('collects components from list itemIR', () => {
    const element: IRElement = {
      type: 'element',
      tagName: 'ul',
      id: 'l0',
      staticAttrs: [],
      dynamicAttrs: [],
      spreadAttrs: [],
      ref: null,
      events: [],
      children: [],
      listInfo: {
        arrayExpression: 'items()',
        paramName: 'item',
        itemTemplate: '',
        itemIR: {
          type: 'component',
          name: 'ListItem',
          props: [],
          spreadProps: [],
          staticHtml: '',
          childInits: null,
          children: [],
          hasLazyChildren: false,
        },
        itemEvents: [],
        keyExpression: null,
      },
      dynamicContent: null,
    }

    const names = collectAllChildComponentNames(element)
    expect(names).toContain('ListItem')
  })

  it('deduplicates component names', () => {
    const fragment: IRFragment = {
      type: 'fragment',
      children: [
        {
          type: 'component',
          name: 'Button',
          props: [],
          spreadProps: [],
          staticHtml: '',
          childInits: null,
          children: [],
          hasLazyChildren: false,
        },
        {
          type: 'component',
          name: 'Button',
          props: [],
          spreadProps: [],
          staticHtml: '',
          childInits: null,
          children: [],
          hasLazyChildren: false,
        },
      ],
    }

    const names = collectAllChildComponentNames(fragment)
    expect(names.length).toBe(1)
    expect(names[0]).toBe('Button')
  })
})
