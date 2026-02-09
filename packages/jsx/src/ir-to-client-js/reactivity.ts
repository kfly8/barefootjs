/**
 * Reactivity detection: reactive expression checking, event/ref collection.
 */

import type { IRNode, IRElement } from '../types'
import type {
  ClientJsContext,
  ConditionalBranchEvent,
  ConditionalBranchRef,
  LoopChildEvent,
} from './types'

/**
 * Check if an expression references signal getters or memos.
 */
export function isReactiveExpression(expr: string, ctx: ClientJsContext): boolean {
  for (const signal of ctx.signals) {
    if (new RegExp(`\\b${signal.getter}\\s*\\(`).test(expr)) {
      return true
    }
  }

  for (const memo of ctx.memos) {
    if (new RegExp(`\\b${memo.name}\\s*\\(`).test(expr)) {
      return true
    }
  }

  // props.xxx may be reactive when passed as getters from parent
  if (/\bprops\.\w+/.test(expr)) {
    return true
  }

  return false
}

/**
 * Recursively collect all event handler expressions from an IR node tree.
 * Used to extract function identifiers from loop children.
 */
export function collectEventHandlersFromIR(node: IRNode): string[] {
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
    case 'provider':
      for (const child of node.children) {
        handlers.push(...collectEventHandlersFromIR(child))
      }
      break
  }

  return handlers
}

/**
 * Traverse an IR tree depth-first, calling visitor for each element node.
 * Shared by collectConditionalBranchEvents, collectConditionalBranchRefs,
 * and collectLoopChildEvents to avoid duplicating the traversal logic.
 */
function traverseElements(node: IRNode, visitor: (el: IRElement) => void): void {
  switch (node.type) {
    case 'element':
      visitor(node)
      for (const child of node.children) {
        traverseElements(child, visitor)
      }
      break
    case 'fragment':
    case 'component':
    case 'provider':
      for (const child of node.children) {
        traverseElements(child, visitor)
      }
      break
    case 'conditional':
      traverseElements(node.whenTrue, visitor)
      traverseElements(node.whenFalse, visitor)
      break
    case 'if-statement':
      traverseElements(node.consequent, visitor)
      if (node.alternate) {
        traverseElements(node.alternate, visitor)
      }
      break
  }
}

/**
 * Collect events from a conditional branch for use with insert().
 * These events will be bound via the branch's bindEvents function.
 */
export function collectConditionalBranchEvents(node: IRNode): ConditionalBranchEvent[] {
  const events: ConditionalBranchEvent[] = []
  traverseElements(node, (el) => {
    if (el.slotId && el.events.length > 0) {
      for (const event of el.events) {
        events.push({
          slotId: el.slotId,
          eventName: event.name,
          handler: event.handler,
        })
      }
    }
  })
  return events
}

/**
 * Collect refs from a conditional branch for use with insert().
 * These refs will be called via the branch's bindEvents function.
 */
export function collectConditionalBranchRefs(node: IRNode): ConditionalBranchRef[] {
  const refs: ConditionalBranchRef[] = []
  traverseElements(node, (el) => {
    if (el.slotId && el.ref) {
      refs.push({
        slotId: el.slotId,
        callback: el.ref,
      })
    }
  })
  return refs
}

/**
 * Collect detailed event info from loop children for event delegation.
 */
export function collectLoopChildEvents(node: IRNode): LoopChildEvent[] {
  const events: LoopChildEvent[] = []
  traverseElements(node, (el) => {
    if (el.slotId) {
      for (const event of el.events) {
        events.push({
          eventName: event.name,
          childSlotId: el.slotId,
          handler: event.handler,
        })
      }
    }
  })
  return events
}
