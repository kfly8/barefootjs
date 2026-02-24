/**
 * BarefootJS Compiler - Client JS Generator
 *
 * Generates client-side JavaScript from Pure IR for hydration.
 */

import type { ComponentIR } from '../types'
import type { ClientJsContext } from './types'
import { collectElements } from './collect-elements'
import { generateInitFunction } from './generate-init'
import { collectUsedIdentifiers, collectUsedFunctions } from './identifiers'
import { valueReferencesReactiveData } from './prop-handling'

/** Public entry point: IR → client JS string. Returns '' if no client JS is needed. */
export function generateClientJs(ir: ComponentIR, siblingComponents?: string[]): string {
  const ctx = createContext(ir)
  collectElements(ir.root, ctx)

  if (!needsClientJs(ctx)) {
    return ''
  }

  return generateInitFunction(ir, ctx, siblingComponents)
}

/**
 * Pre-pass analysis: determine whether a component needs a client JS init function,
 * and which props the init function actually reads. This runs BEFORE the adapter
 * so the adapter can use the results to optimize bf-p serialization.
 */
export function analyzeClientNeeds(ir: ComponentIR): { needsInit: boolean; usedProps: string[] } {
  const ctx = createContext(ir)
  collectElements(ir.root, ctx)

  if (!needsClientJs(ctx)) {
    return { needsInit: false, usedProps: [] }
  }

  // Replicate the props-detection logic from generate-init.ts
  const usedIdentifiers = collectUsedIdentifiers(ctx)
  const usedFunctions = collectUsedFunctions(ctx)
  for (const fn of usedFunctions) {
    usedIdentifiers.add(fn)
  }

  const neededProps = new Set<string>()

  // Transitive props via constants
  for (const constant of ctx.localConstants) {
    if (usedIdentifiers.has(constant.name)) {
      const trimmedValue = constant.value.trim()
      if (/^createContext\b/.test(trimmedValue) || /^new WeakMap\b/.test(trimmedValue)) continue
      if (!trimmedValue.includes('=>') && constant.name !== 'props') {
        const refs = valueReferencesReactiveData(constant.value, ctx)
        for (const propName of refs.usedProps) {
          neededProps.add(propName)
        }
      }
    }
  }

  // Direct identifier matches
  for (const id of usedIdentifiers) {
    if (ctx.propsParams.some(p => p.name === id)) {
      neededProps.add(id)
    }
  }

  return { needsInit: true, usedProps: [...neededProps] }
}

/** Initialize an empty ClientJsContext from component IR metadata. */
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
    restPropsName: ir.metadata.restPropsName,

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
    providerSetups: [],
    restAttrElements: [],
  }
}

/** Return true if the context has any elements that require client-side hydration. */
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
    ctx.clientOnlyConditionals.length > 0 ||
    ctx.providerSetups.length > 0
  )
}
