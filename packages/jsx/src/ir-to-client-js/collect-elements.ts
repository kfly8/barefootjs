/**
 * IR tree traversal → collect elements into ClientJsContext.
 */

import type { IRNode, IRElement, IREvent } from '../types'
import type { ClientJsContext, LoopChildEvent } from './types'
import { attrValueToString } from './utils'
import { isReactiveExpression, collectEventHandlersFromIR, collectConditionalBranchEvents, collectConditionalBranchRefs, collectLoopChildEvents } from './reactivity'
import { irToHtmlTemplate } from './html-template'
import { expandDynamicPropValue } from './prop-handling'

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
