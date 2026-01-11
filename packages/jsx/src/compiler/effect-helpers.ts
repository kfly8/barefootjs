/**
 * Effect generation helpers
 *
 * Unified helper functions for generating client-side JavaScript effect code.
 * These helpers abstract common patterns used across different effect generators.
 */

/**
 * Options for generateScopedElementFinder
 */
export interface ScopedElementFinderOptions {
  /** Variable name to assign the element to */
  varName: string
  /** Element ID for data-bf selector */
  elementId: string
  /** Path from __scope (null/undefined means use __findInScope) */
  path: string | null | undefined
}

/**
 * Generate code to find an element using path-based navigation or scoped finder.
 *
 * When path is known, uses direct property access: `__scope?.path`
 * When path is null/undefined, uses scoped finder: `find(__scope, '[data-bf="id"]')`
 *
 * @example
 * generateScopedElementFinder({ varName: '_el1', elementId: 'el1', path: 'firstChild' })
 * // → 'const _el1 = __scope?.firstChild'
 *
 * generateScopedElementFinder({ varName: '_el1', elementId: 'el1', path: null })
 * // → 'const _el1 = find(__scope, \'[data-bf="el1"]\')'
 */
export function generateScopedElementFinder(options: ScopedElementFinderOptions): string {
  const { varName, elementId, path } = options

  if (path !== undefined && path !== null) {
    // Use path-based navigation when path is known and reliable
    const accessCode = path === '' ? '__scope' : `__scope?.${path}`
    return `const ${varName} = ${accessCode}`
  } else {
    // Fallback to scoped finder for elements with null paths (inside conditionals, after components)
    // Uses find() from @barefootjs/dom to exclude elements inside nested data-bf-scope components
    return `const ${varName} = find(__scope, '[data-bf="${elementId}"]')`
  }
}

/**
 * Options for generateEffectWithPreCheck
 */
export interface EffectWithPreCheckOptions {
  /** Variable name of the element to check */
  varName: string
  /** Code to execute inside createEffect */
  effectBody: string
}

/**
 * Generate createEffect with existence check BEFORE the effect (Pattern A).
 *
 * This pattern is used when the element is pre-queried and we want to skip
 * the entire effect if the element doesn't exist.
 *
 * @example
 * generateEffectWithPreCheck({ varName: '_el1', effectBody: '_el1.textContent = value' })
 * // → [
 * //   'if (_el1) {',
 * //   '  createEffect(() => {',
 * //   '    _el1.textContent = value',
 * //   '  })',
 * //   '}'
 * // ]
 */
export function generateEffectWithPreCheck(options: EffectWithPreCheckOptions): string[] {
  const { varName, effectBody } = options
  const lines: string[] = []

  lines.push(`if (${varName}) {`)
  lines.push(`  createEffect(() => {`)

  // Indent each line of the effect body
  for (const line of effectBody.split('\n')) {
    lines.push(`    ${line}`)
  }

  lines.push(`  })`)
  lines.push(`}`)

  return lines
}

/**
 * Options for generateEffectWithInnerFinder
 */
export interface EffectWithInnerFinderOptions {
  /** Variable name to assign the element to */
  varName: string
  /** Element ID for data-bf selector */
  elementId: string
  /** Path from __scope (null/undefined means use __findInScope) */
  path: string | null | undefined
  /** Code to execute after element check */
  effectBody: string
  /** Optional code to evaluate BEFORE element check (for signal dependency tracking) */
  evaluateFirst?: string
}

/**
 * Generate createEffect that finds element inside and checks existence (Pattern B).
 *
 * This pattern is used when we need to:
 * 1. Find the element inside the effect (for dynamic paths)
 * 2. Evaluate expressions BEFORE checking element existence (for signal tracking)
 *
 * @example
 * generateEffectWithInnerFinder({
 *   varName: '_el1',
 *   elementId: 'el1',
 *   path: 'firstChild',
 *   effectBody: '_el1.textContent = String(__textValue)',
 *   evaluateFirst: 'const __textValue = count()'
 * })
 * // → [
 * //   'createEffect(() => {',
 * //   '  const _el1 = __scope?.firstChild',
 * //   '  const __textValue = count()',
 * //   '  if (_el1) {',
 * //   '    _el1.textContent = String(__textValue)',
 * //   '  }',
 * //   '})'
 * // ]
 */
export function generateEffectWithInnerFinder(options: EffectWithInnerFinderOptions): string[] {
  const { varName, elementId, path, effectBody, evaluateFirst } = options
  const lines: string[] = []

  lines.push(`createEffect(() => {`)

  // Find element
  const finderCode = generateScopedElementFinder({ varName, elementId, path })
  lines.push(`  ${finderCode}`)

  // Evaluate expression first (for signal dependency tracking)
  if (evaluateFirst) {
    for (const line of evaluateFirst.split('\n')) {
      lines.push(`  ${line}`)
    }
  }

  // Check element existence and execute body
  lines.push(`  if (${varName}) {`)
  for (const line of effectBody.split('\n')) {
    lines.push(`    ${line}`)
  }
  lines.push(`  }`)

  lines.push(`})`)

  return lines
}
