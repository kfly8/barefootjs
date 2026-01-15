/**
 * BarefootJS Compiler v2 - Client JS Generator
 *
 * Generates client-side JavaScript from Pure IR for hydration.
 */

import type {
  ComponentIR,
  IRNode,
  IRElement,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IREvent,
  SignalInfo,
  MemoInfo,
  EffectInfo,
} from './types'

// =============================================================================
// Types
// =============================================================================

interface ClientJsContext {
  componentName: string
  signals: SignalInfo[]
  memos: MemoInfo[]
  effects: EffectInfo[]

  // Collected elements
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  conditionalElements: ConditionalElement[]
  loopElements: LoopElement[]
  refElements: RefElement[]
  childInits: ChildInit[]
}

interface InteractiveElement {
  slotId: string
  events: IREvent[]
}

interface DynamicElement {
  slotId: string
  expression: string
}

interface ConditionalElement {
  slotId: string
  condition: string
  whenTrueHtml: string
  whenFalseHtml: string
}

interface LoopElement {
  slotId: string
  array: string
  param: string
  index: string | null
  key: string | null
  template: string
}

interface RefElement {
  slotId: string
  callback: string
}

interface ChildInit {
  name: string
  slotId: string | null
}

// =============================================================================
// Main Entry Point
// =============================================================================

export function generateClientJs(ir: ComponentIR): string {
  const ctx = createContext(ir)

  // Collect all interactive/dynamic elements from IR
  collectElements(ir.root, ctx)

  // Check if client JS is needed
  if (!needsClientJs(ctx)) {
    return ''
  }

  return generateInitFunction(ir, ctx)
}

function createContext(ir: ComponentIR): ClientJsContext {
  return {
    componentName: ir.metadata.componentName,
    signals: ir.metadata.signals,
    memos: ir.metadata.memos,
    effects: ir.metadata.effects,

    interactiveElements: [],
    dynamicElements: [],
    conditionalElements: [],
    loopElements: [],
    refElements: [],
    childInits: [],
  }
}

function needsClientJs(ctx: ClientJsContext): boolean {
  return (
    ctx.signals.length > 0 ||
    ctx.memos.length > 0 ||
    ctx.effects.length > 0 ||
    ctx.interactiveElements.length > 0 ||
    ctx.dynamicElements.length > 0 ||
    ctx.conditionalElements.length > 0 ||
    ctx.loopElements.length > 0 ||
    ctx.refElements.length > 0 ||
    ctx.childInits.length > 0
  )
}

// =============================================================================
// Element Collection
// =============================================================================

function collectElements(node: IRNode, ctx: ClientJsContext): void {
  switch (node.type) {
    case 'element':
      collectFromElement(node, ctx)
      for (const child of node.children) {
        collectElements(child, ctx)
      }
      break

    case 'expression':
      if (node.reactive && node.slotId) {
        ctx.dynamicElements.push({
          slotId: node.slotId,
          expression: node.expr,
        })
      }
      break

    case 'conditional':
      if (node.reactive && node.slotId) {
        ctx.conditionalElements.push({
          slotId: node.slotId,
          condition: node.condition,
          whenTrueHtml: irToHtmlTemplate(node.whenTrue),
          whenFalseHtml: irToHtmlTemplate(node.whenFalse),
        })
      }
      collectElements(node.whenTrue, ctx)
      collectElements(node.whenFalse, ctx)
      break

    case 'loop':
      if (node.slotId) {
        ctx.loopElements.push({
          slotId: node.slotId,
          array: node.array,
          param: node.param,
          index: node.index,
          key: node.key,
          template: irToHtmlTemplate(node.children[0]),
        })
      }
      for (const child of node.children) {
        collectElements(child, ctx)
      }
      break

    case 'component':
      ctx.childInits.push({
        name: node.name,
        slotId: null,
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
  }
}

function collectFromElement(element: IRElement, ctx: ClientJsContext): void {
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
}

// =============================================================================
// HTML Template Generation (for conditionals/loops)
// =============================================================================

function irToHtmlTemplate(node: IRNode): string {
  switch (node.type) {
    case 'element': {
      const attrs = node.attrs
        .map((a) => {
          if (a.name === '...') return ''
          if (a.value === null) return a.name
          if (a.dynamic) return `${a.name}="\${${a.value}}"`
          return `${a.name}="${a.value}"`
        })
        .filter(Boolean)
        .join(' ')

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
      return `\${${node.expr}}`

    case 'conditional':
      return `\${${node.condition} ? \`${irToHtmlTemplate(node.whenTrue)}\` : \`${irToHtmlTemplate(node.whenFalse)}\`}`

    case 'fragment':
      return node.children.map(irToHtmlTemplate).join('')

    default:
      return ''
  }
}

// =============================================================================
// Init Function Generation
// =============================================================================

function generateInitFunction(ir: ComponentIR, ctx: ClientJsContext): string {
  const lines: string[] = []
  const name = ctx.componentName

  // Imports
  lines.push(`import { createSignal, createMemo, createEffect, findScope, cond, reconcileList } from '@barefootjs/dom'`)
  lines.push('')

  // Init function
  lines.push(`export function init${name}(__instanceIndex, __parentScope, props = {}) {`)

  // Find scope
  lines.push(`  const __scope = findScope('${name}', __instanceIndex, __parentScope)`)
  lines.push(`  if (!__scope) return`)
  lines.push('')

  // Signal declarations
  for (const signal of ctx.signals) {
    const initialValue = signal.initialValue.startsWith('props.')
      ? `props.${signal.initialValue.slice(6)} ?? ${inferDefaultValue(signal.type)}`
      : `props.${signal.getter} ?? ${signal.initialValue}`
    lines.push(`  const [${signal.getter}, ${signal.setter}] = createSignal(${initialValue})`)
  }

  // Memo declarations
  for (const memo of ctx.memos) {
    lines.push(`  const ${memo.name} = createMemo(${memo.computation})`)
  }

  if (ctx.signals.length > 0 || ctx.memos.length > 0) {
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
    lines.push(`  createEffect(() => {`)
    lines.push(`    const __val = ${elem.expression}`)
    lines.push(`    if (_${elem.slotId}) _${elem.slotId}.textContent = String(__val)`)
    lines.push(`  })`)
    lines.push('')
  }

  // Conditional updates
  for (const elem of ctx.conditionalElements) {
    lines.push(`  cond(__scope, '${elem.slotId}', () => ${elem.condition}, [`)
    lines.push(`    () => \`${elem.whenTrueHtml}\`,`)
    lines.push(`    () => \`${elem.whenFalseHtml}\``)
    lines.push(`  ])`)
    lines.push('')
  }

  // Loop updates
  for (const elem of ctx.loopElements) {
    const keyFn = elem.key ? `(${elem.param}) => String(${elem.key})` : 'null'
    lines.push(`  createEffect(() => {`)
    lines.push(`    const __arr = ${elem.array}`)
    lines.push(`    reconcileList(_${elem.slotId}, __arr, ${keyFn}, (${elem.param}) => \`${elem.template}\`)`)
    lines.push(`  })`)
    lines.push('')
  }

  // Event handlers
  for (const elem of ctx.interactiveElements) {
    for (const event of elem.events) {
      const eventProp = `on${event.name}`
      lines.push(`  if (_${elem.slotId}) _${elem.slotId}.${eventProp} = ${event.handler}`)
    }
  }

  // Ref callbacks
  for (const elem of ctx.refElements) {
    lines.push(`  if (_${elem.slotId}) (${elem.callback})(_${elem.slotId})`)
  }

  // User-defined effects
  for (const effect of ctx.effects) {
    lines.push(`  createEffect(${effect.body})`)
  }

  // Child component inits
  for (const child of ctx.childInits) {
    lines.push(`  // TODO: init${child.name}(__instanceIndex, __scope)`)
  }

  lines.push(`}`)

  return lines.join('\n')
}

function generateElementRefs(ctx: ClientJsContext): string {
  const allSlotIds = new Set<string>()

  for (const elem of ctx.interactiveElements) {
    allSlotIds.add(elem.slotId)
  }
  for (const elem of ctx.dynamicElements) {
    allSlotIds.add(elem.slotId)
  }
  for (const elem of ctx.conditionalElements) {
    allSlotIds.add(elem.slotId)
  }
  for (const elem of ctx.loopElements) {
    allSlotIds.add(elem.slotId)
  }
  for (const elem of ctx.refElements) {
    allSlotIds.add(elem.slotId)
  }

  if (allSlotIds.size === 0) return ''

  const lines: string[] = []
  for (const slotId of allSlotIds) {
    lines.push(`  const _${slotId} = __scope.querySelector('[data-bf="${slotId}"]')`)
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
