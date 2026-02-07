/**
 * BarefootJS Compiler - Client JS Generator
 *
 * Generates client-side JavaScript from Pure IR for hydration.
 */

import type {
  ComponentIR,
  IRNode,
  IRElement,
  IREvent,
  IRLoopChildComponent,
  IRTemplateLiteral,
  SignalInfo,
  MemoInfo,
  EffectInfo,
  OnMountInfo,
  FunctionInfo,
  ConstantInfo,
  ParamInfo,
} from './types'
import { isBooleanAttr } from './html-constants'

/**
 * Convert an attribute value to a string expression.
 * Handles both string values and IRTemplateLiteral.
 */
function attrValueToString(value: string | IRTemplateLiteral | null): string | null {
  if (value === null) return null
  if (typeof value === 'string') return value

  // Reconstruct the template literal as a JS expression
  let result = '`'
  for (const part of value.parts) {
    if (part.type === 'string') {
      result += part.value
    } else if (part.type === 'ternary') {
      result += `\${${part.condition} ? '${part.whenTrue}' : '${part.whenFalse}'}`
    }
  }
  result += '`'
  return result
}

// =============================================================================
// Types
// =============================================================================

interface ClientJsContext {
  componentName: string
  signals: SignalInfo[]
  memos: MemoInfo[]
  effects: EffectInfo[]
  onMounts: OnMountInfo[]
  localFunctions: FunctionInfo[]
  localConstants: ConstantInfo[]
  propsParams: ParamInfo[]
  propsObjectName: string | null

  // Collected elements
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  conditionalElements: ConditionalElement[]
  loopElements: LoopElement[]
  refElements: RefElement[]
  childInits: ChildInit[]
  reactiveProps: ReactiveComponentProp[]
  reactiveChildProps: ReactiveChildProp[]
  reactiveAttrs: ReactiveAttribute[]
  clientOnlyElements: ClientOnlyElement[]
  clientOnlyConditionals: ClientOnlyConditional[]
}

interface InteractiveElement {
  slotId: string
  events: IREvent[]
  isComponentSlot?: boolean // true if this slot is for a component (uses data-bf-scope)
}

interface ReactiveComponentProp {
  slotId: string
  propName: string
  expression: string
  componentName: string
}

/**
 * Reactive prop for a child component.
 * These are props that depend on parent's props and need
 * createEffect to update the child component's DOM attributes.
 */
interface ReactiveChildProp {
  componentName: string
  slotId: string | null
  propName: string // The prop name (e.g., 'className')
  attrName: string // The DOM attribute name (e.g., 'class')
  expression: string // The expanded expression (with props.xxx references)
}

interface DynamicElement {
  slotId: string
  expression: string
  insideConditional?: boolean // true if element is inside a conditional branch
}

interface ConditionalBranchEvent {
  slotId: string
  eventName: string
  handler: string
}

interface ConditionalBranchRef {
  slotId: string
  callback: string
}

interface ConditionalElement {
  slotId: string
  condition: string
  whenTrueHtml: string
  whenFalseHtml: string
  whenTrueEvents: ConditionalBranchEvent[]
  whenFalseEvents: ConditionalBranchEvent[]
  whenTrueRefs: ConditionalBranchRef[]
  whenFalseRefs: ConditionalBranchRef[]
}

interface LoopChildEvent {
  eventName: string // 'click', 'submit', etc.
  childSlotId: string // data-bf slot ID of the element with the event
  handler: string // Handler expression (may reference loop param)
}

interface LoopElement {
  slotId: string
  array: string
  param: string
  index: string | null
  key: string | null
  template: string
  childEventHandlers: string[] // Event handlers from child elements (for identifier extraction)
  childEvents: LoopChildEvent[] // Detailed event info for delegation
  childComponent?: IRLoopChildComponent // For createComponent-based rendering
  nestedComponents?: IRLoopChildComponent[] // For nested components in static arrays
  isStaticArray: boolean // True if array is a static prop (not a signal)
  filterPredicate?: {
    param: string
    raw: string  // Original filter predicate expression or block body
  }
}

interface RefElement {
  slotId: string
  callback: string
}

interface ChildInit {
  name: string
  slotId: string | null
  propsExpr: string // e.g., "{ onAdd: handleAdd }"
}

interface ReactiveAttribute {
  slotId: string
  attrName: string
  expression: string
}

interface ClientOnlyElement {
  slotId: string
  expression: string
}

interface ClientOnlyConditional {
  slotId: string
  condition: string
  whenTrueHtml: string
  whenFalseHtml: string
  whenTrueEvents: ConditionalBranchEvent[]
  whenFalseEvents: ConditionalBranchEvent[]
  whenTrueRefs: ConditionalBranchRef[]
  whenFalseRefs: ConditionalBranchRef[]
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Map of JSX event names to DOM event property names.
 * JSX uses React-style naming (e.g., onDoubleClick) which gets converted to
 * lowercase (doubleclick), but some DOM events have different names (dblclick).
 */
const jsxToDomEventMap: Record<string, string> = {
  doubleclick: 'dblclick',
}

/**
 * Convert JSX-derived event name to DOM event property name.
 * Example: 'doubleclick' → 'ondblclick'
 */
function toDomEventProp(eventName: string): string {
  const mappedName = jsxToDomEventMap[eventName] ?? eventName
  return `on${mappedName}`
}

/**
 * Convert JSX attribute name to HTML attribute name.
 * Handles React-style naming conventions (e.g., className → class).
 */
function toHtmlAttrName(jsxAttrName: string): string {
  if (jsxAttrName === 'className') return 'class'
  return jsxAttrName
}

/**
 * Wrap arrow function handler in block to prevent accidental return false.
 * Returning false from a DOM event handler prevents default behavior.
 *
 * Example:
 *   Input:  (e) => e.key === 'Enter' && handleAdd()
 *   Output: (e) => { e.key === 'Enter' && handleAdd() }
 */
function wrapHandlerInBlock(handler: string): string {
  // Strip TypeScript syntax (type assertions, type annotations) from the handler
  const stripped = stripTypeScriptSyntax(handler)
  const trimmed = stripped.trim()

  // Check if it's an arrow function with expression body
  if (trimmed.startsWith('(') && trimmed.includes('=>')) {
    const arrowIndex = trimmed.indexOf('=>')
    const params = trimmed.substring(0, arrowIndex + 2)
    const body = trimmed.substring(arrowIndex + 2).trim()

    // If body is not already a block, wrap it
    if (!body.startsWith('{')) {
      return `${params} { ${body} }`
    }
  }

  return trimmed
}

// =============================================================================
// Main Entry Point
// =============================================================================

export function generateClientJs(ir: ComponentIR, siblingComponents?: string[]): string {
  const ctx = createContext(ir)

  // Collect all interactive/dynamic elements from IR
  collectElements(ir.root, ctx)

  // Check if client JS is needed
  if (!needsClientJs(ctx)) {
    return ''
  }

  return generateInitFunction(ir, ctx, siblingComponents)
}

function createContext(ir: ComponentIR): ClientJsContext {
  return {
    componentName: ir.metadata.componentName,
    signals: ir.metadata.signals,
    memos: ir.metadata.memos,
    effects: ir.metadata.effects,
    onMounts: ir.metadata.onMounts,
    localFunctions: ir.metadata.localFunctions,
    localConstants: ir.metadata.localConstants,
    propsParams: ir.metadata.propsParams,
    propsObjectName: ir.metadata.propsObjectName,

    interactiveElements: [],
    dynamicElements: [],
    conditionalElements: [],
    loopElements: [],
    refElements: [],
    childInits: [],
    reactiveProps: [],
    reactiveChildProps: [],
    reactiveAttrs: [],
    clientOnlyElements: [],
    clientOnlyConditionals: [],
  }
}

function needsClientJs(ctx: ClientJsContext): boolean {
  return (
    ctx.signals.length > 0 ||
    ctx.memos.length > 0 ||
    ctx.effects.length > 0 ||
    ctx.onMounts.length > 0 ||
    ctx.interactiveElements.length > 0 ||
    ctx.dynamicElements.length > 0 ||
    ctx.conditionalElements.length > 0 ||
    ctx.loopElements.length > 0 ||
    ctx.refElements.length > 0 ||
    ctx.childInits.length > 0 ||
    ctx.reactiveAttrs.length > 0 ||
    ctx.clientOnlyElements.length > 0 ||
    ctx.clientOnlyConditionals.length > 0
  )
}

// =============================================================================
// Element Collection
// =============================================================================

function collectElements(node: IRNode, ctx: ClientJsContext, insideConditional = false): void {
  switch (node.type) {
    case 'element':
      collectFromElement(node, ctx, insideConditional)
      for (const child of node.children) {
        collectElements(child, ctx, insideConditional)
      }
      break

    case 'expression':
      if (node.clientOnly && node.slotId) {
        // Client-only: uses comment marker, evaluated via updateClientMarker()
        ctx.clientOnlyElements.push({
          slotId: node.slotId,
          expression: node.expr,
        })
      } else if (node.reactive && node.slotId) {
        // Normal reactive: uses <span data-bf>
        ctx.dynamicElements.push({
          slotId: node.slotId,
          expression: node.expr,
          insideConditional,
        })
      }
      break

    case 'conditional':
      if (node.clientOnly && node.slotId) {
        // Client-only conditional: uses comment markers, evaluated on client via insert()
        const whenTrueEvents = collectConditionalBranchEvents(node.whenTrue)
        const whenFalseEvents = collectConditionalBranchEvents(node.whenFalse)
        const whenTrueRefs = collectConditionalBranchRefs(node.whenTrue)
        const whenFalseRefs = collectConditionalBranchRefs(node.whenFalse)
        ctx.clientOnlyConditionals.push({
          slotId: node.slotId,
          condition: node.condition,
          whenTrueHtml: irToHtmlTemplate(node.whenTrue),
          whenFalseHtml: irToHtmlTemplate(node.whenFalse),
          whenTrueEvents,
          whenFalseEvents,
          whenTrueRefs,
          whenFalseRefs,
        })
      } else if (node.reactive && node.slotId) {
        // Normal reactive conditional: server renders initial state
        // Collect events and refs from each branch for use with insert()
        const whenTrueEvents = collectConditionalBranchEvents(node.whenTrue)
        const whenFalseEvents = collectConditionalBranchEvents(node.whenFalse)
        const whenTrueRefs = collectConditionalBranchRefs(node.whenTrue)
        const whenFalseRefs = collectConditionalBranchRefs(node.whenFalse)

        ctx.conditionalElements.push({
          slotId: node.slotId,
          condition: node.condition,
          whenTrueHtml: irToHtmlTemplate(node.whenTrue),
          whenFalseHtml: irToHtmlTemplate(node.whenFalse),
          whenTrueEvents,
          whenFalseEvents,
          whenTrueRefs,
          whenFalseRefs,
        })
      }
      // Recurse into conditional branches with insideConditional = true
      // This is still needed for dynamic text elements inside conditionals
      collectElements(node.whenTrue, ctx, true)
      collectElements(node.whenFalse, ctx, true)
      break

    case 'loop':
      if (node.slotId) {
        // Collect event handlers from loop children for function extraction
        const childHandlers: string[] = []
        const childEvents: LoopChildEvent[] = []
        for (const child of node.children) {
          childHandlers.push(...collectEventHandlersFromIR(child))
          childEvents.push(...collectLoopChildEvents(child))
        }

        // Also extract identifiers from childComponent props if present
        if (node.childComponent) {
          for (const prop of node.childComponent.props) {
            if (prop.isEventHandler) {
              childHandlers.push(prop.value)
            }
          }
        }

        ctx.loopElements.push({
          slotId: node.slotId,
          array: node.array,
          param: node.param,
          index: node.index,
          key: node.key,
          template: node.childComponent ? '' : irToHtmlTemplate(node.children[0]),
          childEventHandlers: childHandlers,
          childEvents,
          childComponent: node.childComponent,
          nestedComponents: node.nestedComponents,
          isStaticArray: node.isStaticArray,
          filterPredicate: node.filterPredicate ? {
            param: node.filterPredicate.param,
            raw: node.filterPredicate.raw,
          } : undefined,
        })
      }
      // Don't traverse into loop children for interactive elements collection
      // (they use loop variables that are only available inside the loop iteration).
      // But we DO extract event handler identifiers above for function inclusion.
      break

    case 'component':
      // Check for event handlers and reactive props on component
      if (node.slotId) {
        // Event handlers need to be attached to the component's rendered root element
        const componentEvents: IREvent[] = []
        for (const prop of node.props) {
          if (prop.name.startsWith('on') && prop.name.length > 2) {
            // Convert onClick to click, onSubmit to submit, etc.
            const eventName = prop.name[2].toLowerCase() + prop.name.slice(3)
            componentEvents.push({
              name: eventName,
              handler: prop.value,
              loc: prop.loc,
            })
          }
        }
        if (componentEvents.length > 0) {
          // Use the component's slotId to find the rendered element
          // Component slots use data-bf-scope instead of data-bf
          ctx.interactiveElements.push({
            slotId: node.slotId,
            events: componentEvents,
            isComponentSlot: true,
          })
        }

        // Check for reactive props (props that call signal/memo getters)
        // These need effects to update the element when values change
        for (const prop of node.props) {
          // Skip event handlers
          if (prop.name.startsWith('on') && prop.name.length > 2) continue
          // Check if prop value is a function call that matches a memo name
          const value = prop.value
          if (value.endsWith('()')) {
            const fnName = value.slice(0, -2)
            // Check if it's a memo or signal getter
            const isMemo = ctx.memos.some((m) => m.name === fnName)
            const isSignalGetter = ctx.signals.some((s) => s.getter === fnName)
            if (isMemo || isSignalGetter) {
              ctx.reactiveProps.push({
                slotId: node.slotId,
                propName: prop.name,
                expression: fnName,
                componentName: node.name,
              })
            }
          }
        }
      }

      // Build propsExpr from component props for parent-child communication
      const propsForInit: string[] = []
      for (const prop of node.props) {
        // Skip spread/rest props (can't be represented as property definitions)
        if (prop.name === '...' || prop.name.startsWith('...')) continue
        // Event handlers (on*) passed directly to child
        const isEventHandler =
          prop.name.startsWith('on') &&
          prop.name.length > 2 &&
          prop.name[2] === prop.name[2].toUpperCase()
        if (isEventHandler) {
          propsForInit.push(`${prop.name}: ${prop.value}`)
        } else if (prop.dynamic) {
          // Dynamic props wrapped in getters for reactivity (SolidJS-style)
          // Expand constant references and replace prop references with props.xxx pattern
          const expandedValue = expandDynamicPropValue(prop.value, ctx)
          propsForInit.push(`get ${prop.name}() { return ${expandedValue} }`)

          // If the expanded value references props OR reactive expressions (signals/memos),
          // add to reactiveChildProps so we can generate createEffect to update the child's DOM attribute
          const hasPropsRef = expandedValue.includes('props.')
          const hasReactiveExpr = isReactiveExpression(expandedValue, ctx)
          if (hasPropsRef || hasReactiveExpr) {
            // Map prop name to DOM attribute name
            const attrName = prop.name === 'className' ? 'class' : prop.name
            ctx.reactiveChildProps.push({
              componentName: node.name,
              slotId: node.slotId,
              propName: prop.name,
              attrName,
              expression: expandedValue,
            })
          }
        } else if (prop.isLiteral) {
          // String literal from JSX attribute (e.g., value="account")
          propsForInit.push(`${prop.name}: ${JSON.stringify(prop.value)}`)
        } else {
          // Variable reference or function call (non-dynamic, non-literal)
          propsForInit.push(`${prop.name}: ${prop.value}`)
        }
      }
      const propsExpr =
        propsForInit.length > 0 ? `{ ${propsForInit.join(', ')} }` : '{}'

      ctx.childInits.push({
        name: node.name,
        slotId: node.slotId,
        propsExpr,
      })
      for (const child of node.children) {
        collectElements(child, ctx)
      }
      break

    case 'fragment':
      for (const child of node.children) {
        collectElements(child, ctx)
      }
      break

    case 'if-statement':
      collectElements(node.consequent, ctx, insideConditional)
      if (node.alternate) {
        collectElements(node.alternate, ctx, insideConditional)
      }
      break
  }
}

function collectFromElement(element: IRElement, ctx: ClientJsContext, _insideConditional = false): void {
  // Events
  if (element.events.length > 0 && element.slotId) {
    ctx.interactiveElements.push({
      slotId: element.slotId,
      events: element.events,
    })
  }

  // Refs
  if (element.ref && element.slotId) {
    ctx.refElements.push({
      slotId: element.slotId,
      callback: element.ref,
    })
  }

  // Reactive attributes (attributes that depend on signals/memos)
  if (element.slotId) {
    for (const attr of element.attrs) {
      if (attr.dynamic && attr.value) {
        // Convert IRTemplateLiteral to string for reactivity checking
        const valueStr = attrValueToString(attr.value)
        if (!valueStr) continue

        // Check if the attribute value references any signal getters or memos
        const isReactive = isReactiveExpression(valueStr, ctx)
        if (isReactive) {
          ctx.reactiveAttrs.push({
            slotId: element.slotId,
            attrName: attr.name,
            expression: valueStr,
          })
        }
      }
    }
  }
}

/**
 * Check if an expression references signal getters or memos.
 */
function isReactiveExpression(expr: string, ctx: ClientJsContext): boolean {
  // Check for signal getter calls like `open()`, `count()`
  for (const signal of ctx.signals) {
    const pattern = new RegExp(`\\b${signal.getter}\\s*\\(`)
    if (pattern.test(expr)) {
      return true
    }
  }

  // Check for memo calls
  for (const memo of ctx.memos) {
    const pattern = new RegExp(`\\b${memo.name}\\s*\\(`)
    if (pattern.test(expr)) {
      return true
    }
  }

  // Check for props references (props.xxx may be reactive when passed as getters from parent)
  if (/\bprops\.\w+/.test(expr)) {
    return true
  }

  return false
}

// =============================================================================
// Helper: Collect event handlers from IR nodes
// =============================================================================

/**
 * Recursively collect all event handler expressions from an IR node tree.
 * Used to extract function identifiers from loop children.
 */
function collectEventHandlersFromIR(node: IRNode): string[] {
  const handlers: string[] = []

  switch (node.type) {
    case 'element':
      for (const event of node.events) {
        handlers.push(event.handler)
      }
      for (const child of node.children) {
        handlers.push(...collectEventHandlersFromIR(child))
      }
      break
    case 'fragment':
      for (const child of node.children) {
        handlers.push(...collectEventHandlersFromIR(child))
      }
      break
    case 'conditional':
      handlers.push(...collectEventHandlersFromIR(node.whenTrue))
      handlers.push(...collectEventHandlersFromIR(node.whenFalse))
      break
    case 'component':
      // Component props that are event handlers
      for (const prop of node.props) {
        if (prop.name.startsWith('on') && prop.name.length > 2) {
          handlers.push(prop.value)
        }
      }
      for (const child of node.children) {
        handlers.push(...collectEventHandlersFromIR(child))
      }
      break
    case 'if-statement':
      handlers.push(...collectEventHandlersFromIR(node.consequent))
      if (node.alternate) {
        handlers.push(...collectEventHandlersFromIR(node.alternate))
      }
      break
    // Text, expression, slot, loop don't have events at this level
  }

  return handlers
}

/**
 * Collect events from a conditional branch for use with insert().
 * These events will be bound via the branch's bindEvents function.
 */
function collectConditionalBranchEvents(node: IRNode): ConditionalBranchEvent[] {
  const events: ConditionalBranchEvent[] = []

  function traverse(n: IRNode): void {
    switch (n.type) {
      case 'element':
        // Collect events from this element
        if (n.slotId && n.events.length > 0) {
          for (const event of n.events) {
            events.push({
              slotId: n.slotId,
              eventName: event.name,
              handler: event.handler,
            })
          }
        }
        // Recurse into children
        for (const child of n.children) {
          traverse(child)
        }
        break
      case 'fragment':
        for (const child of n.children) {
          traverse(child)
        }
        break
      case 'conditional':
        // Nested conditionals - collect from both branches
        traverse(n.whenTrue)
        traverse(n.whenFalse)
        break
      case 'component':
        for (const child of n.children) {
          traverse(child)
        }
        break
      case 'if-statement':
        traverse(n.consequent)
        if (n.alternate) {
          traverse(n.alternate)
        }
        break
    }
  }

  traverse(node)
  return events
}

/**
 * Collect refs from a conditional branch for use with insert().
 * These refs will be called via the branch's bindEvents function.
 */
function collectConditionalBranchRefs(node: IRNode): ConditionalBranchRef[] {
  const refs: ConditionalBranchRef[] = []

  function traverse(n: IRNode): void {
    switch (n.type) {
      case 'element':
        // Collect ref from this element
        if (n.slotId && n.ref) {
          refs.push({
            slotId: n.slotId,
            callback: n.ref,
          })
        }
        // Recurse into children
        for (const child of n.children) {
          traverse(child)
        }
        break
      case 'fragment':
        for (const child of n.children) {
          traverse(child)
        }
        break
      case 'conditional':
        // Nested conditionals - collect from both branches
        traverse(n.whenTrue)
        traverse(n.whenFalse)
        break
      case 'component':
        for (const child of n.children) {
          traverse(child)
        }
        break
      case 'if-statement':
        traverse(n.consequent)
        if (n.alternate) {
          traverse(n.alternate)
        }
        break
    }
  }

  traverse(node)
  return refs
}

/**
 * Collect detailed event info from loop children for event delegation
 */
function collectLoopChildEvents(node: IRNode): LoopChildEvent[] {
  const events: LoopChildEvent[] = []

  switch (node.type) {
    case 'element':
      // Collect events from this element
      if (node.slotId) {
        for (const event of node.events) {
          events.push({
            eventName: event.name,
            childSlotId: node.slotId,
            handler: event.handler,
          })
        }
      }
      // Recurse into children
      for (const child of node.children) {
        events.push(...collectLoopChildEvents(child))
      }
      break
    case 'fragment':
      for (const child of node.children) {
        events.push(...collectLoopChildEvents(child))
      }
      break
    case 'conditional':
      events.push(...collectLoopChildEvents(node.whenTrue))
      events.push(...collectLoopChildEvents(node.whenFalse))
      break
    case 'component':
      for (const child of node.children) {
        events.push(...collectLoopChildEvents(child))
      }
      break
    case 'if-statement':
      events.push(...collectLoopChildEvents(node.consequent))
      if (node.alternate) {
        events.push(...collectLoopChildEvents(node.alternate))
      }
      break
  }

  return events
}

// =============================================================================
// HTML Template Generation (for conditionals/loops)
// =============================================================================

function irToHtmlTemplate(node: IRNode): string {
  switch (node.type) {
    case 'element': {
      // Build attributes, including data-bf marker if element has slotId
      const attrParts = node.attrs
        .map((a) => {
          if (a.name === '...') return ''
          const attrName = toHtmlAttrName(a.name)
          if (a.value === null) return attrName
          if (a.dynamic && isBooleanAttr(attrName)) {
            return `\${${a.value} ? '${attrName}' : ''}`
          }
          if (a.dynamic) return `${attrName}="\${${a.value}}"`
          return `${attrName}="${a.value}"`
        })
        .filter(Boolean)

      // Add data-bf marker if element has a slotId
      if (node.slotId) {
        attrParts.push(`data-bf="${node.slotId}"`)
      }

      const attrs = attrParts.join(' ')
      const children = node.children.map(irToHtmlTemplate).join('')

      if (children) {
        return `<${node.tag}${attrs ? ' ' + attrs : ''}>${children}</${node.tag}>`
      }
      return `<${node.tag}${attrs ? ' ' + attrs : ''} />`
    }

    case 'text':
      return node.value

    case 'expression':
      if (node.expr === 'null' || node.expr === 'undefined') return ''
      // Wrap expression in span with data-bf marker if it has a slotId
      if (node.slotId) {
        return `<span data-bf="${node.slotId}">\${${node.expr}}</span>`
      }
      return `\${${node.expr}}`

    case 'conditional':
      return `\${${node.condition} ? \`${irToHtmlTemplate(node.whenTrue)}\` : \`${irToHtmlTemplate(node.whenFalse)}\`}`

    case 'fragment':
      return node.children.map(irToHtmlTemplate).join('')

    case 'component': {
      // Portal is a special pass-through component - render its children directly
      // Portal moves content to document.body, so we need the actual content in templates
      if (node.name === 'Portal') {
        return node.children.map(irToHtmlTemplate).join('')
      }

      // Component children in loops require special handling.
      // We generate a placeholder with scope marker that can be hydrated.
      // Note: Full component rendering on client is a known limitation.
      // For dynamic lists, consider using plain elements instead of components.
      const keyProp = node.props.find((p) => p.name === 'key')
      const keyAttr = keyProp ? ` data-key="\${${keyProp.value}}"` : ''
      const scopeAttr = ` data-bf-scope="${node.name}_\${Math.random().toString(36).slice(2, 8)}"`
      // Generate minimal placeholder - content will be rendered by component
      return `<div${keyAttr}${scopeAttr}></div>`
    }

    case 'loop':
      // Nested loops - render children
      return node.children.map(irToHtmlTemplate).join('')

    case 'if-statement':
      // Compile-time if-statement: both branches handled at SSR level
      return ''

    default:
      return ''
  }
}

/**
 * Add data-bf-cond attribute to the first element in an HTML template string.
 * This ensures cond() can find the element for subsequent swaps.
 */
function addCondAttrToTemplate(html: string, condId: string): string {
  // Element: add data-bf-cond attribute
  if (/^<\w+/.test(html)) {
    return html.replace(/^(<\w+)(\s|>)/, `$1 data-bf-cond="${condId}"$2`)
  }
  // Text: use comment markers
  return `<!--bf-cond-start:${condId}-->${html}<!--bf-cond-end:${condId}-->`
}

/**
 * Generate HTML template for registerTemplate().
 * Used for client-side component creation via createComponent().
 *
 * This is similar to irToHtmlTemplate but:
 * - Expressions are transformed to use the template function's props parameter
 * - data-bf markers ARE included so client code can find elements
 *
 * @param node - IR node to render
 * @param propNames - Set of prop names to prefix with 'props.'
 */
function irToComponentTemplate(node: IRNode, propNames: Set<string>): string {
  // Helper to transform expressions to use props.propName
  const transformExpr = (expr: string): string => {
    // Replace prop references with props.propName
    // Only match when the prop is used as an identifier (followed by . or [ or end of expression)
    // Don't match inside string literals (preceded by ' or ")
    let result = expr
    for (const propName of propNames) {
      // Match propName when:
      // - Not already prefixed with 'props.'
      // - Not inside a string literal (not preceded by ' or ")
      // - Followed by property access (.), index access ([), method call (, or end of expression context
      // This prevents matching 'todo' in 'todo-item' class names
      const pattern = new RegExp(`(?<!props\\.)(?<!['"\\w])\\b${propName}\\b(?=[.\\[()])`, 'g')
      result = result.replace(pattern, `props.${propName}`)
    }
    return result
  }

  switch (node.type) {
    case 'element': {
      const attrParts = node.attrs
        .map((a) => {
          if (a.name === '...') return ''
          if (a.name === 'key') return ''
          const attrName = toHtmlAttrName(a.name)
          if (a.value === null) return attrName
          const valueStr = attrValueToString(a.value)
          if (a.dynamic && valueStr && isBooleanAttr(attrName)) {
            return `\${${transformExpr(valueStr)} ? '${attrName}' : ''}`
          }
          if (a.dynamic && valueStr) return `${attrName}="\${${transformExpr(valueStr)}}"`
          if (valueStr) return `${attrName}="${valueStr}"`
          return attrName
        })
        .filter(Boolean)

      // Add data-bf marker if element has a slotId (for client-side event binding)
      if (node.slotId) {
        attrParts.push(`data-bf="${node.slotId}"`)
      }

      const attrs = attrParts.join(' ')
      const children = node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

      if (children) {
        return `<${node.tag}${attrs ? ' ' + attrs : ''}>${children}</${node.tag}>`
      }
      return `<${node.tag}${attrs ? ' ' + attrs : ''} />`
    }

    case 'text':
      return node.value

    case 'expression':
      if (node.expr === 'null' || node.expr === 'undefined') return ''
      // Wrap expression in span with data-bf marker if it has a slotId
      if (node.slotId) {
        return `<span data-bf="${node.slotId}">\${${transformExpr(node.expr)}}</span>`
      }
      return `\${${transformExpr(node.expr)}}`

    case 'conditional': {
      const trueBranch = irToComponentTemplate(node.whenTrue, propNames)
      const falseBranch = irToComponentTemplate(node.whenFalse, propNames)
      // Add data-bf-cond attribute to each branch for conditional swapping
      const trueHtml = node.slotId ? addCondAttrToTemplate(trueBranch, node.slotId) : trueBranch
      const falseHtml = node.slotId ? addCondAttrToTemplate(falseBranch, node.slotId) : falseBranch
      return `\${${transformExpr(node.condition)} ? \`${trueHtml}\` : \`${falseHtml}\`}`
    }

    case 'fragment':
      return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

    case 'component': {
      // Portal is a special pass-through component - render its children directly
      if (node.name === 'Portal') {
        return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')
      }

      // Nested components render as placeholders
      const keyProp = node.props.find((p) => p.name === 'key')
      const keyAttr = keyProp ? ` data-key="\${${transformExpr(keyProp.value)}}"` : ''
      return `<div${keyAttr} data-bf-scope="${node.name}_\${Math.random().toString(36).slice(2, 8)}"></div>`
    }

    case 'loop':
      return node.children.map((c) => irToComponentTemplate(c, propNames)).join('')

    case 'if-statement':
      // Compile-time if-statement: both branches handled at SSR level
      return ''

    default:
      return ''
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a component can have a simple static template generated.
 * Returns false if the component has:
 * - Loops (which use dynamic signal arrays)
 * - Child components (which can't be fully represented in templates)
 * - Signal calls in expressions (like todos().length)
 *
 * Components that fail this check should not have registerTemplate() generated
 * as the template would reference undefined variables at module scope.
 */
function canGenerateStaticTemplate(node: IRNode, propNames: Set<string>): boolean {
  switch (node.type) {
    case 'loop':
      // Loops use signal arrays which aren't available at module scope
      return false

    case 'component':
      // Child components can't be fully represented in static templates
      return false

    case 'expression':
      // Check if expression references non-prop variables with function calls
      // e.g., todos().length or todos().filter(...) would fail
      // Only allow: prop references (todo.done) or static values
      if (node.expr.includes('()') && !isSimplePropExpression(node.expr, propNames)) {
        return false
      }
      return true

    case 'element':
      // Check all children and dynamic attributes
      for (const attr of node.attrs) {
        if (attr.dynamic && attr.value) {
          const valueStr = attrValueToString(attr.value)
          if (valueStr && valueStr.includes('()') && !isSimplePropExpression(valueStr, propNames)) {
            return false
          }
        }
      }
      return node.children.every((c) => canGenerateStaticTemplate(c, propNames))

    case 'conditional':
      // Check condition and both branches
      if (node.condition.includes('()') && !isSimplePropExpression(node.condition, propNames)) {
        return false
      }
      return canGenerateStaticTemplate(node.whenTrue, propNames) &&
             canGenerateStaticTemplate(node.whenFalse, propNames)

    case 'fragment':
      return node.children.every((c) => canGenerateStaticTemplate(c, propNames))

    case 'if-statement':
      // Check both branches of the if-statement
      if (!canGenerateStaticTemplate(node.consequent, propNames)) {
        return false
      }
      if (node.alternate && !canGenerateStaticTemplate(node.alternate, propNames)) {
        return false
      }
      return true

    case 'text':
      return true

    default:
      return true
  }
}

/**
 * Check if an expression is a simple prop-based expression.
 * Simple prop expressions access props only: todo.done, todo.text, props.name
 * Non-prop expressions call signals: todos(), todos().length, todos().filter(...)
 */
function isSimplePropExpression(expr: string, propNames: Set<string>): boolean {
  // Extract the root identifier (before any . or [ or ()
  const match = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/)
  if (!match) return true // Not an identifier, probably a literal

  const rootIdent = match[1]

  // If the root is a prop, it's safe (props are passed to the template function)
  if (propNames.has(rootIdent)) return true

  // If it contains () and root is not a prop, it's a signal call
  if (expr.includes('()')) return false

  return true
}

/**
 * Collect local function names used as event handlers
 */
function collectUsedFunctions(ctx: ClientJsContext): Set<string> {
  const used = new Set<string>()

  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      // Check if the handler is a simple identifier (local function)
      // vs an inline function or prop reference
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(event.handler)) {
        used.add(event.handler)
      }
    }
  }

  return used
}

/**
 * Collect all identifiers used in client-side reactive code.
 * This includes identifiers in:
 * - Event handlers
 * - Dynamic expressions
 * - Conditionals (condition and html templates)
 * - Loops
 */
function collectUsedIdentifiers(ctx: ClientJsContext): Set<string> {
  const used = new Set<string>()

  // From event handlers
  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      extractIdentifiers(event.handler, used)
    }
  }

  // From dynamic expressions
  for (const elem of ctx.dynamicElements) {
    extractIdentifiers(elem.expression, used)
  }

  // From conditionals - condition and html templates
  for (const elem of ctx.conditionalElements) {
    extractIdentifiers(elem.condition, used)
    // Extract identifiers from template expressions like ${fullCommand}
    extractTemplateIdentifiers(elem.whenTrueHtml, used)
    extractTemplateIdentifiers(elem.whenFalseHtml, used)
  }

  // From client-only conditionals - same as regular conditionals
  for (const elem of ctx.clientOnlyConditionals) {
    extractIdentifiers(elem.condition, used)
    extractTemplateIdentifiers(elem.whenTrueHtml, used)
    extractTemplateIdentifiers(elem.whenFalseHtml, used)
    // Also extract from event handlers in branches
    for (const event of elem.whenTrueEvents) {
      extractIdentifiers(event.handler, used)
    }
    for (const event of elem.whenFalseEvents) {
      extractIdentifiers(event.handler, used)
    }
  }

  // From loops
  for (const elem of ctx.loopElements) {
    extractIdentifiers(elem.array, used)
    extractTemplateIdentifiers(elem.template, used)
    // Extract identifiers from child element event handlers
    for (const handler of elem.childEventHandlers) {
      extractIdentifiers(handler, used)
    }
  }

  // From signal initial values
  for (const signal of ctx.signals) {
    extractIdentifiers(signal.initialValue, used)
  }

  // From memo computations
  for (const memo of ctx.memos) {
    extractIdentifiers(memo.computation, used)
  }

  // From effect bodies
  for (const effect of ctx.effects) {
    extractIdentifiers(effect.body, used)
  }

  // From onMount bodies
  for (const onMount of ctx.onMounts) {
    extractIdentifiers(onMount.body, used)
  }

  // From ref callbacks
  for (const elem of ctx.refElements) {
    extractIdentifiers(elem.callback, used)
  }

  // From conditional branch refs
  for (const elem of ctx.conditionalElements) {
    for (const ref of elem.whenTrueRefs) {
      extractIdentifiers(ref.callback, used)
    }
    for (const ref of elem.whenFalseRefs) {
      extractIdentifiers(ref.callback, used)
    }
  }

  // From client-only conditional branch refs
  for (const elem of ctx.clientOnlyConditionals) {
    for (const ref of elem.whenTrueRefs) {
      extractIdentifiers(ref.callback, used)
    }
    for (const ref of elem.whenFalseRefs) {
      extractIdentifiers(ref.callback, used)
    }
  }

  // From local function bodies (to find prop references like onAdd)
  for (const fn of ctx.localFunctions) {
    extractIdentifiers(fn.body, used)
  }

  // From local constants (including arrow functions like handleAdd)
  // Arrow functions in const declarations may reference props
  for (const constant of ctx.localConstants) {
    extractIdentifiers(constant.value, used)
  }

  // From child component props (e.g., initChild('Icon', scope, { className: () => iconClasses }))
  for (const child of ctx.childInits) {
    extractIdentifiers(child.propsExpr, used)
  }

  // From reactive attributes (attributes that depend on props/signals/memos)
  for (const attr of ctx.reactiveAttrs) {
    extractIdentifiers(attr.expression, used)
  }

  return used
}

/**
 * Extract identifiers from an expression string.
 */
function extractIdentifiers(expr: string, set: Set<string>): void {
  // Match word boundaries for identifiers
  const matches = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g)
  if (matches) {
    for (const id of matches) {
      // Skip keywords and common globals
      if (!isKeywordOrGlobal(id)) {
        set.add(id)
      }
    }
  }
}

/**
 * Extract identifiers from template literal expressions.
 * Finds ${...} patterns and extracts identifiers from inside.
 */
function extractTemplateIdentifiers(template: string, set: Set<string>): void {
  // Match template expressions like ${expr}
  const templatePattern = /\$\{([^}]+)\}/g
  let match
  while ((match = templatePattern.exec(template)) !== null) {
    extractIdentifiers(match[1], set)
  }
}

/**
 * Check if an identifier is a JavaScript keyword or common global.
 */
function isKeywordOrGlobal(id: string): boolean {
  const skip = new Set([
    'true',
    'false',
    'null',
    'undefined',
    'this',
    'const',
    'let',
    'var',
    'function',
    'return',
    'if',
    'else',
    'for',
    'while',
    'do',
    'switch',
    'case',
    'break',
    'continue',
    'new',
    'typeof',
    'instanceof',
    'void',
    'delete',
    'console',
    'window',
    'document',
    'Math',
    'String',
    'Number',
    'Array',
    'Object',
    'Boolean',
    'Date',
    'JSON',
    'Promise',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
  ])
  return skip.has(id)
}

/**
 * Expand a dynamic prop value for use in getter.
 * If the value is a simple identifier that matches a local constant,
 * expand the constant's value and replace prop references with props.xxx pattern.
 *
 * Example:
 *   Input: iconClasses (constant = `...${open ? 'rotate-180' : ''}`)
 *   where open is a prop with default = false
 *
 *   Output: `...${(props.open ?? false) ? 'rotate-180' : ''}`
 */
/**
 * Expand dynamic prop value by resolving local constants.
 *
 * Per spec/compiler.md, no prop reference transformation is needed:
 * - Destructured props are captured once at hydration, used as-is
 * - Props object already uses props.xxx syntax
 */
function expandDynamicPropValue(value: string, ctx: ClientJsContext): string {
  const trimmedValue = value.trim()

  // Check if value is a simple identifier that matches a local constant
  const constant = ctx.localConstants.find((c) => c.name === trimmedValue)
  if (constant) {
    // Expand the constant's value
    return constant.value
  }

  // Return value as-is (no transformation needed per spec)
  return value
}

/**
 * Check if a value references reactive data (props, signals, or memos).
 */
function valueReferencesReactiveData(
  value: string,
  ctx: ClientJsContext
): { usesProps: boolean; usedProps: string[]; usesSignals: boolean; usesMemos: boolean } {
  const usedProps: string[] = []
  let usesSignals = false
  let usesMemos = false

  // Check for props references
  for (const prop of ctx.propsParams) {
    const pattern = new RegExp(`\\b${prop.name}\\b`)
    if (pattern.test(value)) {
      usedProps.push(prop.name)
    }
  }

  // Check for signal getter calls
  for (const signal of ctx.signals) {
    const pattern = new RegExp(`\\b${signal.getter}\\s*\\(`)
    if (pattern.test(value)) {
      usesSignals = true
    }
  }

  // Check for memo calls
  for (const memo of ctx.memos) {
    const pattern = new RegExp(`\\b${memo.name}\\s*\\(`)
    if (pattern.test(value)) {
      usesMemos = true
    }
  }

  return {
    usesProps: usedProps.length > 0,
    usedProps,
    usesSignals,
    usesMemos,
  }
}

/**
 * Check if a signal is initialized from a prop value (controlled signal pattern).
 * Returns the prop name if the signal's initial value references a prop, null otherwise.
 *
 * Detects patterns like:
 *   const [controlledChecked, setControlledChecked] = createSignal(props.checked)
 *   const [controlledValue, setControlledValue] = createSignal(value)
 *
 * These signals need a createEffect to sync with parent's prop changes.
 *
 * Note: Props starting with "default" (e.g., defaultChecked, defaultValue) are
 * excluded as they are initial values, not controlled props.
 */
function getControlledPropName(
  signal: SignalInfo,
  propsParams: ParamInfo[]
): string | null {
  const initialValue = signal.initialValue.trim()

  // Helper to check if prop is a "default*" prop (initial value, not controlled)
  const isDefaultProp = (propName: string) => propName.startsWith('default')

  // Pattern 1: Direct props.X reference
  // e.g., props.checked
  const propsMatch = initialValue.match(/^props\.(\w+)$/)
  if (propsMatch) {
    const propName = propsMatch[1]
    // Verify it's actually a prop and not a default* prop
    if (propsParams.some((p) => p.name === propName) && !isDefaultProp(propName)) {
      return propName
    }
  }

  // Pattern 2: Simple prop name (will be a prop parameter)
  // e.g., checked in createSignal(checked)
  // Note: This only matches simple identifiers, not function calls
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(initialValue)) {
    if (propsParams.some((p) => p.name === initialValue) && !isDefaultProp(initialValue)) {
      return initialValue
    }
  }

  // Pattern 3: Prop with nullish coalescing
  // e.g., checked ?? false, value ?? ""
  const nullishMatch = initialValue.match(/^(\w+)\s*\?\?\s*.+$/)
  if (nullishMatch) {
    const propName = nullishMatch[1]
    if (propsParams.some((p) => p.name === propName) && !isDefaultProp(propName)) {
      return propName
    }
  }

  return null
}

/**
 * Detect props that are used with property access (e.g., highlightedCommands.pnpm).
 * These props need a default value of {} to avoid "cannot read properties of undefined".
 */
function detectPropsWithPropertyAccess(
  ctx: ClientJsContext,
  neededConstants: ConstantInfo[]
): Set<string> {
  const result = new Set<string>()

  // Collect all source code that might reference props with property access
  const sources: string[] = []

  // From conditional templates
  for (const elem of ctx.conditionalElements) {
    sources.push(elem.whenTrueHtml)
    sources.push(elem.whenFalseHtml)
    sources.push(elem.condition)
  }

  // From loop templates
  for (const elem of ctx.loopElements) {
    sources.push(elem.template)
  }

  // From dynamic expressions
  for (const elem of ctx.dynamicElements) {
    sources.push(elem.expression)
  }

  // From needed constants
  for (const constant of neededConstants) {
    sources.push(constant.value)
  }

  // Check each prop for property access pattern
  for (const prop of ctx.propsParams) {
    // Look for patterns like: propName.something or propName['something']
    const dotPattern = new RegExp(`\\b${prop.name}\\.[a-zA-Z_]`)
    const bracketPattern = new RegExp(`\\b${prop.name}\\s*\\[`)

    for (const source of sources) {
      if (dotPattern.test(source) || bracketPattern.test(source)) {
        result.add(prop.name)
        break
      }
    }
  }

  return result
}

// =============================================================================
// Init Function Generation
// =============================================================================

// All exports from @barefootjs/dom that may be used in generated code
const DOM_IMPORT_CANDIDATES = [
  'createSignal', 'createMemo', 'createEffect', 'onCleanup', 'onMount',
  'findScope', 'find', 'hydrate', 'cond', 'insert', 'reconcileList',
  'createComponent', 'registerComponent', 'registerTemplate', 'initChild', 'updateClientMarker',
  'createPortal'
] as const

const IMPORT_PLACEHOLDER = '/* __BAREFOOTJS_DOM_IMPORTS__ */'

/**
 * Detect which @barefootjs/dom functions are actually used in the generated code
 */
function detectUsedImports(code: string): Set<string> {
  const used = new Set<string>()
  for (const name of DOM_IMPORT_CANDIDATES) {
    // Match function calls: name(
    if (new RegExp(`\\b${name}\\s*\\(`).test(code)) {
      used.add(name)
    }
  }
  return used
}

/**
 * Collect user-defined imports from @barefootjs/dom (preserve PR #248 behavior)
 */
function collectUserDomImports(ir: ComponentIR): string[] {
  const userImports: string[] = []
  for (const imp of ir.metadata.imports) {
    if (imp.source === '@barefootjs/dom' && !imp.isTypeOnly) {
      for (const spec of imp.specifiers) {
        if (!spec.isDefault && !spec.isNamespace) {
          userImports.push(spec.alias ? `${spec.name} as ${spec.alias}` : spec.name)
        }
      }
    }
  }
  return userImports
}

function generateInitFunction(_ir: ComponentIR, ctx: ClientJsContext, siblingComponents?: string[]): string {
  const lines: string[] = []
  const name = ctx.componentName

  // Placeholder for imports - will be replaced with actual imports at the end
  lines.push(IMPORT_PLACEHOLDER)

  // Add child component imports for loops with createComponent and initChild calls
  // Skip siblings (components in the same file)
  const siblingSet = new Set(siblingComponents || [])
  const childComponentNames = new Set<string>()
  for (const loop of ctx.loopElements) {
    if (loop.childComponent) {
      childComponentNames.add(loop.childComponent.name)
    }
  }
  for (const child of ctx.childInits) {
    childComponentNames.add(child.name)
  }
  // Use placeholder format that will be resolved by build.ts
  for (const childName of childComponentNames) {
    if (!siblingSet.has(childName)) {
      lines.push(`import '/* @bf-child:${childName} */'`)
    }
  }

  lines.push('')

  // Init function
  lines.push(`export function init${name}(__instanceIndex, __parentScope, props = {}) {`)

  // Find scope
  lines.push(`  const __scope = findScope('${name}', __instanceIndex, __parentScope)`)
  lines.push(`  if (!__scope) return`)
  lines.push('')

  // =========================================================================
  // ANALYSIS PHASE: Collect all used identifiers and determine what's needed
  // =========================================================================
  const usedIdentifiers = collectUsedIdentifiers(ctx)
  const usedFunctions = collectUsedFunctions(ctx)

  // Add function names to used identifiers (they may reference props/constants)
  for (const fn of usedFunctions) {
    usedIdentifiers.add(fn)
  }

  // Determine which props are needed (directly or via constants)
  const neededProps = new Set<string>()
  const neededConstants: ConstantInfo[] = []
  const outputConstants = new Set<string>()

  // Check all local constants - include ANY constant that is used in client-side code
  for (const constant of ctx.localConstants) {
    // Include constant if it's used (regardless of whether it depends on reactive data)
    if (usedIdentifiers.has(constant.name)) {
      // Skip arrow functions - they're handled separately as event handlers
      // Skip constants named 'props' - the function parameter already provides props
      if (!constant.value.trim().includes('=>') && constant.name !== 'props') {
        neededConstants.push(constant)
        outputConstants.add(constant.name)

        // Check if this constant depends on props
        const refs = valueReferencesReactiveData(constant.value, ctx)
        for (const propName of refs.usedProps) {
          neededProps.add(propName)
        }
      }
    }
  }

  // Also check if any identifier is directly a prop
  for (const id of usedIdentifiers) {
    const isProp = ctx.propsParams.some((p) => p.name === id)
    if (isProp) {
      neededProps.add(id)
    }
  }


  // Detect props that are used with property access (e.g., highlightedCommands.pnpm)
  // These need a default value of {} to avoid "cannot read properties of undefined"
  const propsWithPropertyAccess = detectPropsWithPropertyAccess(ctx, neededConstants)

  // Detect props that are used as loop arrays - these need [] as default, not {}
  const propsUsedAsLoopArrays = new Set<string>()
  for (const loop of ctx.loopElements) {
    // Check if the loop array is a simple prop reference
    const arrayName = loop.array.trim()
    if (ctx.propsParams.some((p) => p.name === arrayName)) {
      propsUsedAsLoopArrays.add(arrayName)
    }
  }

  // =========================================================================
  // OUTPUT PHASE: Generate code in correct order
  // Order: 1. Props -> 2. Constants -> 3. Signals -> 4. Memos
  // =========================================================================

  // 1. Generate props extractions (needed before constants that depend on them)
  // Skip this step for SolidJS-style props object pattern - source code uses props.xxx directly
  if (neededProps.size > 0 && !ctx.propsObjectName) {
    for (const propName of neededProps) {
      const prop = ctx.propsParams.find((p) => p.name === propName)
      const defaultVal = prop?.defaultValue
      if (defaultVal) {
        lines.push(`  const ${propName} = props.${propName} ?? ${defaultVal}`)
      } else if (propsUsedAsLoopArrays.has(propName)) {
        // Prop is used as loop array - provide [] as default
        lines.push(`  const ${propName} = props.${propName} ?? []`)
      } else if (propsWithPropertyAccess.has(propName)) {
        // Prop is used with property access - provide {} as default
        lines.push(`  const ${propName} = props.${propName} ?? {}`)
      } else if (prop?.optional && prop?.type) {
        // Provide sensible defaults for optional props without explicit defaults
        const inferredDefault = inferDefaultValue(prop.type)
        if (inferredDefault !== 'undefined') {
          lines.push(`  const ${propName} = props.${propName} ?? ${inferredDefault}`)
        } else {
          lines.push(`  const ${propName} = props.${propName}`)
        }
      } else {
        lines.push(`  const ${propName} = props.${propName}`)
      }
    }
    lines.push('')
  }

  // Collect signal/memo names to detect dependencies
  const signalNames = new Set(ctx.signals.map(s => s.getter))
  const memoNames = new Set(ctx.memos.map(m => m.name))

  // Split constants into early (no signal/memo deps) and late (has signal/memo deps)
  const earlyConstants: ConstantInfo[] = []
  const lateConstants: ConstantInfo[] = []
  for (const constant of neededConstants) {
    const value = constant.value
    // Check if constant references any signal getter or memo name
    let dependsOnReactive = false
    for (const sigName of signalNames) {
      // Match signal getter call like isChecked() or signal variable like count
      if (new RegExp(`\\b${sigName}\\b`).test(value)) {
        dependsOnReactive = true
        break
      }
    }
    if (!dependsOnReactive) {
      for (const memoName of memoNames) {
        if (new RegExp(`\\b${memoName}\\b`).test(value)) {
          dependsOnReactive = true
          break
        }
      }
    }
    if (dependsOnReactive) {
      lateConstants.push(constant)
    } else {
      earlyConstants.push(constant)
    }
  }

  // 2. Generate early constants (no signal/memo dependencies)
  for (const constant of earlyConstants) {
    const jsValue = stripTypeScriptSyntax(constant.value)
    lines.push(`  const ${constant.name} = ${jsValue}`)
  }
  if (earlyConstants.length > 0) {
    lines.push('')
  }

  // 3. Signal declarations (after constants they may depend on)
  // Track controlled signals for effect generation
  const controlledSignals: Array<{ signal: SignalInfo; propName: string }> = []

  for (const signal of ctx.signals) {
    // Check if this signal is initialized from a prop (controlled component pattern)
    const controlledPropName = getControlledPropName(signal, ctx.propsParams)
    if (controlledPropName) {
      controlledSignals.push({ signal, propName: controlledPropName })
    }

    // Determine initial value for the signal
    let initialValue: string
    if (signal.initialValue.startsWith('props.')) {
      // Already prefixed with props.
      initialValue = `${signal.initialValue} ?? ${inferDefaultValue(signal.type)}`
    } else if (controlledPropName) {
      // Signal is initialized from a prop - use props.propName accessor
      const prop = ctx.propsParams.find(p => p.name === controlledPropName)
      const defaultVal = prop?.defaultValue ?? inferDefaultValue(signal.type)
      initialValue = `props.${controlledPropName} ?? ${defaultVal}`
    } else {
      // Not a prop reference - use literal initial value
      initialValue = signal.initialValue
    }

    lines.push(`  const [${signal.getter}, ${signal.setter}] = createSignal(${initialValue})`)
  }

  // Generate sync effects for controlled signals
  // This ensures parent prop changes are reflected in the internal signal
  for (const { signal, propName } of controlledSignals) {
    const prop = ctx.propsParams.find(p => p.name === propName)
    const accessor = prop?.defaultValue
      ? `(props.${propName} ?? ${prop.defaultValue})`
      : `props.${propName}`
    lines.push(`  // AUTO-GENERATED: Sync controlled prop '${propName}' to internal signal`)
    lines.push(`  createEffect(() => {`)
    lines.push(`    const __val = ${accessor}`)
    lines.push(`    if (__val !== undefined) ${signal.setter}(__val)`)
    lines.push(`  })`)
  }

  // 4. Memo declarations
  for (const memo of ctx.memos) {
    const jsComputation = stripTypeScriptSyntax(memo.computation)
    lines.push(`  const ${memo.name} = createMemo(${jsComputation})`)
  }

  // 5. Generate late constants (depend on signals/memos)
  for (const constant of lateConstants) {
    const jsValue = stripTypeScriptSyntax(constant.value)
    lines.push(`  const ${constant.name} = ${jsValue}`)
  }

  if (ctx.signals.length > 0 || ctx.memos.length > 0 || lateConstants.length > 0) {
    lines.push('')
  }

  // Local functions used as event handlers or called within expressions
  // Use usedIdentifiers (not usedFunctions) to catch functions called inside arrow expressions
  // e.g., onClick={() => handleAdd(input.value)} should include handleAdd
  for (const fn of ctx.localFunctions) {
    if (usedIdentifiers.has(fn.name)) {
      // Output the function definition
      // Reconstruct function from params and body
      const paramStr = fn.params.map((p) => p.name).join(', ')
      const jsBody = stripTypeScriptSyntax(fn.body)
      lines.push(`  const ${fn.name} = (${paramStr}) => ${jsBody}`)
      lines.push('')
    }
  }
  // Arrow function constants used as handlers (e.g., const handleKeyDown = (e) => {...})
  for (const constant of ctx.localConstants) {
    // Skip if already output as needed constant
    if (outputConstants.has(constant.name)) continue
    // Use usedIdentifiers to catch functions called inside expressions
    if (usedIdentifiers.has(constant.name)) {
      const value = constant.value.trim()
      // Only output if it's an arrow function
      if (value.includes('=>')) {
        // Strip TypeScript syntax from the value
        const jsValue = stripTypeScriptSyntax(value)
        lines.push(`  const ${constant.name} = ${jsValue}`)
        lines.push('')
      }
    }
  }

  // Props-based event handlers (e.g., onClick from props)
  const localNames = new Set([
    ...ctx.localFunctions.map((f) => f.name),
    ...ctx.localConstants.map((c) => c.name),
  ])
  let addedPropsHandler = false
  for (const handlerName of usedFunctions) {
    // Skip if already defined locally or already extracted as needed prop
    if (localNames.has(handlerName)) continue
    if (neededProps.has(handlerName)) continue

    // Check if it's a prop
    const isProp = ctx.propsParams.some((p) => p.name === handlerName)
    if (isProp) {
      lines.push(`  const ${handlerName} = props.${handlerName}`)
      addedPropsHandler = true
    }
  }
  if (addedPropsHandler) {
    lines.push('')
  }

  // Element references
  const elementRefs = generateElementRefs(ctx)
  if (elementRefs) {
    lines.push(elementRefs)
    lines.push('')
  }

  // Dynamic text updates
  for (const elem of ctx.dynamicElements) {
    const expr = elem.expression
    if (elem.insideConditional) {
      // For elements inside conditionals, find() dynamically since DOM may be swapped
      lines.push(`  createEffect(() => {`)
      lines.push(`    const __el = find(__scope, '[data-bf="${elem.slotId}"]')`)
      lines.push(`    const __val = ${expr}`)
      lines.push(`    if (__el) __el.textContent = String(__val)`)
      lines.push(`  })`)
    } else {
      lines.push(`  createEffect(() => {`)
      lines.push(`    const __val = ${expr}`)
      lines.push(`    if (_${elem.slotId}) _${elem.slotId}.textContent = String(__val)`)
      lines.push(`  })`)
    }
    lines.push('')
  }

  // Client-only expression updates (comment marker based)
  // These expressions are evaluated only on the client side via updateClientMarker()
  for (const elem of ctx.clientOnlyElements) {
    lines.push(`  // @client: ${elem.slotId}`)
    lines.push(`  createEffect(() => {`)
    lines.push(`    updateClientMarker(__scope, '${elem.slotId}', ${elem.expression})`)
    lines.push(`  })`)
    lines.push('')
  }

  // Reactive attribute updates
  if (ctx.reactiveAttrs.length > 0) {
    // Group by slot to update multiple attrs together
    const attrsBySlot = new Map<string, typeof ctx.reactiveAttrs>()
    for (const attr of ctx.reactiveAttrs) {
      if (!attrsBySlot.has(attr.slotId)) {
        attrsBySlot.set(attr.slotId, [])
      }
      attrsBySlot.get(attr.slotId)!.push(attr)
    }

    for (const [slotId, attrs] of attrsBySlot) {
      lines.push(`  createEffect(() => {`)
      lines.push(`    if (_${slotId}) {`)
      for (const attr of attrs) {
        const htmlAttrName = toHtmlAttrName(attr.attrName)
        if (htmlAttrName === 'value') {
          // Use DOM property for 'value' (setAttribute doesn't update after user input)
          lines.push(`      const __val = String(${attr.expression})`)
          lines.push(`      if (_${slotId}.value !== __val) _${slotId}.value = __val`)
        } else if (isBooleanAttr(htmlAttrName)) {
          // Boolean attributes: set property directly (checked, disabled, etc.)
          lines.push(`      _${slotId}.${htmlAttrName} = !!(${attr.expression})`)
        } else {
          lines.push(`      _${slotId}.setAttribute('${htmlAttrName}', String(${attr.expression}))`)
        }
      }
      lines.push(`    }`)
      lines.push(`  })`)
      lines.push('')
    }
  }

  // Conditional updates using insert() with branch configs
  for (const elem of ctx.conditionalElements) {
    // Add data-bf-cond to template root elements so insert() can find them after DOM swap
    const whenTrueWithCond = addCondAttrToTemplate(elem.whenTrueHtml, elem.slotId)
    const whenFalseWithCond = addCondAttrToTemplate(elem.whenFalseHtml, elem.slotId)
    const condition = elem.condition

    // Helper to generate bindEvents function body for a branch
    const generateBindEvents = (events: ConditionalBranchEvent[], refs: ConditionalBranchRef[]) => {
      // Collect all slot IDs that need element references
      const allSlotIds = new Set<string>()
      for (const event of events) allSlotIds.add(event.slotId)
      for (const ref of refs) allSlotIds.add(ref.slotId)

      // Group events by slotId
      const eventsBySlot = new Map<string, ConditionalBranchEvent[]>()
      for (const event of events) {
        if (!eventsBySlot.has(event.slotId)) {
          eventsBySlot.set(event.slotId, [])
        }
        eventsBySlot.get(event.slotId)!.push(event)
      }

      // Generate element references for all slots
      for (const slotId of allSlotIds) {
        lines.push(`      const _${slotId} = find(__branchScope, '[data-bf="${slotId}"]')`)
      }

      // Generate event handlers
      for (const [slotId, slotEvents] of eventsBySlot) {
        for (const event of slotEvents) {
          // Wrap handler in block to prevent accidental return false (which prevents default)
          const wrappedHandler = wrapHandlerInBlock(event.handler)
          lines.push(`      if (_${slotId}) _${slotId}.${toDomEventProp(event.eventName)} = ${wrappedHandler}`)
        }
      }

      // Generate ref callbacks
      for (const ref of refs) {
        lines.push(`      if (_${ref.slotId}) (${ref.callback})(_${ref.slotId})`)
      }
    }

    // Generate whenTrue branch config
    lines.push(`  insert(__scope, '${elem.slotId}', () => ${condition}, {`)
    lines.push(`    template: () => \`${whenTrueWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    generateBindEvents(elem.whenTrueEvents, elem.whenTrueRefs)
    lines.push(`    }`)
    lines.push(`  }, {`)

    // Generate whenFalse branch config
    lines.push(`    template: () => \`${whenFalseWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    generateBindEvents(elem.whenFalseEvents, elem.whenFalseRefs)
    lines.push(`    }`)
    lines.push(`  })`)
    lines.push('')
  }

  // Client-only conditional updates (comment marker based)
  // These conditionals are not rendered by the server, only evaluated on client via insert()
  for (const elem of ctx.clientOnlyConditionals) {
    // Add data-bf-cond to template root elements so insert() can find them after DOM swap
    const whenTrueWithCond = addCondAttrToTemplate(elem.whenTrueHtml, elem.slotId)
    const whenFalseWithCond = addCondAttrToTemplate(elem.whenFalseHtml, elem.slotId)

    // Helper to generate bindEvents function body for a branch
    const generateBindEvents = (events: ConditionalBranchEvent[], refs: ConditionalBranchRef[]) => {
      // Collect all slot IDs that need element references
      const allSlotIds = new Set<string>()
      for (const event of events) allSlotIds.add(event.slotId)
      for (const ref of refs) allSlotIds.add(ref.slotId)

      // Group events by slotId
      const eventsBySlot = new Map<string, ConditionalBranchEvent[]>()
      for (const event of events) {
        if (!eventsBySlot.has(event.slotId)) {
          eventsBySlot.set(event.slotId, [])
        }
        eventsBySlot.get(event.slotId)!.push(event)
      }

      // Generate element references for all slots
      for (const slotId of allSlotIds) {
        lines.push(`      const _${slotId} = find(__branchScope, '[data-bf="${slotId}"]')`)
      }

      // Generate event handlers
      for (const [slotId, slotEvents] of eventsBySlot) {
        for (const event of slotEvents) {
          // Wrap handler in block to prevent accidental return false (which prevents default)
          const wrappedHandler = wrapHandlerInBlock(event.handler)
          lines.push(`      if (_${slotId}) _${slotId}.on${event.eventName} = ${wrappedHandler}`)
        }
      }

      // Generate ref callbacks
      for (const ref of refs) {
        lines.push(`      if (_${ref.slotId}) (${ref.callback})(_${ref.slotId})`)
      }
    }

    lines.push(`  // @client conditional: ${elem.slotId}`)
    lines.push(`  insert(__scope, '${elem.slotId}', () => ${elem.condition}, {`)
    lines.push(`    template: () => \`${whenTrueWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    generateBindEvents(elem.whenTrueEvents, elem.whenTrueRefs)
    lines.push(`    }`)
    lines.push(`  }, {`)
    lines.push(`    template: () => \`${whenFalseWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    generateBindEvents(elem.whenFalseEvents, elem.whenFalseRefs)
    lines.push(`    }`)
    lines.push(`  })`)
    lines.push('')
  }

  // Loop updates
  for (const elem of ctx.loopElements) {
    // Static prop arrays don't need reconcileList - SSR elements are hydrated directly
    // Dynamic signal arrays need reconcileList to update DOM when signal changes
    if (elem.isStaticArray) {
      // Static prop array - SSR elements are already rendered
      // Need to initialize child components since hydrate() skips nested instances
      if (elem.childComponent) {
        const { name } = elem.childComponent
        lines.push(`  // Initialize static array children (hydrate skips nested instances)`)
        lines.push(`  if (_${elem.slotId}) {`)
        lines.push(`    const __childScopes = _${elem.slotId}.querySelectorAll('[data-bf-scope^="${name}_"]:not([data-bf-init])')`)
        // Use index-based matching since SSR renders elements in array order
        lines.push(`    __childScopes.forEach((childScope, __idx) => {`)
        lines.push(`      const __childProps = ${elem.array}[__idx] || {}`)
        lines.push(`      initChild('${name}', childScope, __childProps)`)
        lines.push(`    })`)
        lines.push(`  }`)
        lines.push('')
      }

      // Initialize nested components (wrapped in elements like <div><Checkbox /></div>)
      if (elem.nestedComponents && elem.nestedComponents.length > 0) {
        for (const comp of elem.nestedComponents) {
          const propsEntries = comp.props.map((p) => {
            if (p.isEventHandler) {
              return `${p.name}: ${p.value}`
            } else if (p.isLiteral) {
              return `${p.name}: ${JSON.stringify(p.value)}`
            } else {
              return `get ${p.name}() { return ${p.value} }`
            }
          })
          const propsExpr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : '{}'

          // Use slotId-based selector to match actual scope (e.g., "ParentName_xxx_slot_N")
          const selector = comp.slotId
            ? `[data-bf-scope$="_${comp.slotId}"]:not([data-bf-init])`
            : `[data-bf-scope^="${comp.name}_"]:not([data-bf-init])`

          lines.push(`  // Initialize nested ${comp.name} in static array`)
          lines.push(`  if (_${elem.slotId}) {`)
          lines.push(`    ${elem.array}.forEach((${elem.param}, __idx) => {`)
          lines.push(`      const __iterEl = _${elem.slotId}.children[__idx]`)
          lines.push(`      if (__iterEl) {`)
          lines.push(`        const __compEl = __iterEl.querySelector('${selector}')`)
          lines.push(`        if (__compEl) initChild('${comp.name}', __compEl, ${propsExpr})`)
          lines.push(`      }`)
          lines.push(`    })`)
          lines.push(`  }`)
          lines.push('')
        }
      }

      continue
    }

    const keyFn = elem.key ? `(${elem.param}) => String(${elem.key})` : 'null'

    if (elem.childComponent) {
      // createComponent-based rendering for loop with component children
      const { name, props } = elem.childComponent
      const propsEntries = props.map((p) => {
        if (p.isEventHandler) {
          // Event handlers passed directly
          return `${p.name}: ${p.value}`
        } else if (p.isLiteral) {
          // String literal from JSX attribute - return quoted value
          return `get ${p.name}() { return ${JSON.stringify(p.value)} }`
        } else {
          // Variable/expression props wrapped in getters for reactivity
          return `get ${p.name}() { return ${p.value} }`
        }
      })
      const propsExpr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : '{}'
      const keyExpr = elem.key || '__idx'
      const indexParam = elem.index || '__idx'

      // Apply filter predicate if present
      const filterExpr = elem.filterPredicate
        ? `${elem.array}.filter(${elem.filterPredicate.param} => ${elem.filterPredicate.raw})`
        : elem.array

      lines.push(`  createEffect(() => {`)
      lines.push(`    reconcileList(_${elem.slotId}, ${filterExpr}, ${keyFn}, (${elem.param}, ${indexParam}) =>`)
      lines.push(`      createComponent('${name}', ${propsExpr}, ${keyExpr})`)
      lines.push(`    )`)
      lines.push(`  })`)
    } else {
      // Template string-based rendering (original implementation)
      // Apply filter predicate if present
      const filterExprTemplate = elem.filterPredicate
        ? `${elem.array}.filter(${elem.filterPredicate.param} => ${elem.filterPredicate.raw})`
        : elem.array

      const indexParamTemplate = elem.index || '__idx'
      lines.push(`  createEffect(() => {`)
      lines.push(`    const __arr = ${filterExprTemplate}`)
      lines.push(`    reconcileList(_${elem.slotId}, __arr, ${keyFn}, (${elem.param}, ${indexParamTemplate}) => \`${elem.template}\`)`)
      lines.push(`  })`)
    }
    lines.push('')

    // Event delegation for loop child events (only for template string mode)
    if (!elem.childComponent && elem.childEvents.length > 0) {
      // Group events by event name
      const eventsByName = new Map<string, typeof elem.childEvents>()
      for (const ev of elem.childEvents) {
        if (!eventsByName.has(ev.eventName)) {
          eventsByName.set(ev.eventName, [])
        }
        eventsByName.get(ev.eventName)!.push(ev)
      }

      for (const [eventName, events] of eventsByName) {
        lines.push(`  if (_${elem.slotId}) _${elem.slotId}.${toDomEventProp(eventName)} = (e) => {`)
        lines.push(`    const target = e.target`)
        for (const ev of events) {
          lines.push(`    const ${ev.childSlotId}El = target.closest('[data-bf="${ev.childSlotId}"]')`)
          lines.push(`    if (${ev.childSlotId}El) {`)
          // Find the list item and extract key
          // The handler may be an arrow function - need to call it
          const handlerCall = ev.handler.trim().startsWith('(') || ev.handler.trim().startsWith('function')
            ? `(${ev.handler})()`
            : ev.handler
          if (elem.key) {
            // Replace param name with 'item' in the key expression for the find callback
            const keyWithItem = elem.key.replace(new RegExp(`\\b${elem.param}\\b`, 'g'), 'item')
            lines.push(`      const li = ${ev.childSlotId}El.closest('[key]')`)
            lines.push(`      if (li) {`)
            lines.push(`        const key = li.getAttribute('key')`)
            lines.push(`        const ${elem.param} = ${elem.array}.find(item => String(${keyWithItem}) === key)`)
            lines.push(`        if (${elem.param}) ${handlerCall}`)
            lines.push(`      }`)
          } else {
            // Without a key, use index from direct children
            lines.push(`      const li = ${ev.childSlotId}El.closest('li, [data-bf-item]')`)
            lines.push(`      if (li && li.parentElement) {`)
            lines.push(`        const idx = Array.from(li.parentElement.children).indexOf(li)`)
            lines.push(`        const ${elem.param} = ${elem.array}[idx]`)
            lines.push(`        if (${elem.param}) ${handlerCall}`)
            lines.push(`      }`)
          }
          lines.push(`      return`)
          lines.push(`    }`)
        }
        lines.push(`  }`)
        lines.push('')
      }
    }
  }

  // Collect slot IDs that are inside conditionals (handled by insert())
  const conditionalSlotIds = new Set<string>()
  for (const cond of ctx.conditionalElements) {
    for (const event of cond.whenTrueEvents) {
      conditionalSlotIds.add(event.slotId)
    }
    for (const event of cond.whenFalseEvents) {
      conditionalSlotIds.add(event.slotId)
    }
    for (const ref of cond.whenTrueRefs) {
      conditionalSlotIds.add(ref.slotId)
    }
    for (const ref of cond.whenFalseRefs) {
      conditionalSlotIds.add(ref.slotId)
    }
  }

  // Event handlers - skip those inside conditionals (handled by insert())
  for (const elem of ctx.interactiveElements) {
    // Skip events that are inside conditionals
    if (conditionalSlotIds.has(elem.slotId)) continue

    for (const event of elem.events) {
      const eventProp = toDomEventProp(event.name)
      // Wrap handler in block to prevent accidental return false (which prevents default)
      const wrappedHandler = wrapHandlerInBlock(event.handler)
      if (elem.slotId === '__scope') {
        // Attach to scope element directly (for events on component root)
        lines.push(`  if (__scope) __scope.${eventProp} = ${wrappedHandler}`)
      } else {
        lines.push(`  if (_${elem.slotId}) _${elem.slotId}.${eventProp} = ${wrappedHandler}`)
      }
    }
  }

  // Reactive prop bindings
  // Update element attributes when reactive values change
  if (ctx.reactiveProps.length > 0) {
    lines.push('')
    lines.push(`  // Reactive prop bindings`)
    lines.push(`  createEffect(() => {`)

    // Group by slot to update multiple props together
    const propsBySlot = new Map<string, typeof ctx.reactiveProps>()
    for (const prop of ctx.reactiveProps) {
      if (!propsBySlot.has(prop.slotId)) {
        propsBySlot.set(prop.slotId, [])
      }
      propsBySlot.get(prop.slotId)!.push(prop)
    }

    for (const [slotId, props] of propsBySlot) {
      lines.push(`    if (_${slotId}) {`)
      for (const prop of props) {
        const value = `${prop.expression}()`
        // Handle special prop mappings for common UI components
        if (prop.propName === 'selected') {
          // Different handling based on component type
          if (prop.componentName === 'TabsContent') {
            // For TabsContent, toggle the hidden class
            lines.push(`      _${slotId}.setAttribute('data-state', ${value} ? 'active' : 'inactive')`)
            lines.push(`      if (${value}) {`)
            lines.push(`        _${slotId}.classList.remove('hidden')`)
            lines.push(`      } else {`)
            lines.push(`        _${slotId}.classList.add('hidden')`)
            lines.push(`      }`)
          } else {
            // For TabsTrigger-like components, update aria-selected and data-state
            lines.push(`      _${slotId}.setAttribute('aria-selected', String(${value}))`)
            lines.push(`      _${slotId}.setAttribute('data-state', ${value} ? 'active' : 'inactive')`)
            // Update classes for visual feedback
            lines.push(`      if (${value}) {`)
            lines.push(`        _${slotId}.classList.remove('text-muted-foreground', 'hover:text-foreground', 'hover:bg-background/50')`)
            lines.push(`        _${slotId}.classList.add('bg-background', 'text-foreground', 'shadow-sm')`)
            lines.push(`      } else {`)
            lines.push(`        _${slotId}.classList.add('text-muted-foreground', 'hover:text-foreground', 'hover:bg-background/50')`)
            lines.push(`        _${slotId}.classList.remove('bg-background', 'text-foreground', 'shadow-sm')`)
            lines.push(`      }`)
          }
        } else {
          // Generic prop binding
          lines.push(`      _${slotId}.setAttribute('${prop.propName}', String(${value}))`)
        }
      }
      lines.push(`    }`)
    }

    lines.push(`  })`)
  }

  // Reactive child component props
  // Update child component's DOM attributes when parent's props change
  if (ctx.reactiveChildProps.length > 0) {
    lines.push('')
    lines.push(`  // Reactive child component props`)
    lines.push(`  createEffect(() => {`)

    // Group by component to update multiple props together
    const propsByComponent = new Map<string, typeof ctx.reactiveChildProps>()
    for (const prop of ctx.reactiveChildProps) {
      const key = `${prop.componentName}_${prop.slotId ?? '__scope'}`
      if (!propsByComponent.has(key)) {
        propsByComponent.set(key, [])
      }
      propsByComponent.get(key)!.push(prop)
    }

    for (const [, props] of propsByComponent) {
      const first = props[0]
      // Use slotId for unique variable name to avoid collisions when same component appears multiple times
      const varSuffix = first.slotId ? first.slotId.replace(/-/g, '_') : first.componentName
      const varName = `__${first.componentName}_${varSuffix}El`
      // Find the child component's root element using data-bf-scope
      // The child component's data-bf-scope ends with the slot ID (e.g., "_slot_2")
      const selectorBase = first.slotId
        ? `find(__scope, '[data-bf-scope$="_${first.slotId}"]')`
        : `find(__scope, '[data-bf-scope^="${first.componentName}_"]')`
      lines.push(`    const ${varName} = ${selectorBase}`)
      lines.push(`    if (${varName}) {`)
      for (const prop of props) {
        if (prop.attrName === 'class') {
          // Use setAttribute for class to support both HTML and SVG elements
          lines.push(`      ${varName}.setAttribute('class', ${prop.expression})`)
        } else {
          lines.push(`      ${varName}.setAttribute('${prop.attrName}', ${prop.expression})`)
        }
      }
      lines.push(`    }`)
    }

    lines.push(`  })`)
  }

  // Ref callbacks - skip those inside conditionals (handled by insert())
  for (const elem of ctx.refElements) {
    if (conditionalSlotIds.has(elem.slotId)) continue
    lines.push(`  if (_${elem.slotId}) (${elem.callback})(_${elem.slotId})`)
  }

  // User-defined effects
  for (const effect of ctx.effects) {
    const jsBody = stripTypeScriptSyntax(effect.body)
    lines.push(`  createEffect(${jsBody})`)
  }

  // onMount calls
  for (const onMount of ctx.onMounts) {
    const jsBody = stripTypeScriptSyntax(onMount.body)
    lines.push(`  onMount(${jsBody})`)
  }

  // Child component inits with props
  if (ctx.childInits.length > 0) {
    lines.push('')
    lines.push(`  // Initialize child components with props`)
    for (const child of ctx.childInits) {
      const slotVar = child.slotId ? `_${child.slotId}` : '__scope'
      lines.push(`  initChild('${child.name}', ${slotVar}, ${child.propsExpr})`)
    }
  }

  lines.push(`}`)
  lines.push('')

  // Register component for parent initialization
  lines.push(`// Register for parent initialization`)
  lines.push(`registerComponent('${name}', init${name})`)
  lines.push('')

  // Register template for client-side component creation (via createComponent)
  // Only generate templates for components that:
  // - Don't have loops (which reference signal arrays)
  // - Don't have child components (which can't be represented in static templates)
  // - Don't have signal calls in expressions
  const propNamesForTemplate = new Set(ctx.propsParams.map((p) => p.name))
  if (canGenerateStaticTemplate(_ir.root, propNamesForTemplate)) {
    const templateHtml = irToComponentTemplate(_ir.root, propNamesForTemplate)
    if (templateHtml) {
      lines.push(`// Register template for client-side creation`)
      lines.push(`registerTemplate('${name}', (props) => \`${templateHtml}\`)`)
      lines.push('')
    }
  }

  // Auto-hydrate on script load
  lines.push(`// Auto-hydrate component instances on page load`)
  lines.push(`hydrate('${name}', (props, idx, scope) => init${name}(idx, scope, props))`)

  // Generate code and detect used imports
  const generatedCode = lines.join('\n')
  const usedImports = detectUsedImports(generatedCode)

  // Add user-defined imports (preserve PR #248 behavior)
  for (const userImport of collectUserDomImports(_ir)) {
    usedImports.add(userImport)
  }

  // Replace placeholder with actual imports
  const sortedImports = [...usedImports].sort()
  const importLine = `import { ${sortedImports.join(', ')} } from '@barefootjs/dom'`

  return generatedCode.replace(IMPORT_PLACEHOLDER, importLine)
}

function generateElementRefs(ctx: ClientJsContext): string {
  const regularSlots = new Set<string>()
  const componentSlots = new Set<string>()

  // Collect slot IDs that are inside conditionals (handled by insert()'s bindEvents)
  const conditionalSlotIds = new Set<string>()
  for (const cond of ctx.conditionalElements) {
    for (const event of cond.whenTrueEvents) {
      conditionalSlotIds.add(event.slotId)
    }
    for (const event of cond.whenFalseEvents) {
      conditionalSlotIds.add(event.slotId)
    }
    for (const ref of cond.whenTrueRefs) {
      conditionalSlotIds.add(ref.slotId)
    }
    for (const ref of cond.whenFalseRefs) {
      conditionalSlotIds.add(ref.slotId)
    }
  }

  for (const elem of ctx.interactiveElements) {
    // Skip __scope as it's already available
    // Skip slots inside conditionals (handled by insert())
    if (elem.slotId !== '__scope' && !conditionalSlotIds.has(elem.slotId)) {
      if (elem.isComponentSlot) {
        componentSlots.add(elem.slotId)
      } else {
        regularSlots.add(elem.slotId)
      }
    }
  }
  for (const elem of ctx.dynamicElements) {
    // Skip elements inside conditionals - they use dynamic find() inside effects
    if (!elem.insideConditional) {
      regularSlots.add(elem.slotId)
    }
  }
  for (const elem of ctx.conditionalElements) {
    regularSlots.add(elem.slotId)
  }
  for (const elem of ctx.loopElements) {
    regularSlots.add(elem.slotId)
  }
  for (const elem of ctx.refElements) {
    // Skip refs inside conditionals (handled by insert())
    if (!conditionalSlotIds.has(elem.slotId)) {
      regularSlots.add(elem.slotId)
    }
  }
  for (const attr of ctx.reactiveAttrs) {
    regularSlots.add(attr.slotId)
  }

  // Reactive props also need component slot refs
  for (const prop of ctx.reactiveProps) {
    componentSlots.add(prop.slotId)
  }

  // Child component slots need refs for initChild()
  for (const child of ctx.childInits) {
    if (child.slotId) {
      componentSlots.add(child.slotId)
    }
  }

  if (regularSlots.size === 0 && componentSlots.size === 0) return ''

  const lines: string[] = []

  // Regular element slots use data-bf
  // Use find() to also search sibling scopes (for fragment roots)
  for (const slotId of regularSlots) {
    lines.push(`  const _${slotId} = find(__scope, '[data-bf="${slotId}"]')`)
  }

  // Component slots use data-bf-scope with parent's scope prefix
  // The component's rendered element has data-bf-scope="${parentScope}_${slotId}"
  // Use find() instead of querySelector() because the scope element itself might be the target
  // (e.g., when a component returns a child component directly without a wrapper)
  for (const slotId of componentSlots) {
    lines.push(`  const _${slotId} = find(__scope, '[data-bf-scope$="_${slotId}"]')`)
  }

  return lines.join('\n')
}

function inferDefaultValue(type: { kind: string; primitive?: string }): string {
  if (type.kind === 'primitive') {
    switch (type.primitive) {
      case 'number':
        return '0'
      case 'boolean':
        return 'false'
      case 'string':
        return "''"
    }
  }
  if (type.kind === 'array') return '[]'
  if (type.kind === 'object') return '{}'
  return 'undefined'
}

/**
 * Strip TypeScript-specific syntax from a code string.
 * Converts TypeScript to JavaScript by removing:
 * - Type annotations on parameters: (e: KeyboardEvent) => (e)
 * - Type assertions: e.target as HTMLElement => e.target
 * - Variable type annotations: let x: number = 1 => let x = 1
 * - Return type annotations: (x): void => x  =>  (x) => x
 * - Type predicates: (el): el is HTMLElement => ...  =>  (el) => ...
 * - Generic type parameters: new Set<string>()  =>  new Set()
 * - Non-null assertions: x! => x
 */
function stripTypeScriptSyntax(code: string): string {
  // Remove non-null assertions: x! => x (but not !== or !=)
  // Match: identifier followed by ! not followed by =
  let result = code.replace(/(\w)!(?!=)/g, '$1')

  // Remove type assertions: "as TypeName" (including generic types like "as HTMLElement[]")
  // Match: space + 'as' + space + identifier (with optional [], <>, etc.)
  result = result.replace(/\s+as\s+[A-Za-z_][A-Za-z0-9_]*(?:<[^>]*>)?(?:\[\])?/g, '')

  // Remove parameter type annotations: (param: Type) => (param)
  // This handles: (e: KeyboardEvent), (x: number, y: string), etc.
  // Important: Only match if the "type" looks like a TypeScript type (uppercase initial or type keyword)
  // This prevents matching object properties like `bubbles: true`
  result = result.replace(
    /([(,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*((?:[A-Z][A-Za-z0-9_]*|number|string|boolean|void|null|undefined|any|unknown|never)(?:<[^>]*>)?(?:\[\])?)(?=\s*[,)])/g,
    '$1$2'
  )

  // Remove return type annotations on arrow functions: (x): void => body
  // Also handles type predicates: (el): el is HTMLElement =>
  result = result.replace(/\)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]\s|&]*(?:\s+is\s+[A-Za-z_][A-Za-z0-9_<>\[\]\s|&]*)?\s*=>/g, ') =>')

  // Remove generic type parameters: new Set<string>(), Map<K, V>(), etc.
  result = result.replace(/<[A-Za-z_][A-Za-z0-9_,\s<>]*>\s*\(/g, '(')

  // Remove variable type annotations: let/const x: Type = value => let/const x = value
  // Use non-greedy match and avoid spanning newlines
  result = result.replace(/(let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^\n=]+=(?!=)/g, '$1 $2 =')

  // Remove multi-variable type annotations: let x: number, y: number => let x, y
  // This handles: let x: Type, y: Type, ... where there's no initializer
  result = result.replace(/(let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|&\s]*,/g, '$1 $2,')
  result = result.replace(/,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[A-Za-z_][A-Za-z0-9_<>\[\]|&\s]*(?=[,\n;)])/g, ', $1')

  return result
}
