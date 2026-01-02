/**
 * BarefootJS JSX Compiler - Local Variable Extractor
 *
 * Extracts local variable declarations from within component functions.
 * These are non-signal, non-function declarations that may be referenced
 * in dynamic attributes (e.g., class={`absolute ${placementClass}`}).
 */

import ts from 'typescript'
import type { SignalDeclaration, LocalVariable } from '../types'
import { createSourceFile, stripTypeAnnotations } from '../utils/helpers'
import { forEachVariableDeclaration, isComponentFunction } from './common'

/**
 * Extracts local variable declarations from within a component function.
 *
 * This extracts non-signal, non-function variable declarations that can be
 * used in dynamic attributes or other expressions.
 *
 * @example
 * ```tsx
 * function TooltipContent({ placement = 'top' }) {
 *   const placementClass = placementStyles[placement]  // extracted
 *   const arrowClass = getArrowClass(placement)        // extracted
 *   return <div class={`absolute ${placementClass}`}>...</div>
 * }
 * ```
 *
 * @param source - Source code
 * @param filePath - File path
 * @param signals - Signal declarations (to exclude)
 * @param targetComponentName - Optional: specific component to extract variables from
 * @returns Array of local variable declarations
 */
export function extractLocalVariables(
  source: string,
  filePath: string,
  signals: SignalDeclaration[],
  targetComponentName?: string
): LocalVariable[] {
  const sourceFile = createSourceFile(source, filePath)

  const localVariables: LocalVariable[] = []
  const signalNames = new Set(signals.flatMap(s => [s.getter, s.setter]))
  let found = false

  function visit(node: ts.Node) {
    if (found) return

    // Only explore within component functions
    if (isComponentFunction(node)) {
      // If targetComponentName is specified, only process that component
      if (targetComponentName && node.name.text !== targetComponentName) {
        // Skip this function and continue to siblings
      } else {
        found = true

        // Explore component function body
        if (node.body) {
          forEachVariableDeclaration(node.body, (decl, statement) => {
            if (ts.isIdentifier(decl.name) && decl.initializer) {
              const name = decl.name.text

              // Exclude signal declarations
              if (signalNames.has(name)) return

              // Exclude signal() and createSignal() calls
              if (ts.isCallExpression(decl.initializer) &&
                  ts.isIdentifier(decl.initializer.expression) &&
                  (decl.initializer.expression.text === 'signal' ||
                   decl.initializer.expression.text === 'createSignal')) return

              // Exclude createMemo() calls (handled by memo extraction)
              if (ts.isCallExpression(decl.initializer) &&
                  ts.isIdentifier(decl.initializer.expression) &&
                  decl.initializer.expression.text === 'createMemo') return

              // Exclude arrow functions and function expressions (handled by local-functions.ts)
              if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) return

              // Extract the variable declaration
              const tsCode = statement.getText(sourceFile)
              // Strip TypeScript type annotations
              const code = stripTypeAnnotations(tsCode)

              localVariables.push({ name, code })
            }
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return localVariables
}

/**
 * Checks if a local variable is used in dynamic attribute expressions.
 *
 * @param variableName - Name of the variable to check
 * @param dynamicExpressions - Array of dynamic attribute expressions
 * @returns true if the variable is referenced in any expression
 */
export function isLocalVariableUsedInDynamicAttrs(
  variableName: string,
  dynamicExpressions: string[]
): boolean {
  const pattern = new RegExp(`\\b${variableName}\\b`)
  return dynamicExpressions.some(expr => pattern.test(expr))
}
