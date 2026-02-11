/**
 * Extracted output phases from generateInitFunction.
 * Each function appends to a lines[] array.
 */

import type { ComponentIR, ConstantInfo, SignalInfo } from '../types'
import { isBooleanAttr } from '../html-constants'
import type { ClientJsContext, ConditionalBranchEvent, ConditionalBranchRef } from './types'
import { stripTypeScriptSyntax, inferDefaultValue, toHtmlAttrName, toDomEventProp, wrapHandlerInBlock, buildChainedArrayExpr } from './utils'
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
  if (neededProps.size > 0 && !ctx.propsObjectName) {
    for (const propName of neededProps) {
      const prop = ctx.propsParams.find((p) => p.name === propName)
      const defaultVal = prop?.defaultValue
      if (defaultVal) {
        lines.push(`  const ${propName} = props.${propName} ?? ${defaultVal}`)
      } else if (propsUsedAsLoopArrays.has(propName)) {
        lines.push(`  const ${propName} = props.${propName} ?? []`)
      } else if (propsWithPropertyAccess.has(propName)) {
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
  for (const signal of ctx.signals) {
    let initialValue: string
    if (signal.initialValue.startsWith('props.')) {
      initialValue = `${signal.initialValue} ?? ${inferDefaultValue(signal.type)}`
    } else {
      const controlled = controlledSignals.find(c => c.signal === signal)
      if (controlled) {
        const prop = ctx.propsParams.find(p => p.name === controlled.propName)
        const defaultVal = prop?.defaultValue ?? inferDefaultValue(signal.type)
        initialValue = `props.${controlled.propName} ?? ${defaultVal}`
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
      lines.push(`    const __val = ${expr}`)
      for (const elem of normalElems) {
        lines.push(`    if (_${elem.slotId}) _${elem.slotId}.textContent = String(__val)`)
      }
      for (const elem of conditionalElems) {
        lines.push(`    const __el_${elem.slotId} = $(__scope, '${elem.slotId}')`)
        lines.push(`    if (__el_${elem.slotId}) __el_${elem.slotId}.textContent = String(__val)`)
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
      lines.push(`  createEffect(() => {`)
      lines.push(`    if (_${slotId}) {`)
      for (const attr of attrs) {
        const htmlAttrName = toHtmlAttrName(attr.attrName)
        if (htmlAttrName === 'value') {
          lines.push(`      const __val = String(${attr.expression})`)
          lines.push(`      if (_${slotId}.value !== __val) _${slotId}.value = __val`)
        } else if (isBooleanAttr(htmlAttrName)) {
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
    lines.push(`      const _${slotId} = $(__branchScope, '${slotId}')`)
  }

  for (const [slotId, slotEvents] of eventsBySlot) {
    for (const event of slotEvents) {
      const wrappedHandler = wrapHandlerInBlock(event.handler)
      lines.push(`      if (_${slotId}) _${slotId}.${eventPropFn(event.eventName)} = ${wrappedHandler}`)
    }
  }

  for (const ref of refs) {
    lines.push(`      if (_${ref.slotId}) (${ref.callback})(_${ref.slotId})`)
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
        lines.push(`  // Initialize static array children (hydrate skips nested instances)`)
        lines.push(`  if (_${elem.slotId}) {`)
        lines.push(`    const __childScopes = _${elem.slotId}.querySelectorAll('[bf-s^="~${name}_"]:not([bf-h]), [bf-s^="${name}_"]:not([bf-h])')`)
        lines.push(`    __childScopes.forEach((childScope, __idx) => {`)
        lines.push(`      const __childProps = ${elem.array}[__idx] || {}`)
        lines.push(`      initChild('${name}', childScope, __childProps)`)
        lines.push(`    })`)
        lines.push(`  }`)
        lines.push('')
      }

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

          const selector = comp.slotId
            ? `[bf-s$="_${comp.slotId}"]:not([bf-h])`
            : `[bf-s^="~${comp.name}_"]:not([bf-h]), [bf-s^="${comp.name}_"]:not([bf-h])`

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
      const { name, props } = elem.childComponent
      const propsEntries = props.map((p) => {
        if (p.isEventHandler) {
          return `${p.name}: ${p.value}`
        } else if (p.isLiteral) {
          return `get ${p.name}() { return ${JSON.stringify(p.value)} }`
        } else {
          return `get ${p.name}() { return ${p.value} }`
        }
      })
      const propsExpr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : '{}'
      const keyExpr = elem.key || '__idx'
      const indexParam = elem.index || '__idx'

      const chainedExpr = buildChainedArrayExpr(elem)

      lines.push(`  createEffect(() => {`)
      lines.push(`    reconcileList(_${elem.slotId}, ${chainedExpr}, ${keyFn}, (${elem.param}, ${indexParam}) =>`)
      lines.push(`      createComponent('${name}', ${propsExpr}, ${keyExpr})`)
      lines.push(`    )`)
      lines.push(`  })`)
    } else {
      const chainedExprTemplate = buildChainedArrayExpr(elem)

      const indexParamTemplate = elem.index || '__idx'
      lines.push(`  createEffect(() => {`)
      lines.push(`    const __arr = ${chainedExprTemplate}`)
      lines.push(`    reconcileList(_${elem.slotId}, __arr, ${keyFn}, (${elem.param}, ${indexParamTemplate}) => \`${elem.template}\`)`)
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

      for (const [eventName, events] of eventsByName) {
        lines.push(`  if (_${elem.slotId}) _${elem.slotId}.${toDomEventProp(eventName)} = (e) => {`)
        lines.push(`    const target = e.target`)
        for (const ev of events) {
          lines.push(`    const ${ev.childSlotId}El = target.closest('[bf="${ev.childSlotId}"]')`)
          lines.push(`    if (${ev.childSlotId}El) {`)
          const handlerCall = ev.handler.trim().startsWith('(') || ev.handler.trim().startsWith('function')
            ? `(${ev.handler})()`
            : ev.handler
          if (elem.key) {
            const keyWithItem = elem.key.replace(new RegExp(`\\b${elem.param}\\b`, 'g'), 'item')
            lines.push(`      const li = ${ev.childSlotId}El.closest('[key]')`)
            lines.push(`      if (li) {`)
            lines.push(`        const key = li.getAttribute('key')`)
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
        lines.push(`  }`)
        lines.push('')
      }
    }
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
        lines.push(`  if (_${elem.slotId}) _${elem.slotId}.${eventProp} = ${wrappedHandler}`)
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
      lines.push(`    if (_${slotId}) {`)
      for (const prop of props) {
        const value = `${prop.expression}()`
        if (prop.propName === 'selected') {
          if (prop.componentName === 'TabsContent') {
            lines.push(`      _${slotId}.setAttribute('data-state', ${value} ? 'active' : 'inactive')`)
            lines.push(`      if (${value}) {`)
            lines.push(`        _${slotId}.classList.remove('hidden')`)
            lines.push(`      } else {`)
            lines.push(`        _${slotId}.classList.add('hidden')`)
            lines.push(`      }`)
          } else {
            lines.push(`      _${slotId}.setAttribute('aria-selected', String(${value}))`)
            lines.push(`      _${slotId}.setAttribute('data-state', ${value} ? 'active' : 'inactive')`)
            lines.push(`      if (${value}) {`)
            lines.push(`        _${slotId}.classList.remove('text-muted-foreground', 'hover:text-foreground', 'hover:bg-background/50')`)
            lines.push(`        _${slotId}.classList.add('bg-background', 'text-foreground', 'shadow-sm')`)
            lines.push(`      } else {`)
            lines.push(`        _${slotId}.classList.add('text-muted-foreground', 'hover:text-foreground', 'hover:bg-background/50')`)
            lines.push(`        _${slotId}.classList.remove('bg-background', 'text-foreground', 'shadow-sm')`)
            lines.push(`      }`)
          }
        } else {
          lines.push(`      _${slotId}.setAttribute('${prop.propName}', String(${value}))`)
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
      const varSuffix = first.slotId ? first.slotId.replace(/-/g, '_') : first.componentName
      const varName = `__${first.componentName}_${varSuffix}El`
      const selectorBase = first.slotId
        ? `$c(__scope, '${first.slotId}')`
        : `$c(__scope, '${first.componentName}')`
      lines.push(`    const ${varName} = ${selectorBase}`)
      lines.push(`    if (${varName}) {`)
      for (const prop of props) {
        if (prop.attrName === 'class') {
          lines.push(`      ${varName}.setAttribute('class', ${prop.expression})`)
        } else {
          lines.push(`      ${varName}.setAttribute('${prop.attrName}', ${prop.expression})`)
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
    lines.push(`  if (_${elem.slotId}) (${elem.callback})(_${elem.slotId})`)
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
      lines.push(`  provideContext(${provider.contextName}, ${provider.valueExpr})`)
    }
  }

  if (ctx.childInits.length > 0) {
    lines.push('')
    lines.push(`  // Initialize child components with props`)
    for (const child of ctx.childInits) {
      const slotVar = child.slotId ? `_${child.slotId}` : '__scope'
      lines.push(`  initChild('${child.name}', ${slotVar}, ${child.propsExpr})`)
    }
  }
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
  let templateArg = ''
  if (canGenerateStaticTemplate(_ir.root, propNamesForTemplate)) {
    const templateHtml = irToComponentTemplate(_ir.root, propNamesForTemplate)
    if (templateHtml) {
      templateArg = `, (props) => \`${templateHtml}\``
    }
  }

  lines.push(`mount('${name}', init${name}${templateArg})`)
}
