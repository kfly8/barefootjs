/**
 * Extracted output phases from generateInitFunction.
 * Each function appends to a lines[] array.
 */

import type { ComponentIR, ConstantInfo, SignalInfo } from '../types'
import { isBooleanAttr } from '../html-constants'
import type { ClientJsContext, ConditionalBranchEvent, ConditionalBranchRef } from './types'
import { stripTypeScriptSyntax, inferDefaultValue, toHtmlAttrName, toDomEventProp, wrapHandlerInBlock, buildChainedArrayExpr, quotePropName, varSlotId } from './utils'
import { addCondAttrToTemplate, canGenerateStaticTemplate, irToComponentTemplate } from './html-template'

/**
 * Collect slot IDs that are inside conditionals (handled by insert()).
 * Used by both generateElementRefs and emitEventHandlers.
 */
export function collectConditionalSlotIds(ctx: ClientJsContext): Set<string> {
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
  return conditionalSlotIds
}

/** Emit `const propName = props.propName ?? default` declarations. */
export function emitPropsExtraction(
  lines: string[],
  ctx: ClientJsContext,
  neededProps: Set<string>,
  propsWithPropertyAccess: Set<string>,
  propsUsedAsLoopArrays: Set<string>
): void {
  // Props used as conditional guards must remain falsy when undefined,
  // so we must NOT default them to {} (which is truthy).
  const propsUsedAsConditions = new Set<string>()
  for (const cond of ctx.conditionalElements) {
    if (neededProps.has(cond.condition)) {
      propsUsedAsConditions.add(cond.condition)
    }
  }
  for (const cond of ctx.clientOnlyConditionals) {
    if (neededProps.has(cond.condition)) {
      propsUsedAsConditions.add(cond.condition)
    }
  }

  if (neededProps.size > 0 && !ctx.propsObjectName) {
    for (const propName of neededProps) {
      const prop = ctx.propsParams.find((p) => p.name === propName)
      const defaultVal = prop?.defaultValue
      if (defaultVal) {
        // Wrap arrow function defaults in parentheses to avoid operator precedence issues
        // e.g., `props.onInput ?? () => {}` is a syntax error; must be `props.onInput ?? (() => {})`
        const wrappedDefault = defaultVal.includes('=>') ? `(${defaultVal})` : defaultVal
        lines.push(`  const ${propName} = props.${propName} ?? ${wrappedDefault}`)
      } else if (propsUsedAsLoopArrays.has(propName)) {
        lines.push(`  const ${propName} = props.${propName} ?? []`)
      } else if (propsWithPropertyAccess.has(propName) && !propsUsedAsConditions.has(propName)) {
        lines.push(`  const ${propName} = props.${propName} ?? {}`)
      } else if (prop?.optional && prop?.type) {
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
}

/** Emit constants that have no signal/memo dependencies (before signal declarations). */
export function emitEarlyConstants(lines: string[], earlyConstants: ConstantInfo[]): void {
  for (const constant of earlyConstants) {
    const jsValue = stripTypeScriptSyntax(constant.value)
    lines.push(`  const ${constant.name} = ${jsValue}`)
  }
  if (earlyConstants.length > 0) {
    lines.push('')
  }
}

/** Emit createSignal/createMemo declarations, controlled-signal sync effects, and late constants. */
export function emitSignalsAndMemos(
  lines: string[],
  ctx: ClientJsContext,
  controlledSignals: Array<{ signal: SignalInfo; propName: string }>,
  lateConstants: ConstantInfo[]
): void {
  const propsName = ctx.propsObjectName ?? 'props'
  const propsPrefix = `${propsName}.`

  for (const signal of ctx.signals) {
    let initialValue: string
    if (signal.initialValue.startsWith(propsPrefix) && !signal.initialValue.includes('??')) {
      // Replace original prefix with 'props.' for generated code
      const propRef = 'props.' + signal.initialValue.slice(propsPrefix.length)
      initialValue = `${propRef} ?? ${inferDefaultValue(signal.type)}`
    } else {
      const controlled = controlledSignals.find(c => c.signal === signal)
      if (controlled) {
        if (signal.initialValue.includes('??')) {
          // Preserve developer's original fallback (e.g., props.initial ?? 0)
          if (ctx.propsObjectName && signal.initialValue.startsWith(propsPrefix)) {
            initialValue = 'props.' + signal.initialValue.slice(propsPrefix.length)
          } else {
            initialValue = signal.initialValue
          }
        } else {
          const prop = ctx.propsParams.find(p => p.name === controlled.propName)
          const defaultVal = prop?.defaultValue ?? inferDefaultValue(signal.type)
          initialValue = `props.${controlled.propName} ?? ${defaultVal}`
        }
      } else if (ctx.propsObjectName && signal.initialValue.startsWith(propsPrefix)) {
        // Replace custom props name with 'props.' even when ?? is present
        initialValue = 'props.' + signal.initialValue.slice(propsPrefix.length)
      } else {
        initialValue = signal.initialValue
      }
    }

    lines.push(`  const [${signal.getter}, ${signal.setter}] = createSignal(${initialValue})`)
  }

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

  for (const memo of ctx.memos) {
    const jsComputation = stripTypeScriptSyntax(memo.computation)
    lines.push(`  const ${memo.name} = createMemo(${jsComputation})`)
  }

  for (const constant of lateConstants) {
    const jsValue = stripTypeScriptSyntax(constant.value)
    lines.push(`  const ${constant.name} = ${jsValue}`)
  }

  if (ctx.signals.length > 0 || ctx.memos.length > 0 || lateConstants.length > 0) {
    lines.push('')
  }
}

/** Emit local function definitions, arrow-function constants, and props-based event handlers. */
export function emitFunctionsAndHandlers(
  lines: string[],
  ctx: ClientJsContext,
  usedIdentifiers: Set<string>,
  outputConstants: Set<string>,
  usedFunctions: Set<string>,
  neededProps: Set<string>
): void {
  for (const fn of ctx.localFunctions) {
    if (usedIdentifiers.has(fn.name)) {
      const paramStr = fn.params.map((p) => p.name).join(', ')
      const jsBody = stripTypeScriptSyntax(fn.body)
      lines.push(`  const ${fn.name} = (${paramStr}) => ${jsBody}`)
      lines.push('')
    }
  }

  for (const constant of ctx.localConstants) {
    if (outputConstants.has(constant.name)) continue
    if (usedIdentifiers.has(constant.name)) {
      const value = constant.value.trim()
      if (value.includes('=>')) {
        const jsValue = stripTypeScriptSyntax(value)
        lines.push(`  const ${constant.name} = ${jsValue}`)
        lines.push('')
      }
    }
  }

  const localNames = new Set([
    ...ctx.localFunctions.map((f) => f.name),
    ...ctx.localConstants.map((c) => c.name),
  ])
  let addedPropsHandler = false
  for (const handlerName of usedFunctions) {
    if (localNames.has(handlerName)) continue
    if (neededProps.has(handlerName)) continue

    const isProp = ctx.propsParams.some((p) => p.name === handlerName)
    if (isProp) {
      lines.push(`  const ${handlerName} = props.${handlerName}`)
      addedPropsHandler = true
    }
  }
  if (addedPropsHandler) {
    lines.push('')
  }
}

/** Emit createEffect blocks that update textContent for reactive expressions. */
export function emitDynamicTextUpdates(lines: string[], ctx: ClientJsContext): void {
  // Group elements by expression to consolidate effects with same dependencies
  const byExpression = new Map<string, typeof ctx.dynamicElements>()
  for (const elem of ctx.dynamicElements) {
    const key = elem.expression
    if (!byExpression.has(key)) {
      byExpression.set(key, [])
    }
    byExpression.get(key)!.push(elem)
  }

  for (const [expr, elems] of byExpression) {
    // Separate conditional vs non-conditional elements
    const conditionalElems = elems.filter(e => e.insideConditional)
    const normalElems = elems.filter(e => !e.insideConditional)

    if (normalElems.length > 0 || conditionalElems.length > 0) {
      lines.push(`  createEffect(() => {`)
      if (normalElems.length > 0) {
        // Expression is always evaluated for non-conditional elements
        lines.push(`    const __val = ${expr}`)
        for (const elem of normalElems) {
          const v = varSlotId(elem.slotId)
          lines.push(`    if (_${v}) _${v}.textContent = String(__val)`)
        }
        for (const elem of conditionalElems) {
          const v = varSlotId(elem.slotId)
          lines.push(`    const __el_${v} = $(__scope, '${elem.slotId}')`)
          lines.push(`    if (__el_${v}) __el_${v}.textContent = String(__val)`)
        }
      } else {
        // Only conditional elements — defer expression evaluation until
        // after the element existence check to avoid TypeError when the
        // parent prop is undefined (e.g. prev?.title when prev is undefined).
        for (const elem of conditionalElems) {
          const v = varSlotId(elem.slotId)
          lines.push(`    const __el_${v} = $(__scope, '${elem.slotId}')`)
          lines.push(`    if (__el_${v}) __el_${v}.textContent = String(${expr})`)
        }
      }
      lines.push(`  })`)
      lines.push('')
    }
  }
}

/** Emit createEffect blocks for client-only expressions using comment markers. */
export function emitClientOnlyExpressions(lines: string[], ctx: ClientJsContext): void {
  for (const elem of ctx.clientOnlyElements) {
    lines.push(`  // @client: ${elem.slotId}`)
    lines.push(`  createEffect(() => {`)
    lines.push(`    updateClientMarker(__scope, '${elem.slotId}', ${elem.expression})`)
    lines.push(`  })`)
    lines.push('')
  }
}

/** Emit createEffect blocks that sync reactive attribute values (class, value, checked, etc.). */
export function emitReactiveAttributeUpdates(lines: string[], ctx: ClientJsContext): void {
  if (ctx.reactiveAttrs.length > 0) {
    const attrsBySlot = new Map<string, typeof ctx.reactiveAttrs>()
    for (const attr of ctx.reactiveAttrs) {
      if (!attrsBySlot.has(attr.slotId)) {
        attrsBySlot.set(attr.slotId, [])
      }
      attrsBySlot.get(attr.slotId)!.push(attr)
    }

    for (const [slotId, attrs] of attrsBySlot) {
      const v = varSlotId(slotId)
      lines.push(`  createEffect(() => {`)
      lines.push(`    if (_${v}) {`)
      for (const attr of attrs) {
        const htmlAttrName = toHtmlAttrName(attr.attrName)
        if (htmlAttrName === 'value') {
          lines.push(`      const __val = String(${attr.expression})`)
          lines.push(`      if (_${v}.value !== __val) _${v}.value = __val`)
        } else if (isBooleanAttr(htmlAttrName)) {
          lines.push(`      _${v}.${htmlAttrName} = !!(${attr.expression})`)
        } else if (attr.presenceOrUndefined) {
          lines.push(`      if (${attr.expression}) _${v}.setAttribute('${htmlAttrName}', '')`)
          lines.push(`      else _${v}.removeAttribute('${htmlAttrName}')`)
        } else {
          // Handle null/undefined: remove attribute instead of setting "undefined"
          lines.push(`      { const __v = ${attr.expression}; if (__v != null) _${v}.setAttribute('${htmlAttrName}', String(__v)); else _${v}.removeAttribute('${htmlAttrName}') }`)
        }
      }
      lines.push(`    }`)
      lines.push(`  })`)
      lines.push('')
    }
  }
}

/**
 * Emit find() + event binding + ref callbacks for a conditional branch.
 * Used by both emitConditionalUpdates and emitClientOnlyConditionals.
 */
function emitBranchBindings(
  lines: string[],
  events: ConditionalBranchEvent[],
  refs: ConditionalBranchRef[],
  eventPropFn: (eventName: string) => string
): void {
  const allSlotIds = new Set<string>()
  for (const event of events) allSlotIds.add(event.slotId)
  for (const ref of refs) allSlotIds.add(ref.slotId)

  const eventsBySlot = new Map<string, ConditionalBranchEvent[]>()
  for (const event of events) {
    if (!eventsBySlot.has(event.slotId)) {
      eventsBySlot.set(event.slotId, [])
    }
    eventsBySlot.get(event.slotId)!.push(event)
  }

  for (const slotId of allSlotIds) {
    lines.push(`      const _${varSlotId(slotId)} = $(__branchScope, '${slotId}')`)
  }

  for (const [slotId, slotEvents] of eventsBySlot) {
    const v = varSlotId(slotId)
    for (const event of slotEvents) {
      const wrappedHandler = wrapHandlerInBlock(event.handler)
      lines.push(`      if (_${v}) _${v}.${eventPropFn(event.eventName)} = ${wrappedHandler}`)
    }
  }

  for (const ref of refs) {
    const v = varSlotId(ref.slotId)
    lines.push(`      if (_${v}) (${stripTypeScriptSyntax(ref.callback)})(_${v})`)
  }
}

/** Emit insert() calls for server-rendered reactive conditionals with branch configs. */
export function emitConditionalUpdates(lines: string[], ctx: ClientJsContext): void {
  for (const elem of ctx.conditionalElements) {
    const whenTrueWithCond = addCondAttrToTemplate(elem.whenTrueHtml, elem.slotId)
    const whenFalseWithCond = addCondAttrToTemplate(elem.whenFalseHtml, elem.slotId)

    lines.push(`  insert(__scope, '${elem.slotId}', () => ${elem.condition}, {`)
    lines.push(`    template: () => \`${whenTrueWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    emitBranchBindings(lines, elem.whenTrueEvents, elem.whenTrueRefs, toDomEventProp)
    lines.push(`    }`)
    lines.push(`  }, {`)
    lines.push(`    template: () => \`${whenFalseWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    emitBranchBindings(lines, elem.whenFalseEvents, elem.whenFalseRefs, toDomEventProp)
    lines.push(`    }`)
    lines.push(`  })`)
    lines.push('')
  }
}

/** Emit insert() calls for client-only conditionals (not server-rendered). */
export function emitClientOnlyConditionals(lines: string[], ctx: ClientJsContext): void {
  for (const elem of ctx.clientOnlyConditionals) {
    const whenTrueWithCond = addCondAttrToTemplate(elem.whenTrueHtml, elem.slotId)
    const whenFalseWithCond = addCondAttrToTemplate(elem.whenFalseHtml, elem.slotId)
    const rawEventProp = (eventName: string) => `on${eventName}`

    lines.push(`  // @client conditional: ${elem.slotId}`)
    lines.push(`  insert(__scope, '${elem.slotId}', () => ${elem.condition}, {`)
    lines.push(`    template: () => \`${whenTrueWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    emitBranchBindings(lines, elem.whenTrueEvents, elem.whenTrueRefs, rawEventProp)
    lines.push(`    }`)
    lines.push(`  }, {`)
    lines.push(`    template: () => \`${whenFalseWithCond}\`,`)
    lines.push(`    bindEvents: (__branchScope) => {`)
    emitBranchBindings(lines, elem.whenFalseEvents, elem.whenFalseRefs, rawEventProp)
    lines.push(`    }`)
    lines.push(`  })`)
    lines.push('')
  }
}

/** Emit reconcileList calls for dynamic loops, and static array child initialization. */
export function emitLoopUpdates(lines: string[], ctx: ClientJsContext): void {
  for (const elem of ctx.loopElements) {
    if (elem.isStaticArray) {
      if (elem.childComponent) {
        const { name } = elem.childComponent
        const v = varSlotId(elem.slotId)
        lines.push(`  // Initialize static array children (hydrate skips nested instances)`)
        lines.push(`  if (_${v}) {`)
        lines.push(`    const __childScopes = _${v}.querySelectorAll('[bf-s^="~${name}_"]:not([bf-h]), [bf-s^="${name}_"]:not([bf-h])')`)
        lines.push(`    __childScopes.forEach((childScope, __idx) => {`)
        lines.push(`      const __childProps = ${elem.array}[__idx] || {}`)
        lines.push(`      initChild('${name}', childScope, __childProps)`)
        lines.push(`    })`)
        lines.push(`  }`)
        lines.push('')
      }

      if (elem.nestedComponents && elem.nestedComponents.length > 0) {
        const v = varSlotId(elem.slotId)
        for (const comp of elem.nestedComponents) {
          const propsEntries = comp.props.map((p) => {
            if (p.isEventHandler) {
              return `${quotePropName(p.name)}: ${p.value}`
            } else if (p.isLiteral) {
              return `${quotePropName(p.name)}: ${JSON.stringify(p.value)}`
            } else {
              return `get ${quotePropName(p.name)}() { return ${p.value} }`
            }
          })
          const propsExpr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : '{}'

          const selector = comp.slotId
            ? `[bf-s$="_${comp.slotId}"]:not([bf-h])`
            : `[bf-s^="~${comp.name}_"]:not([bf-h]), [bf-s^="${comp.name}_"]:not([bf-h])`

          lines.push(`  // Initialize nested ${comp.name} in static array`)
          lines.push(`  if (_${v}) {`)
          lines.push(`    ${elem.array}.forEach((${elem.param}, __idx) => {`)
          lines.push(`      const __iterEl = _${v}.children[__idx]`)
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

    const vLoop = varSlotId(elem.slotId)

    if (elem.childComponent) {
      const { name, props } = elem.childComponent
      const propsEntries = props.map((p) => {
        if (p.isEventHandler) {
          return `${quotePropName(p.name)}: ${p.value}`
        } else if (p.isLiteral) {
          return `get ${quotePropName(p.name)}() { return ${JSON.stringify(p.value)} }`
        } else {
          return `get ${quotePropName(p.name)}() { return ${p.value} }`
        }
      })
      const propsExpr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : '{}'
      const keyExpr = elem.key || '__idx'
      const indexParam = elem.index || '__idx'

      const chainedExpr = buildChainedArrayExpr(elem)

      lines.push(`  createEffect(() => {`)
      lines.push(`    reconcileList(_${vLoop}, ${chainedExpr}, ${keyFn}, (${elem.param}, ${indexParam}) =>`)
      lines.push(`      createComponent('${name}', ${propsExpr}, ${keyExpr})`)
      lines.push(`    )`)
      lines.push(`  })`)
    } else {
      const chainedExprTemplate = buildChainedArrayExpr(elem)

      const indexParamTemplate = elem.index || '__idx'
      lines.push(`  createEffect(() => {`)
      lines.push(`    const __arr = ${chainedExprTemplate}`)
      lines.push(`    reconcileList(_${vLoop}, __arr, ${keyFn}, (${elem.param}, ${indexParamTemplate}) => \`${elem.template}\`)`)
      lines.push(`  })`)
    }
    lines.push('')

    if (!elem.childComponent && elem.childEvents.length > 0) {
      const eventsByName = new Map<string, typeof elem.childEvents>()
      for (const ev of elem.childEvents) {
        if (!eventsByName.has(ev.eventName)) {
          eventsByName.set(ev.eventName, [])
        }
        eventsByName.get(ev.eventName)!.push(ev)
      }

      // Non-bubbling events need addEventListener with capture for delegation
      const NON_BUBBLING_EVENTS = new Set(['blur', 'focus', 'load', 'unload'])

      for (const [eventName, events] of eventsByName) {
        const useCapture = NON_BUBBLING_EVENTS.has(eventName)
        if (useCapture) {
          lines.push(`  if (_${vLoop}) _${vLoop}.addEventListener('${eventName}', (e) => {`)
        } else {
          lines.push(`  if (_${vLoop}) _${vLoop}.${toDomEventProp(eventName)} = (e) => {`)
        }
        lines.push(`    const target = e.target`)
        for (const ev of events) {
          lines.push(`    const ${ev.childSlotId}El = target.closest('[bf="${ev.childSlotId}"]')`)
          lines.push(`    if (${ev.childSlotId}El) {`)
          // Pass event `e` to handler functions so they can access e.target etc.
          const handlerCall = ev.handler.trim().startsWith('(') || ev.handler.trim().startsWith('function')
            ? `(${ev.handler})(e)`
            : ev.handler
          if (elem.key) {
            const keyWithItem = elem.key.replace(new RegExp(`\\b${elem.param}\\b`, 'g'), 'item')
            lines.push(`      const li = ${ev.childSlotId}El.closest('[data-key]')`)
            lines.push(`      if (li) {`)
            lines.push(`        const key = li.getAttribute('data-key')`)
            lines.push(`        const ${elem.param} = ${elem.array}.find(item => String(${keyWithItem}) === key)`)
            lines.push(`        if (${elem.param}) ${handlerCall}`)
            lines.push(`      }`)
          } else {
            lines.push(`      const li = ${ev.childSlotId}El.closest('li, [bf-i]')`)
            lines.push(`      if (li && li.parentElement) {`)
            lines.push(`        const idx = Array.from(li.parentElement.children).indexOf(li)`)
            lines.push(`        const ${elem.param} = ${elem.array}[idx]`)
            lines.push(`        if (${elem.param}) ${handlerCall}`)
            lines.push(`      }`)
          }
          lines.push(`      return`)
          lines.push(`    }`)
        }
        if (useCapture) {
          lines.push(`  }, true)`)
        } else {
          lines.push(`  }`)
        }
        lines.push('')
      }
    }
  }
}

/** Emit applyRestAttrs() calls for HTML elements with unresolved spread attrs. */
export function emitRestAttrApplications(lines: string[], ctx: ClientJsContext): void {
  for (const elem of ctx.restAttrElements) {
    const v = varSlotId(elem.slotId)
    const excludeKeys = JSON.stringify(elem.excludeKeys)
    lines.push(`  if (_${v}) applyRestAttrs(_${v}, ${elem.source}, ${excludeKeys})`)
  }
  if (ctx.restAttrElements.length > 0) {
    lines.push('')
  }
}

/** Emit DOM event handler assignments, skipping slots inside conditionals. */
export function emitEventHandlers(
  lines: string[],
  ctx: ClientJsContext,
  conditionalSlotIds: Set<string>
): void {
  for (const elem of ctx.interactiveElements) {
    if (conditionalSlotIds.has(elem.slotId)) continue

    for (const event of elem.events) {
      const eventProp = toDomEventProp(event.name)
      const wrappedHandler = wrapHandlerInBlock(event.handler)
      if (elem.slotId === '__scope') {
        lines.push(`  if (__scope) __scope.${eventProp} = ${wrappedHandler}`)
      } else {
        const v = varSlotId(elem.slotId)
        lines.push(`  if (_${v}) _${v}.${eventProp} = ${wrappedHandler}`)
      }
    }
  }
}

/** Emit createEffect to update component element attributes when signal/memo values change. */
export function emitReactivePropBindings(lines: string[], ctx: ClientJsContext): void {
  if (ctx.reactiveProps.length > 0) {
    lines.push('')
    lines.push(`  // Reactive prop bindings`)
    lines.push(`  createEffect(() => {`)

    const propsBySlot = new Map<string, typeof ctx.reactiveProps>()
    for (const prop of ctx.reactiveProps) {
      if (!propsBySlot.has(prop.slotId)) {
        propsBySlot.set(prop.slotId, [])
      }
      propsBySlot.get(prop.slotId)!.push(prop)
    }

    for (const [slotId, props] of propsBySlot) {
      const v = varSlotId(slotId)
      lines.push(`    if (_${v}) {`)
      for (const prop of props) {
        const value = `${prop.expression}()`
        if (prop.propName === 'selected') {
          if (prop.componentName === 'TabsContent') {
            lines.push(`      _${v}.setAttribute('data-state', ${value} ? 'active' : 'inactive')`)
            lines.push(`      if (${value}) {`)
            lines.push(`        _${v}.classList.remove('hidden')`)
            lines.push(`      } else {`)
            lines.push(`        _${v}.classList.add('hidden')`)
            lines.push(`      }`)
          } else {
            // Update data-state and aria-selected attributes.
            // Visual styling is driven by CSS data-[state=active/inactive]: selectors.
            lines.push(`      _${v}.setAttribute('aria-selected', String(${value}))`)
            lines.push(`      _${v}.setAttribute('data-state', ${value} ? 'active' : 'inactive')`)
            lines.push(`      _${v}.setAttribute('tabindex', ${value} ? '0' : '-1')`)
          }
        // Use DOM property assignment for value and boolean attrs.
        // setAttribute('value', x) only sets the initial HTML attribute; after user
        // interaction the DOM property diverges, so .value = x is required.
        // Boolean attrs (disabled, checked, etc.) treat any attribute presence as
        // truthy, so setAttribute('disabled', 'false') still disables the element.
        } else if (prop.propName === 'value') {
          lines.push(`      const __val = String(${value})`)
          lines.push(`      if (_${v}.value !== __val) _${v}.value = __val`)
        } else if (isBooleanAttr(prop.propName)) {
          lines.push(`      _${v}.${prop.propName} = !!(${value})`)
        } else {
          lines.push(`      _${v}.setAttribute('${prop.propName}', String(${value}))`)
        }
      }
      lines.push(`    }`)
    }

    lines.push(`  })`)
  }
}

/** Emit createEffect to update child component DOM attributes when parent props change. */
export function emitReactiveChildProps(lines: string[], ctx: ClientJsContext): void {
  if (ctx.reactiveChildProps.length > 0) {
    lines.push('')
    lines.push(`  // Reactive child component props`)
    lines.push(`  createEffect(() => {`)

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
      const varSuffix = first.slotId ? varSlotId(first.slotId).replace(/-/g, '_') : first.componentName
      const varName = `__${first.componentName}_${varSuffix}El`
      const selectorBase = first.slotId
        ? `$c(__scope, '${first.slotId}')`
        : `$c(__scope, '${first.componentName}')`
      lines.push(`    const ${varName} = ${selectorBase}`)
      lines.push(`    if (${varName}) {`)
      for (const prop of props) {
        if (prop.attrName === 'class') {
          lines.push(`      ${varName}.setAttribute('class', ${prop.expression})`)
        // Use DOM property assignment for value and boolean attrs (see emitReactivePropBindings)
        } else if (prop.attrName === 'value') {
          lines.push(`      const __val = String(${prop.expression})`)
          lines.push(`      if (${varName}.value !== __val) ${varName}.value = __val`)
        } else if (isBooleanAttr(prop.attrName)) {
          lines.push(`      ${varName}.${prop.attrName} = !!(${prop.expression})`)
        } else {
          // Handle null/undefined: remove attribute instead of setting "undefined"
          lines.push(`      { const __v = ${prop.expression}; if (__v != null) ${varName}.setAttribute('${prop.attrName}', String(__v)); else ${varName}.removeAttribute('${prop.attrName}') }`)
        }
      }
      lines.push(`    }`)
    }

    lines.push(`  })`)
  }
}

/** Emit ref callback invocations, skipping slots inside conditionals. */
export function emitRefCallbacks(
  lines: string[],
  ctx: ClientJsContext,
  conditionalSlotIds: Set<string>
): void {
  for (const elem of ctx.refElements) {
    if (conditionalSlotIds.has(elem.slotId)) continue
    const v = varSlotId(elem.slotId)
    lines.push(`  if (_${v}) (${stripTypeScriptSyntax(elem.callback)})(_${v})`)
  }
}

/** Emit user-defined createEffect and onMount calls. */
export function emitEffectsAndOnMounts(lines: string[], ctx: ClientJsContext): void {
  for (const effect of ctx.effects) {
    const jsBody = stripTypeScriptSyntax(effect.body)
    lines.push(`  createEffect(${jsBody})`)
  }

  for (const onMount of ctx.onMounts) {
    const jsBody = stripTypeScriptSyntax(onMount.body)
    lines.push(`  onMount(${jsBody})`)
  }
}

/** Emit provideContext calls and initChild calls for child components. */
export function emitProviderAndChildInits(lines: string[], ctx: ClientJsContext): void {
  if (ctx.providerSetups.length > 0) {
    lines.push('')
    lines.push('  // Provide context for child components')
    for (const provider of ctx.providerSetups) {
      const jsValueExpr = stripTypeScriptSyntax(provider.valueExpr)
      lines.push(`  provideContext(${provider.contextName}, ${jsValueExpr})`)
    }
  }

  if (ctx.childInits.length > 0) {
    lines.push('')
    lines.push(`  // Initialize child components with props`)
    for (const child of ctx.childInits) {
      const scopeRef = child.slotId ? `_${varSlotId(child.slotId)}` : '__scope'
      const jsPropsExpr = stripTypeScriptSyntax(child.propsExpr)
      lines.push(`  initChild('${child.name}', ${scopeRef}, ${jsPropsExpr})`)
    }
  }
}

// JavaScript built-in identifiers that are always available at any scope
const JS_BUILTINS = new Set([
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'typeof', 'instanceof', 'void', 'delete', 'new', 'in', 'of',
  'this', 'super', 'return', 'throw', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
  'try', 'catch', 'finally', 'yield', 'await', 'async',
  'let', 'const', 'var', 'function', 'class',
  'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'Date', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise',
  'Error', 'TypeError', 'RangeError', 'SyntaxError',
  'console', 'window', 'document', 'globalThis', 'navigator',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame',
  'Symbol', 'Proxy', 'Reflect', 'BigInt',
])

/**
 * Check that an expression value only references identifiers known within
 * the component scope (or JavaScript built-ins). Returns false if the value
 * contains references to file-scope variables that won't be available in
 * the generated client JS module scope.
 */
function valueOnlyUsesKnownNames(value: string, knownNames: Set<string>): boolean {
  // Strip string literal content to avoid false-positive identifier matches.
  // For template literals, extract only ${...} expression parts.
  let codeParts = value
    .replace(/'(?:[^'\\]|\\.)*'/g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '')

  if (codeParts.includes('`')) {
    const exprParts: string[] = []
    const templateExprRegex = /\$\{([^}]*)\}/g
    let match
    while ((match = templateExprRegex.exec(codeParts)) !== null) {
      exprParts.push(match[1])
    }
    // Keep non-template-literal code, replace template literals with extracted expressions
    codeParts = codeParts.replace(/`[^`]*`/g, '') + ' ' + exprParts.join(' ')
  }

  const identifiers = codeParts.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g)
  for (const m of identifiers) {
    const id = m[1]
    if (JS_BUILTINS.has(id)) continue
    if (knownNames.has(id)) continue
    return false
  }
  return true
}

/** Emit mount() call that registers component, template, and hydrates. */
export function emitRegistrationAndHydration(
  lines: string[],
  ctx: ClientJsContext,
  _ir: ComponentIR
): void {
  const name = ctx.componentName

  lines.push(`}`)
  lines.push('')

  const propNamesForTemplate = new Set(ctx.propsParams.map((p) => p.name))

  // Build inlinable constants map and unsafe local names set (#343)
  // Local constants computed inside the component function are not available
  // at module scope where the mount() template callback executes.
  // We classify each constant as inlinable (can be substituted with its value)
  // or unsafe (cannot be used in templates).
  //
  // A constant is only inlinable if its value exclusively references:
  // - Props (via props.xxx or destructured prop names)
  // - Other component-local names (constants, signals, memos, functions)
  // - JavaScript built-in globals
  // File-scope variables (e.g., variant lookup Records) are NOT available in
  // the generated client JS module scope, so constants referencing them are unsafe.
  const inlinableConstants = new Map<string, string>()
  const unsafeLocalNames = new Set<string>()

  const signalGetters = new Set(ctx.signals.map(s => s.getter))
  const signalSetters = new Set(ctx.signals.map(s => s.setter))
  const memoNames = new Set(ctx.memos.map(m => m.name))

  // All identifiers known within the component function scope
  const componentScopeNames = new Set<string>()
  for (const c of ctx.localConstants) componentScopeNames.add(c.name)
  for (const s of ctx.signals) { componentScopeNames.add(s.getter); componentScopeNames.add(s.setter) }
  for (const m of ctx.memos) componentScopeNames.add(m.name)
  for (const f of ctx.localFunctions) componentScopeNames.add(f.name)
  for (const p of ctx.propsParams) componentScopeNames.add(p.name)
  if (ctx.propsObjectName) componentScopeNames.add(ctx.propsObjectName)

  // Local functions are not available at module scope
  for (const fn of ctx.localFunctions) {
    unsafeLocalNames.add(fn.name)
  }

  for (const constant of ctx.localConstants) {
    const trimmedValue = constant.value.trim()

    // Arrow functions cannot be inlined into templates
    if (trimmedValue.includes('=>')) {
      unsafeLocalNames.add(constant.name)
      continue
    }

    // Module-level constants (createContext, new WeakMap) are already at module scope
    if (/^createContext\b/.test(trimmedValue) || /^new WeakMap\b/.test(trimmedValue)) {
      continue
    }

    // Check if value references signals, setters, or memos (reactive data)
    let dependsOnReactive = false
    for (const sigName of signalGetters) {
      if (new RegExp(`\\b${sigName}\\b`).test(trimmedValue)) {
        dependsOnReactive = true
        break
      }
    }
    if (!dependsOnReactive) {
      for (const setterName of signalSetters) {
        if (new RegExp(`\\b${setterName}\\b`).test(trimmedValue)) {
          dependsOnReactive = true
          break
        }
      }
    }
    if (!dependsOnReactive) {
      for (const mName of memoNames) {
        if (new RegExp(`\\b${mName}\\b`).test(trimmedValue)) {
          dependsOnReactive = true
          break
        }
      }
    }

    if (dependsOnReactive) {
      unsafeLocalNames.add(constant.name)
      continue
    }

    // Check that the value only references known component-scope identifiers.
    // File-scope variables (Records, helper objects) are not available in the
    // client JS module scope where the template callback executes.
    if (!valueOnlyUsesKnownNames(trimmedValue, componentScopeNames)) {
      unsafeLocalNames.add(constant.name)
      continue
    }

    inlinableConstants.set(constant.name, stripTypeScriptSyntax(trimmedValue))
  }

  // Resolve chained references: replace constant names within values with resolved values
  let changed = true
  const maxIterations = inlinableConstants.size + 1
  let iteration = 0
  while (changed && iteration < maxIterations) {
    changed = false
    iteration++
    for (const [constName, constValue] of inlinableConstants) {
      let newValue = constValue
      for (const [otherName, otherValue] of inlinableConstants) {
        if (otherName === constName) continue
        const replaced = newValue.replace(new RegExp(`(?<!\\.)\\b${otherName}\\b`, 'g'), `(${otherValue})`)
        if (replaced !== newValue) {
          newValue = replaced
          changed = true
        }
      }
      if (newValue !== constValue) {
        inlinableConstants.set(constName, newValue)
      }
    }
  }

  // After resolution, demote any constant whose value still references an unsafe name
  const toRemove: string[] = []
  for (const [constName, constValue] of inlinableConstants) {
    for (const unsafeName of unsafeLocalNames) {
      if (new RegExp(`\\b${unsafeName}\\b`).test(constValue)) {
        toRemove.push(constName)
        break
      }
    }
  }
  for (const removeName of toRemove) {
    inlinableConstants.delete(removeName)
    unsafeLocalNames.add(removeName)
  }

  let templateArg = ''
  if (canGenerateStaticTemplate(_ir.root, propNamesForTemplate, inlinableConstants, unsafeLocalNames)) {
    const templateHtml = irToComponentTemplate(_ir.root, propNamesForTemplate, inlinableConstants)
    if (templateHtml) {
      templateArg = `, (props) => \`${templateHtml}\``
    }
  }

  lines.push(`mount('${name}', init${name}${templateArg})`)
}
