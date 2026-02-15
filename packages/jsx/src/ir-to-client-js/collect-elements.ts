/**
 * IR tree traversal → collect elements into ClientJsContext.
 */

import type { IRNode, IRElement, IREvent } from '../types'
import type { ClientJsContext, LoopChildEvent } from './types'
import { attrValueToString, quotePropName } from './utils'
import { isReactiveExpression, collectEventHandlersFromIR, collectConditionalBranchEvents, collectConditionalBranchRefs, collectLoopChildEvents } from './reactivity'
import { irToHtmlTemplate } from './html-template'
import { expandDynamicPropValue } from './prop-handling'

/** Recursively walk the IR tree and populate ctx with interactive/dynamic/loop/conditional elements. */
export function collectElements(node: IRNode, ctx: ClientJsContext, insideConditional = false): void {
  switch (node.type) {
    case 'element':
      collectFromElement(node, ctx, insideConditional)
      for (const child of node.children) {
        collectElements(child, ctx, insideConditional)
      }
      break

    case 'expression':
      if (node.clientOnly && node.slotId) {
        ctx.clientOnlyElements.push({
          slotId: node.slotId,
          expression: node.expr,
        })
      } else if (node.reactive && node.slotId) {
        ctx.dynamicElements.push({
          slotId: node.slotId,
          expression: node.expr,
          insideConditional,
        })
      }
      break

    case 'conditional':
      if (node.clientOnly && node.slotId) {
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
        const childHandlers: string[] = []
        const childEvents: LoopChildEvent[] = []
        for (const child of node.children) {
          childHandlers.push(...collectEventHandlersFromIR(child))
          childEvents.push(...collectLoopChildEvents(child))
        }

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
          sortComparator: node.sortComparator ? {
            paramA: node.sortComparator.paramA,
            paramB: node.sortComparator.paramB,
            raw: node.sortComparator.raw,
          } : undefined,
          chainOrder: node.chainOrder,
        })
      }
      // Don't traverse into loop children for interactive elements collection
      // (they use loop variables that are only available inside the loop iteration).
      // But we DO extract event handler identifiers above for function inclusion.
      break

    case 'component':
      if (node.slotId) {
        const componentEvents: IREvent[] = []
        for (const prop of node.props) {
          if (prop.name.startsWith('on') && prop.name.length > 2) {
            const eventName = prop.name[2].toLowerCase() + prop.name.slice(3)
            componentEvents.push({
              name: eventName,
              handler: prop.value,
              loc: prop.loc,
            })
          }
        }
        if (componentEvents.length > 0) {
          ctx.interactiveElements.push({
            slotId: node.slotId,
            events: componentEvents,
            isComponentSlot: true,
          })
        }

        // Reactive props need effects to update the element when values change
        for (const prop of node.props) {
          if (prop.name.startsWith('on') && prop.name.length > 2) continue
          const value = prop.value
          if (value.endsWith('()')) {
            const fnName = value.slice(0, -2)
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

      const propsForInit: string[] = []
      for (const prop of node.props) {
        if (prop.name === '...' || prop.name.startsWith('...')) continue
        const isEventHandler =
          prop.name.startsWith('on') &&
          prop.name.length > 2 &&
          prop.name[2] === prop.name[2].toUpperCase()
        if (isEventHandler) {
          propsForInit.push(`${quotePropName(prop.name)}: ${prop.value}`)
        } else if (prop.dynamic) {
          const expandedValue = expandDynamicPropValue(prop.value, ctx)
          propsForInit.push(`get ${quotePropName(prop.name)}() { return ${expandedValue} }`)

          const hasPropsRef = expandedValue.includes('props.')
          const hasReactiveExpr = isReactiveExpression(expandedValue, ctx)
          if (hasPropsRef || hasReactiveExpr) {
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
          propsForInit.push(`${quotePropName(prop.name)}: ${JSON.stringify(prop.value)}`)
        } else {
          propsForInit.push(`${quotePropName(prop.name)}: ${prop.value}`)
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

    case 'provider':
      ctx.providerSetups.push({
        contextName: node.contextName,
        valueExpr: node.valueProp.value,
      })
      for (const child of node.children) {
        collectElements(child, ctx)
      }
      break
  }
}

/** Extract events, refs, and reactive attributes from a single IR element into ctx. */
function collectFromElement(element: IRElement, ctx: ClientJsContext, _insideConditional = false): void {
  if (element.events.length > 0 && element.slotId) {
    ctx.interactiveElements.push({
      slotId: element.slotId,
      events: element.events,
    })
  }

  if (element.ref && element.slotId) {
    ctx.refElements.push({
      slotId: element.slotId,
      callback: element.ref,
    })
  }

  if (element.slotId) {
    for (const attr of element.attrs) {
      if (attr.dynamic && attr.value) {
        const valueStr = attrValueToString(attr.value)
        if (!valueStr) continue

        if (isReactiveExpression(valueStr, ctx)) {
          ctx.reactiveAttrs.push({
            slotId: element.slotId,
            attrName: attr.name,
            expression: valueStr,
            presenceOrUndefined: attr.presenceOrUndefined,
          })
        }
      }
    }
  }
}
