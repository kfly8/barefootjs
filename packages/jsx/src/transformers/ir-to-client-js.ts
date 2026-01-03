/**
 * BarefootJS JSX Compiler - IR to Client JS Transformer
 *
 * Generates client-side JavaScript from Intermediate Representation (IR).
 * Uses Slot Registry pattern for reliable hydration with existence checks.
 */

import type {
  IRNode,
  IRElement,
  SignalDeclaration,
  MemoDeclaration,
  InteractiveElement,
  DynamicElement,
  ListElement,
  DynamicAttribute,
  RefElement,
  ConditionalElement,
  CollectContext,
} from '../types'

/**
 * Checks if an event requires capture phase (non-bubbling events)
 */
export function needsCapturePhase(eventName: string): boolean {
  return ['blur', 'focus', 'focusin', 'focusout'].includes(eventName)
}

/**
 * Checks if an attribute is a boolean attribute
 */
export function isBooleanAttribute(attrName: string): boolean {
  return ['disabled', 'checked', 'hidden', 'readonly', 'required'].includes(attrName)
}

/**
 * Generates update code for dynamic attributes
 *
 * For setAttribute, we add an undefined check to prevent overwriting
 * server-rendered default values when props are not passed.
 */
export function generateAttributeUpdate(da: DynamicAttribute): string {
  const { id, attrName, expression } = da

  if (attrName === 'class' || attrName === 'className') {
    // Use setAttribute for class to support both HTML and SVG elements
    // SVG elements have className as SVGAnimatedString (read-only)
    return `${id}.setAttribute('class', ${expression})`
  }

  if (attrName === 'style') {
    // Object literal uses Object.assign, string/template literal uses cssText
    if (expression.trim().startsWith('{')) {
      return `Object.assign(${id}.style, ${expression})`
    }
    return `${id}.style.cssText = ${expression}`
  }

  if (isBooleanAttribute(attrName)) {
    return `${id}.${attrName} = ${expression}`
  }

  if (attrName === 'value') {
    // Add undefined check for value to prevent showing "undefined" string
    const valVar = `__val_${id}`
    return `const ${valVar} = ${expression}; if (${valVar} !== undefined) ${id}.value = ${valVar}`
  }

  // Add undefined check to preserve server-rendered default values
  // when props are not passed to child components
  const valVar = `__val_${id}`
  return `const ${valVar} = ${expression}; if (${valVar} !== undefined) ${id}.setAttribute('${attrName}', ${valVar})`
}

/**
 * Collects information needed for client JS generation from IR
 */
export function collectClientJsInfo(
  node: IRNode,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[],
  childInits: Array<{ name: string; propsExpr: string }> = [],
  refElements: RefElement[] = [],
  conditionalElements: ConditionalElement[] = [],
  ctx: CollectContext = { signals: [], memos: [] }
): void {
  switch (node.type) {
    case 'element':
      collectFromElement(node, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
      break
    case 'conditional':
      // If this conditional has an ID, it's a dynamic element conditional that needs DOM switching
      if (node.id) {
        // Collect interactive elements from conditional branches separately
        // These need event re-attachment after DOM updates
        const condInteractiveElements: InteractiveElement[] = []
        collectClientJsInfo(node.whenTrue, condInteractiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
        collectClientJsInfo(node.whenFalse, condInteractiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)

        const whenTrueTemplate = irToHtmlTemplate(node.whenTrue, node.id, ctx)
        const whenFalseTemplate = irToHtmlTemplate(node.whenFalse, node.id, ctx)
        conditionalElements.push({
          id: node.id,
          condition: node.condition,
          whenTrueTemplate,
          whenFalseTemplate,
          interactiveElements: condInteractiveElements,
        })
      } else {
        // Static conditional - still recurse into branches
        collectClientJsInfo(node.whenTrue, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
        collectClientJsInfo(node.whenFalse, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
      }
      break
    case 'component':
      if (node.childInits) {
        childInits.push(node.childInits)
      }
      // Recursively process children passed to the component
      for (const child of node.children) {
        collectClientJsInfo(child, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
      }
      break
    case 'fragment':
      // Recursively process fragment children
      for (const child of node.children) {
        collectClientJsInfo(child, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
      }
      break
  }
}

/**
 * Collects all child component names from IR (for server-side imports)
 * Unlike collectClientJsInfo, this includes components inside lists
 */
export function collectAllChildComponentNames(node: IRNode): string[] {
  const names: string[] = []
  collectChildComponentNamesRecursive(node, names)
  return [...new Set(names)]
}

function collectChildComponentNamesRecursive(node: IRNode, names: string[]): void {
  switch (node.type) {
    case 'element':
      // Check listInfo for components inside lists
      if (node.listInfo?.itemIR) {
        collectChildComponentNamesRecursive(node.listInfo.itemIR, names)
      }
      // Recursively process children
      for (const child of node.children) {
        collectChildComponentNamesRecursive(child, names)
      }
      break
    case 'conditional':
      collectChildComponentNamesRecursive(node.whenTrue, names)
      collectChildComponentNamesRecursive(node.whenFalse, names)
      break
    case 'component':
      // Use node.name directly - this is the component name
      names.push(node.name)
      // Recursively process children passed to the component
      for (const child of node.children) {
        collectChildComponentNamesRecursive(child, names)
      }
      break
    case 'fragment':
      // Recursively process fragment children
      for (const child of node.children) {
        collectChildComponentNamesRecursive(child, names)
      }
      break
  }
}


/**
 * Converts IR node to HTML template string for client-side rendering
 *
 * Used to generate dynamic HTML templates for conditional branches.
 * Signal calls are kept as ${expression} for template literal interpolation.
 */
function irToHtmlTemplate(node: IRNode, condId: string, ctx: CollectContext): string {
  switch (node.type) {
    case 'text':
      return `<span data-bf-cond="${condId}">${escapeHtmlForTemplate(node.content)}</span>`

    case 'expression': {
      const exprValue = node.expression.trim()
      if (exprValue === 'null' || exprValue === 'undefined') {
        // Use empty comment markers for null
        return `<!--bf-cond-start:${condId}--><!--bf-cond-end:${condId}-->`
      }
      // Keep expression as template literal interpolation
      return `<span data-bf-cond="${condId}">\${${node.expression}}</span>`
    }

    case 'element':
      return elementToHtmlTemplate(node, condId, ctx)

    case 'fragment': {
      // Empty fragment - use empty comment markers
      if (node.children.length === 0) {
        return `<!--bf-cond-start:${condId}--><!--bf-cond-end:${condId}-->`
      }

      // Single element child - inject marker to that element
      if (node.children.length === 1 && node.children[0].type === 'element') {
        return elementToHtmlTemplate(node.children[0], condId, ctx)
      }

      // Multiple children - use comment markers to wrap all content (dynamic version)
      const childrenHtml = node.children.map(child => irNodeToHtmlDynamic(child, ctx)).join('')
      return `<!--bf-cond-start:${condId}-->${childrenHtml}<!--bf-cond-end:${condId}-->`
    }

    case 'component':
      // Components are rendered server-side, use placeholder
      return `<div data-bf-cond="${condId}"><!-- ${node.name} --></div>`

    case 'conditional': {
      // Nested conditional - use ternary in template literal
      const whenTrueHtml = irNodeToHtmlDynamic(node.whenTrue, ctx)
      const whenFalseHtml = irNodeToHtmlDynamic(node.whenFalse, ctx)
      return `<span data-bf-cond="${condId}">\${${node.condition} ? \`${whenTrueHtml}\` : \`${whenFalseHtml}\`}</span>`
    }
  }
}

/**
 * Converts IR element to HTML string with data-bf-cond attribute
 * Uses template literal interpolation for dynamic content
 */
function elementToHtmlTemplate(el: IRElement, condId: string, ctx: CollectContext): string {
  const { tagName, staticAttrs, dynamicAttrs, children } = el

  const attrParts: string[] = [`data-bf-cond="${condId}"`]

  // Add data-bf for elements with dynamic content or events
  // This allows client JS to find these elements after conditional DOM replacement
  if (el.id && (el.dynamicContent || el.events.length > 0)) {
    attrParts.push(`data-bf="${el.id}"`)
  }

  // Static attributes
  for (const attr of staticAttrs) {
    if (attr.value) {
      attrParts.push(`${attr.name}="${escapeHtmlForTemplate(attr.value)}"`)
    } else {
      attrParts.push(attr.name)
    }
  }

  // Dynamic attributes - keep as template literal interpolation
  for (const attr of dynamicAttrs) {
    attrParts.push(`${attr.name}="\${${attr.expression}}"`)
  }

  const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

  // Self-closing tags
  if (children.length === 0 && isSelfClosingHtmlTag(tagName)) {
    return `<${tagName}${attrsStr} />`
  }

  // Process children - use dynamic version
  const childrenHtml = children.map(child => irNodeToHtmlDynamic(child, ctx)).join('')

  return `<${tagName}${attrsStr}>${childrenHtml}</${tagName}>`
}

/**
 * Converts IR node to HTML string with dynamic expressions as template literal interpolations
 * Used for conditional branch templates where signals should be evaluated at runtime
 */
function irNodeToHtmlDynamic(node: IRNode, ctx: CollectContext): string {
  switch (node.type) {
    case 'text':
      return escapeHtmlForTemplate(node.content)

    case 'expression': {
      const exprValue = node.expression.trim()
      if (exprValue === 'null' || exprValue === 'undefined') {
        return ''
      }
      // Keep expression as template literal interpolation
      return `\${${node.expression}}`
    }

    case 'element': {
      const { tagName, staticAttrs, dynamicAttrs, children } = node
      const attrParts: string[] = []

      // Add data-bf for elements with dynamic content or events
      // This allows client JS to find these elements after conditional DOM replacement
      if (node.id && (node.dynamicContent || node.events.length > 0)) {
        attrParts.push(`data-bf="${node.id}"`)
      }

      for (const attr of staticAttrs) {
        if (attr.value) {
          attrParts.push(`${attr.name}="${escapeHtmlForTemplate(attr.value)}"`)
        } else {
          attrParts.push(attr.name)
        }
      }

      // Dynamic attributes - keep as template literal interpolation
      for (const attr of dynamicAttrs) {
        attrParts.push(`${attr.name}="\${${attr.expression}}"`)
      }

      const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

      if (children.length === 0 && isSelfClosingHtmlTag(tagName)) {
        return `<${tagName}${attrsStr} />`
      }

      const childrenHtml = children.map(child => irNodeToHtmlDynamic(child, ctx)).join('')
      return `<${tagName}${attrsStr}>${childrenHtml}</${tagName}>`
    }

    case 'fragment':
      return node.children.map(child => irNodeToHtmlDynamic(child, ctx)).join('')

    case 'component':
      return `<!-- ${node.name} -->`

    case 'conditional': {
      // Nested conditional - use ternary in template literal
      const whenTrueHtml = irNodeToHtmlDynamic(node.whenTrue, ctx)
      const whenFalseHtml = irNodeToHtmlDynamic(node.whenFalse, ctx)
      return `\${${node.condition} ? \`${whenTrueHtml}\` : \`${whenFalseHtml}\`}`
    }
  }
}

/**
 * Converts IR node to HTML string (without conditional marker)
 * Uses static values - kept for backward compatibility
 */
function irNodeToHtml(node: IRNode, ctx: CollectContext): string {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.content)

    case 'expression': {
      const exprValue = node.expression.trim()
      if (exprValue === 'null' || exprValue === 'undefined') {
        return ''
      }
      return replaceSignalsWithValues(node.expression, ctx.signals, ctx.memos)
    }

    case 'element': {
      const { tagName, staticAttrs, dynamicAttrs, children } = node
      const attrParts: string[] = []

      // Add data-bf for elements with dynamic content or events
      // This allows client JS to find these elements after conditional DOM replacement
      if (node.id && (node.dynamicContent || node.events.length > 0)) {
        attrParts.push(`data-bf="${node.id}"`)
      }

      for (const attr of staticAttrs) {
        if (attr.value) {
          attrParts.push(`${attr.name}="${escapeHtml(attr.value)}"`)
        } else {
          attrParts.push(attr.name)
        }
      }

      for (const attr of dynamicAttrs) {
        const value = replaceSignalsWithValues(attr.expression, ctx.signals, ctx.memos)
        attrParts.push(`${attr.name}="${escapeHtml(String(value))}"`)
      }

      const attrsStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : ''

      if (children.length === 0 && isSelfClosingHtmlTag(tagName)) {
        return `<${tagName}${attrsStr} />`
      }

      const childrenHtml = children.map(child => irNodeToHtml(child, ctx)).join('')
      return `<${tagName}${attrsStr}>${childrenHtml}</${tagName}>`
    }

    case 'fragment':
      return node.children.map(child => irNodeToHtml(child, ctx)).join('')

    case 'component':
      return `<!-- ${node.name} -->`

    case 'conditional': {
      // Evaluate condition with initial values
      const condValue = replaceSignalsWithValues(node.condition, ctx.signals, ctx.memos)
      // Simple evaluation for boolean conditions
      const isTrue = condValue === 'true' || (condValue !== 'false' && condValue !== '0' && condValue !== '')
      return isTrue ? irNodeToHtml(node.whenTrue, ctx) : irNodeToHtml(node.whenFalse, ctx)
    }
  }
}

/**
 * Replaces signal and memo calls with their initial values
 */
function replaceSignalsWithValues(expr: string, signals: SignalDeclaration[], memos: MemoDeclaration[]): string {
  let result = expr

  // Replace signal getter calls with initial values
  for (const signal of signals) {
    const getterPattern = new RegExp(`\\b${signal.getter}\\(\\)`, 'g')
    result = result.replace(getterPattern, signal.initialValue)
  }

  // Replace memo getter calls with evaluated computation
  for (const memo of memos) {
    const getterPattern = new RegExp(`\\b${memo.getter}\\(\\)`, 'g')
    if (getterPattern.test(result)) {
      let computationBody = memo.computation
      const arrowMatch = computationBody.match(/^\s*\(\s*\)\s*=>\s*(.+)$/s)
      if (arrowMatch) {
        computationBody = arrowMatch[1].trim()
      }
      for (const signal of signals) {
        const signalPattern = new RegExp(`\\b${signal.getter}\\(\\)`, 'g')
        computationBody = computationBody.replace(signalPattern, signal.initialValue)
      }
      result = result.replace(getterPattern, `(${computationBody})`)
    }
  }

  return result
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Escapes HTML special characters and template literal special characters
 * Used for content that will be embedded in JavaScript template literals
 */
function escapeHtmlForTemplate(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
}

/**
 * Checks if tag is self-closing in HTML
 */
function isSelfClosingHtmlTag(tagName: string): boolean {
  return ['input', 'br', 'hr', 'img', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'].includes(tagName.toLowerCase())
}

function collectFromElement(
  el: IRElement,
  interactiveElements: InteractiveElement[],
  dynamicElements: DynamicElement[],
  listElements: ListElement[],
  dynamicAttributes: DynamicAttribute[],
  childInits: Array<{ name: string; propsExpr: string }>,
  refElements: RefElement[],
  conditionalElements: ConditionalElement[] = [],
  ctx: CollectContext = { signals: [], memos: [] }
): void {
  // If element has ref
  if (el.ref && el.id) {
    refElements.push({
      id: el.id,
      tagName: el.tagName,
      callback: el.ref,
    })
  }

  // If element has events
  if (el.events.length > 0 && el.id) {
    interactiveElements.push({
      id: el.id,
      tagName: el.tagName,
      events: el.events,
    })
  }

  // If element has dynamic attributes
  if (el.dynamicAttrs.length > 0 && el.id) {
    for (const attr of el.dynamicAttrs) {
      dynamicAttributes.push({
        id: el.id,
        tagName: el.tagName,
        attrName: attr.name,
        expression: attr.expression,
      })
    }
  }

  // If element has dynamic content (signal-dependent children)
  if (el.dynamicContent && el.id) {
    dynamicElements.push({
      id: el.id,
      tagName: el.tagName,
      expression: el.dynamicContent.expression,
      fullContent: el.dynamicContent.fullContent,
    })
  }

  // If element has list info
  if (el.listInfo && el.id) {
    listElements.push({
      id: el.id,
      tagName: el.tagName,
      mapExpression: `${el.listInfo.arrayExpression}.map((${el.listInfo.paramName}, __index) => ${el.listInfo.itemTemplate}).join('')`,
      itemEvents: el.listInfo.itemEvents,
      arrayExpression: el.listInfo.arrayExpression,
      keyExpression: el.listInfo.keyExpression,
      paramName: el.listInfo.paramName,
      itemTemplate: el.listInfo.itemTemplate,
    })

    // List items are rendered as innerHTML template
    // Their events are handled via event delegation (itemEvents)
    // Their dynamic attributes are embedded in the template string
    // So we should NOT collect them as separate clientJs info
    // (No recursive call for listInfo.itemIR)
  }

  // Recursively process children
  for (const child of el.children) {
    collectClientJsInfo(child, interactiveElements, dynamicElements, listElements, dynamicAttributes, childInits, refElements, conditionalElements, ctx)
  }
}
