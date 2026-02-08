/**
 * generateInitFunction orchestrator + generateElementRefs.
 */

import type { ComponentIR, ConstantInfo } from '../types'
import type { ClientJsContext } from './types'
import { stripTypeScriptSyntax } from './utils'
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
  emitReactivePropBindings,
  emitReactiveChildProps,
  emitRefCallbacks,
  emitEffectsAndOnMounts,
  emitProviderAndChildInits,
  emitRegistrationAndHydration,
} from './emit-init-sections'

export function generateInitFunction(_ir: ComponentIR, ctx: ClientJsContext, siblingComponents?: string[]): string {
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
  lines.push(MODULE_CONSTANTS_PLACEHOLDER)

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

  // Track module-level constants (createContext calls) that must be shared across components
  const moduleLevelConstants: ConstantInfo[] = []
  const moduleLevelConstantNames = new Set<string>()

  // Check all local constants - include ANY constant that is used in client-side code
  for (const constant of ctx.localConstants) {
    // Include constant if it's used (regardless of whether it depends on reactive data)
    if (usedIdentifiers.has(constant.name)) {
      const trimmedValue = constant.value.trim()

      // createContext() and new WeakMap() calls must be at module level —
      // createContext() creates a unique Symbol, new WeakMap() is an identity-based store.
      // Duplicating inside each component init would break cross-component sharing.
      if (/^createContext\b/.test(trimmedValue) || /^new WeakMap\b/.test(trimmedValue)) {
        moduleLevelConstants.push(constant)
        moduleLevelConstantNames.add(constant.name)
        continue
      }

      // Skip arrow functions - they're handled separately as event handlers
      // Skip constants named 'props' - the function parameter already provides props
      if (!trimmedValue.includes('=>') && constant.name !== 'props') {
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

  // Also check providerSetups — the context variable must be available at module level
  for (const provider of ctx.providerSetups) {
    if (!moduleLevelConstantNames.has(provider.contextName)) {
      // Find the createContext constant from localConstants (may not be in usedIdentifiers)
      const contextConstant = ctx.localConstants.find(
        (c) => c.name === provider.contextName && /^createContext\b/.test(c.value.trim())
      )
      if (contextConstant) {
        moduleLevelConstants.push(contextConstant)
        moduleLevelConstantNames.add(contextConstant.name)
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
  // =========================================================================

  // 1. Props extraction
  emitPropsExtraction(lines, ctx, neededProps, propsWithPropertyAccess, propsUsedAsLoopArrays)

  // Split constants into early (no signal/memo deps) and late (has signal/memo deps)
  const signalNames = new Set(ctx.signals.map(s => s.getter))
  const memoNames = new Set(ctx.memos.map(m => m.name))

  const earlyConstants: ConstantInfo[] = []
  const lateConstants: ConstantInfo[] = []
  for (const constant of neededConstants) {
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

  // 2. Early constants
  emitEarlyConstants(lines, earlyConstants)

  // 3. Signals, memos, controlled signals, late constants
  const controlledSignals: Array<{ signal: typeof ctx.signals[0]; propName: string }> = []
  for (const signal of ctx.signals) {
    const controlledPropName = getControlledPropName(signal, ctx.propsParams)
    if (controlledPropName) {
      controlledSignals.push({ signal, propName: controlledPropName })
    }
  }
  emitSignalsAndMemos(lines, ctx, controlledSignals, lateConstants)

  // 4. Functions and handlers
  emitFunctionsAndHandlers(lines, ctx, usedIdentifiers, outputConstants, usedFunctions, neededProps)

  // Element references
  const elementRefs = generateElementRefs(ctx)
  if (elementRefs) {
    lines.push(elementRefs)
    lines.push('')
  }

  // 5. Dynamic text updates
  emitDynamicTextUpdates(lines, ctx)

  // 6. Client-only expressions
  emitClientOnlyExpressions(lines, ctx)

  // 7. Reactive attribute updates
  emitReactiveAttributeUpdates(lines, ctx)

  // 8. Conditional updates
  emitConditionalUpdates(lines, ctx)

  // 9. Client-only conditionals
  emitClientOnlyConditionals(lines, ctx)

  // 10. Loop updates
  emitLoopUpdates(lines, ctx)

  // Collect conditional slot IDs for event/ref filtering
  const conditionalSlotIds = collectConditionalSlotIds(ctx)

  // 11. Event handlers
  emitEventHandlers(lines, ctx, conditionalSlotIds)

  // 12. Reactive prop bindings
  emitReactivePropBindings(lines, ctx)

  // 13. Reactive child props
  emitReactiveChildProps(lines, ctx)

  // 14. Ref callbacks
  emitRefCallbacks(lines, ctx, conditionalSlotIds)

  // 15. Effects and onMounts
  emitEffectsAndOnMounts(lines, ctx)

  // 16. Provider and child inits
  emitProviderAndChildInits(lines, ctx)

  // 17. Registration and hydration
  emitRegistrationAndHydration(lines, ctx, _ir)

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

  // Generate module-level constants (shared across components in the same file).
  // Uses `var` with nullish coalescing to allow safe re-declaration when multiple
  // components in the same file reference the same context.
  let moduleConstantsCode = ''
  if (moduleLevelConstants.length > 0) {
    const moduleConstantLines: string[] = []
    for (const constant of moduleLevelConstants) {
      const jsValue = stripTypeScriptSyntax(constant.value)
      moduleConstantLines.push(`var ${constant.name} = ${constant.name} ?? ${jsValue}`)
    }
    moduleConstantsCode = moduleConstantLines.join('\n') + '\n'
  }

  return generatedCode
    .replace(IMPORT_PLACEHOLDER, importLine)
    .replace(MODULE_CONSTANTS_PLACEHOLDER, moduleConstantsCode)
}

export function generateElementRefs(ctx: ClientJsContext): string {
  const regularSlots = new Set<string>()
  const componentSlots = new Set<string>()

  // Collect slot IDs that are inside conditionals (handled by insert()'s bindEvents)
  const conditionalSlotIds = collectConditionalSlotIds(ctx)

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

  const refLines: string[] = []

  // Regular element slots use data-bf
  // Use find() to also search sibling scopes (for fragment roots)
  for (const slotId of regularSlots) {
    refLines.push(`  const _${slotId} = find(__scope, '[data-bf="${slotId}"]')`)
  }

  // Component slots use data-bf-scope with parent's scope prefix
  // The component's rendered element has data-bf-scope="${parentScope}_${slotId}"
  // Use find() instead of querySelector() because the scope element itself might be the target
  // (e.g., when a component returns a child component directly without a wrapper)
  for (const slotId of componentSlots) {
    refLines.push(`  const _${slotId} = find(__scope, '[data-bf-scope$="_${slotId}"]')`)
  }

  return refLines.join('\n')
}
