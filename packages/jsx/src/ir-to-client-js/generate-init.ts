/**
 * generateInitFunction orchestrator + generateElementRefs.
 */

import type { ComponentIR, ConstantInfo, IRNode } from '../types'
import type { ClientJsContext } from './types'
import { varSlotId } from './utils'
import { collectUsedIdentifiers, collectUsedFunctions } from './identifiers'
import { valueReferencesReactiveData, getControlledPropName, detectPropsWithPropertyAccess } from './prop-handling'
import { IMPORT_PLACEHOLDER, MODULE_CONSTANTS_PLACEHOLDER, detectUsedImports, collectUserDomImports } from './imports'
import {
  collectConditionalSlotIds,
  emitPropsExtraction,
  emitEarlyConstants,
  emitSignalsAndMemos,
  emitFunctionsAndHandlers,
  emitDynamicTextUpdates,
  emitClientOnlyExpressions,
  emitReactiveAttributeUpdates,
  emitConditionalUpdates,
  emitClientOnlyConditionals,
  emitLoopUpdates,
  emitEventHandlers,
  emitRestAttrApplications,
  emitReactivePropBindings,
  emitReactiveChildProps,
  emitRefCallbacks,
  emitEffectsAndOnMounts,
  emitProviderAndChildInits,
  emitRegistrationAndHydration,
} from './emit-init-sections'

/**
 * Orchestrate client JS code generation: analyze dependencies, emit code sections,
 * and resolve imports. Returns the complete init function + registration code.
 */
export function generateInitFunction(_ir: ComponentIR, ctx: ClientJsContext, siblingComponents?: string[]): string {
  const lines: string[] = []
  const name = ctx.componentName

  lines.push(IMPORT_PLACEHOLDER)

  // Child component imports (skip siblings in the same file)
  const siblingSet = new Set(siblingComponents || [])
  const childComponentNames = new Set<string>()
  for (const loop of ctx.loopElements) {
    if (loop.childComponent) {
      childComponentNames.add(loop.childComponent.name)
      collectComponentNamesFromIR(loop.childComponent.children, childComponentNames)
    }
  }
  for (const child of ctx.childInits) {
    childComponentNames.add(child.name)
  }
  for (const childName of childComponentNames) {
    if (!siblingSet.has(childName)) {
      lines.push(`import '/* @bf-child:${childName} */'`)
    }
  }

  lines.push('')
  lines.push(MODULE_CONSTANTS_PLACEHOLDER)

  lines.push(`export function init${name}(__scope, props = {}) {`)
  lines.push(`  if (!__scope) return`)
  lines.push('')

  // --- Analysis: collect used identifiers and determine dependencies ---

  const usedIdentifiers = collectUsedIdentifiers(ctx)
  const usedFunctions = collectUsedFunctions(ctx)
  for (const fn of usedFunctions) {
    usedIdentifiers.add(fn)
  }

  const neededProps = new Set<string>()
  const neededConstants: ConstantInfo[] = []
  const outputConstants = new Set<string>()
  const moduleLevelConstants: ConstantInfo[] = []
  const moduleLevelConstantNames = new Set<string>()

  for (const constant of ctx.localConstants) {
    if (usedIdentifiers.has(constant.name)) {
      if (!constant.value) {
        // `let x` with no initializer — always needed, no module-level hoist
        neededConstants.push(constant)
        outputConstants.add(constant.name)
        continue
      }

      const trimmedValue = constant.value.trim()

      // createContext() and new WeakMap() must be at module level to enable
      // cross-component sharing (unique Symbol / identity-based store)
      if (/^createContext\b/.test(trimmedValue) || /^new WeakMap\b/.test(trimmedValue)) {
        moduleLevelConstants.push(constant)
        moduleLevelConstantNames.add(constant.name)
        continue
      }

      // Arrow functions handled separately; 'props' provided by function parameter
      if (!trimmedValue.includes('=>') && constant.name !== 'props') {
        neededConstants.push(constant)
        outputConstants.add(constant.name)

        const refs = valueReferencesReactiveData(constant.value, ctx)
        for (const propName of refs.usedProps) {
          neededProps.add(propName)
        }
      }
    }
  }

  // Ensure context variables used by providers are at module level
  for (const provider of ctx.providerSetups) {
    if (!moduleLevelConstantNames.has(provider.contextName)) {
      const contextConstant = ctx.localConstants.find(
        (c) => c.name === provider.contextName && c.value && /^createContext\b/.test(c.value.trim())
      )
      if (contextConstant) {
        moduleLevelConstants.push(contextConstant)
        moduleLevelConstantNames.add(contextConstant.name)
      }
    }
  }

  for (const id of usedIdentifiers) {
    if (ctx.propsParams.some((p) => p.name === id)) {
      neededProps.add(id)
    }
  }

  const propsWithPropertyAccess = detectPropsWithPropertyAccess(ctx, neededConstants)

  const propsUsedAsLoopArrays = new Set<string>()
  for (const loop of ctx.loopElements) {
    const arrayName = loop.array.trim()
    if (ctx.propsParams.some((p) => p.name === arrayName)) {
      propsUsedAsLoopArrays.add(arrayName)
    }
  }

  // --- Output: generate code in correct order ---

  emitPropsExtraction(lines, ctx, neededProps, propsWithPropertyAccess, propsUsedAsLoopArrays)

  // Split constants into early (no signal/memo deps) and late (has signal/memo deps)
  const signalNames = new Set(ctx.signals.map(s => s.getter))
  const memoNames = new Set(ctx.memos.map(m => m.name))

  const earlyConstants: ConstantInfo[] = []
  const lateConstants: ConstantInfo[] = []
  for (const constant of neededConstants) {
    if (!constant.value) {
      // No initializer (e.g. `let x`) — classify as early (no reactive deps)
      earlyConstants.push(constant)
      continue
    }
    const value = constant.value
    let dependsOnReactive = false
    for (const sigName of signalNames) {
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

  emitEarlyConstants(lines, earlyConstants)

  // Emit functions/handlers before signals so that signal initializers can
  // reference local functions (e.g. `createSignal(toArray(props.x))`).
  // Arrow-function bodies are lazy and don't depend on signals at definition time. (#365)
  emitFunctionsAndHandlers(lines, ctx, usedIdentifiers, outputConstants, usedFunctions, neededProps)

  const controlledSignals: Array<{ signal: typeof ctx.signals[0]; propName: string }> = []
  for (const signal of ctx.signals) {
    const controlledPropName = getControlledPropName(signal, ctx.propsParams, ctx.propsObjectName)
    if (controlledPropName) {
      controlledSignals.push({ signal, propName: controlledPropName })
    }
  }
  emitSignalsAndMemos(lines, ctx, controlledSignals, lateConstants)

  const elementRefs = generateElementRefs(ctx)
  if (elementRefs) {
    lines.push(elementRefs)
    lines.push('')
  }

  emitDynamicTextUpdates(lines, ctx)
  emitClientOnlyExpressions(lines, ctx)
  emitReactiveAttributeUpdates(lines, ctx)
  emitConditionalUpdates(lines, ctx)
  emitClientOnlyConditionals(lines, ctx)
  emitLoopUpdates(lines, ctx)

  const conditionalSlotIds = collectConditionalSlotIds(ctx)

  emitRestAttrApplications(lines, ctx)
  emitEventHandlers(lines, ctx, conditionalSlotIds)
  emitReactivePropBindings(lines, ctx)
  emitReactiveChildProps(lines, ctx)
  emitRefCallbacks(lines, ctx, conditionalSlotIds)
  emitEffectsAndOnMounts(lines, ctx)
  emitProviderAndChildInits(lines, ctx)
  emitRegistrationAndHydration(lines, ctx, _ir)

  const generatedCode = lines.join('\n')
  const usedImports = detectUsedImports(generatedCode)

  for (const userImport of collectUserDomImports(_ir)) {
    usedImports.add(userImport)
  }

  const sortedImports = [...usedImports].sort()
  const importLine = `import { ${sortedImports.join(', ')} } from '@barefootjs/dom'`

  // Module-level constants use `var` with nullish coalescing for safe
  // re-declaration when multiple components in the same file share context
  let moduleConstantsCode = ''
  if (moduleLevelConstants.length > 0) {
    const moduleConstantLines: string[] = []
    for (const constant of moduleLevelConstants) {
      if (!constant.value) continue
      moduleConstantLines.push(`var ${constant.name} = ${constant.name} ?? ${constant.value}`)
    }
    moduleConstantsCode = moduleConstantLines.join('\n') + '\n'
  }

  return generatedCode
    .replace(IMPORT_PLACEHOLDER, importLine)
    .replace(MODULE_CONSTANTS_PLACEHOLDER, moduleConstantsCode)
}

/**
 * Generate `const _slotId = find(...)` declarations for all elements
 * that need direct DOM references (events, dynamic text, loops, etc.).
 */
export function generateElementRefs(ctx: ClientJsContext): string {
  const regularSlots = new Set<string>()
  const textSlots = new Set<string>()
  const componentSlots = new Set<string>()
  const conditionalSlotIds = collectConditionalSlotIds(ctx)

  for (const elem of ctx.interactiveElements) {
    if (elem.slotId !== '__scope' && !conditionalSlotIds.has(elem.slotId)) {
      if (elem.isComponentSlot) {
        componentSlots.add(elem.slotId)
      } else {
        regularSlots.add(elem.slotId)
      }
    }
  }
  // Dynamic text expressions use comment markers found via $t()
  for (const elem of ctx.dynamicElements) {
    if (!elem.insideConditional) {
      textSlots.add(elem.slotId)
    }
  }
  for (const elem of ctx.conditionalElements) {
    regularSlots.add(elem.slotId)
  }
  for (const elem of ctx.loopElements) {
    regularSlots.add(elem.slotId)
  }
  for (const elem of ctx.refElements) {
    if (!conditionalSlotIds.has(elem.slotId)) {
      regularSlots.add(elem.slotId)
    }
  }
  for (const attr of ctx.reactiveAttrs) {
    regularSlots.add(attr.slotId)
  }
  for (const prop of ctx.reactiveProps) {
    componentSlots.add(prop.slotId)
  }
  for (const child of ctx.childInits) {
    if (child.slotId) {
      componentSlots.add(child.slotId)
    }
  }
  for (const rest of ctx.restAttrElements) {
    regularSlots.add(rest.slotId)
  }

  // Component slots take precedence over regular slots (#360).
  // When a component contains a loop that inherits the component's slot ID
  // (via propagateSlotIdToLoops), both need the same DOM element reference.
  // Component elements use bf-s attributes, so $c() is the correct selector.
  for (const slotId of componentSlots) {
    regularSlots.delete(slotId)
  }

  if (regularSlots.size === 0 && textSlots.size === 0 && componentSlots.size === 0) return ''

  const refLines: string[] = []

  // Regular element slots use $() shorthand for find(scope, '[bf="id"]')
  for (const slotId of regularSlots) {
    refLines.push(`  const _${varSlotId(slotId)} = $(__scope, '${slotId}')`)
  }

  // Text slots use $t() to find Text nodes via comment markers <!--bf:id-->
  for (const slotId of textSlots) {
    refLines.push(`  const _${varSlotId(slotId)} = $t(__scope, '${slotId}')`)
  }

  // Component slots use $c() shorthand for find(scope, '[bf-s$="_id"]')
  for (const slotId of componentSlots) {
    refLines.push(`  const _${varSlotId(slotId)} = $c(__scope, '${slotId}')`)
  }

  return refLines.join('\n')
}

/**
 * Recursively collect component names from IR children.
 * Used to ensure all nested components are imported.
 */
function collectComponentNamesFromIR(nodes: IRNode[], names: Set<string>): void {
  for (const node of nodes) {
    if (node.type === 'component') {
      names.add(node.name)
      collectComponentNamesFromIR(node.children, names)
    } else if (node.type === 'element' || node.type === 'fragment' || node.type === 'provider') {
      collectComponentNamesFromIR(node.children, names)
    } else if (node.type === 'conditional') {
      collectComponentNamesFromIR([node.whenTrue], names)
      collectComponentNamesFromIR([node.whenFalse], names)
    }
  }
}
