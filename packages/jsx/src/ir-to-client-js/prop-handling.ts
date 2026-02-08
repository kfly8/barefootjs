/**
 * Props expansion, dependency analysis, and controlled component detection.
 */

import type { ConstantInfo, ParamInfo, SignalInfo } from '../types'
import type { ClientJsContext } from './types'

/**
 * Expand dynamic prop value by resolving local constants.
 *
 * Per spec/compiler.md, no prop reference transformation is needed:
 * - Destructured props are captured once at hydration, used as-is
 * - Props object already uses props.xxx syntax
 */
export function expandDynamicPropValue(value: string, ctx: ClientJsContext): string {
  const trimmedValue = value.trim()

  // Check if value is a simple identifier that matches a local constant
  const constant = ctx.localConstants.find((c) => c.name === trimmedValue)
  if (constant) {
    // Expand the constant's value
    return constant.value
  }

  // Return value as-is (no transformation needed per spec)
  return value
}

/**
 * Check if a value references reactive data (props, signals, or memos).
 */
export function valueReferencesReactiveData(
  value: string,
  ctx: ClientJsContext
): { usesProps: boolean; usedProps: string[]; usesSignals: boolean; usesMemos: boolean } {
  const usedProps: string[] = []
  let usesSignals = false
  let usesMemos = false

  // Check for props references
  for (const prop of ctx.propsParams) {
    const pattern = new RegExp(`\\b${prop.name}\\b`)
    if (pattern.test(value)) {
      usedProps.push(prop.name)
    }
  }

  // Check for signal getter calls
  for (const signal of ctx.signals) {
    const pattern = new RegExp(`\\b${signal.getter}\\s*\\(`)
    if (pattern.test(value)) {
      usesSignals = true
    }
  }

  // Check for memo calls
  for (const memo of ctx.memos) {
    const pattern = new RegExp(`\\b${memo.name}\\s*\\(`)
    if (pattern.test(value)) {
      usesMemos = true
    }
  }

  return {
    usesProps: usedProps.length > 0,
    usedProps,
    usesSignals,
    usesMemos,
  }
}

/**
 * Check if a signal is initialized from a prop value (controlled signal pattern).
 * Returns the prop name if the signal's initial value references a prop, null otherwise.
 *
 * Detects patterns like:
 *   const [controlledChecked, setControlledChecked] = createSignal(props.checked)
 *   const [controlledValue, setControlledValue] = createSignal(value)
 *
 * These signals need a createEffect to sync with parent's prop changes.
 *
 * Note: Props starting with "default" (e.g., defaultChecked, defaultValue) are
 * excluded as they are initial values, not controlled props.
 */
export function getControlledPropName(
  signal: SignalInfo,
  propsParams: ParamInfo[]
): string | null {
  const initialValue = signal.initialValue.trim()

  // Helper to check if prop is a "default*" prop (initial value, not controlled)
  const isDefaultProp = (propName: string) => propName.startsWith('default')

  // Pattern 1: Direct props.X reference
  // e.g., props.checked
  const propsMatch = initialValue.match(/^props\.(\w+)$/)
  if (propsMatch) {
    const propName = propsMatch[1]
    // Verify it's actually a prop and not a default* prop
    if (propsParams.some((p) => p.name === propName) && !isDefaultProp(propName)) {
      return propName
    }
  }

  // Pattern 2: Simple prop name (will be a prop parameter)
  // e.g., checked in createSignal(checked)
  // Note: This only matches simple identifiers, not function calls
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(initialValue)) {
    if (propsParams.some((p) => p.name === initialValue) && !isDefaultProp(initialValue)) {
      return initialValue
    }
  }

  // Pattern 3: Prop with nullish coalescing
  // e.g., checked ?? false, value ?? ""
  const nullishMatch = initialValue.match(/^(\w+)\s*\?\?\s*.+$/)
  if (nullishMatch) {
    const propName = nullishMatch[1]
    if (propsParams.some((p) => p.name === propName) && !isDefaultProp(propName)) {
      return propName
    }
  }

  return null
}

/**
 * Detect props that are used with property access (e.g., highlightedCommands.pnpm).
 * These props need a default value of {} to avoid "cannot read properties of undefined".
 */
export function detectPropsWithPropertyAccess(
  ctx: ClientJsContext,
  neededConstants: ConstantInfo[]
): Set<string> {
  const result = new Set<string>()

  // Collect all source code that might reference props with property access
  const sources: string[] = []

  // From conditional templates
  for (const elem of ctx.conditionalElements) {
    sources.push(elem.whenTrueHtml)
    sources.push(elem.whenFalseHtml)
    sources.push(elem.condition)
  }

  // From loop templates
  for (const elem of ctx.loopElements) {
    sources.push(elem.template)
  }

  // From dynamic expressions
  for (const elem of ctx.dynamicElements) {
    sources.push(elem.expression)
  }

  // From needed constants
  for (const constant of neededConstants) {
    sources.push(constant.value)
  }

  // Check each prop for property access pattern
  for (const prop of ctx.propsParams) {
    // Look for patterns like: propName.something or propName['something']
    const dotPattern = new RegExp(`\\b${prop.name}\\.[a-zA-Z_]`)
    const bracketPattern = new RegExp(`\\b${prop.name}\\s*\\[`)

    for (const source of sources) {
      if (dotPattern.test(source) || bracketPattern.test(source)) {
        result.add(prop.name)
        break
      }
    }
  }

  return result
}
