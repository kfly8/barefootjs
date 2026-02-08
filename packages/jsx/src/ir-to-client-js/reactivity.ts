/**
 * Reactivity detection: reactive expression checking, event/ref collection.
 */

import type { IRNode } from '../types'
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
    case 'provider':
      for (const child of node.children) {
        handlers.push(...collectEventHandlersFromIR(child))
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
export function collectConditionalBranchEvents(node: IRNode): ConditionalBranchEvent[] {
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
      case 'provider':
        for (const child of n.children) {
          traverse(child)
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
export function collectConditionalBranchRefs(node: IRNode): ConditionalBranchRef[] {
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
      case 'provider':
        for (const child of n.children) {
          traverse(child)
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
export function collectLoopChildEvents(node: IRNode): LoopChildEvent[] {
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
    case 'provider':
      for (const child of node.children) {
        events.push(...collectLoopChildEvents(child))
      }
      break
  }

  return events
}
