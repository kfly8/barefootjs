/**
 * BarefootJS JSX Compiler - Local Function Extractor
 */

import ts from 'typescript'
import type { SignalDeclaration, LocalFunction } from '../types'
import { createSourceFile, stripTypeAnnotations } from '../utils/helpers'
import { forEachVariableDeclaration, isComponentFunction } from './common'

/**
 * Extracts local functions defined within a component.
 * e.g., const handleToggle = (id) => { ... }
 *       const handleAdd = () => { ... }
 * Note: Signal declarations are excluded.
 * Note: TypeScript type annotations are stripped.
 *
 * @param source - Source code
 * @param filePath - File path
 * @param signals - Signal declarations (to exclude)
 * @param targetComponentName - Optional: specific component to extract functions from
 */
export function extractLocalFunctions(
  source: string,
  filePath: string,
  signals: SignalDeclaration[],
  targetComponentName?: string
): LocalFunction[] {
  const sourceFile = createSourceFile(source, filePath)

  const localFunctions: LocalFunction[] = []
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
              // Exclude signal declarations (const [count, setCount] = signal(0) is already processed separately)
              if (signalNames.has(name)) return
              // Exclude signal() calls
              if (ts.isCallExpression(decl.initializer) &&
                  ts.isIdentifier(decl.initializer.expression) &&
                  decl.initializer.expression.text === 'signal') return

              // If it's an arrow function or function expression
              if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                const tsCode = statement.getText(sourceFile)
                // Strip TypeScript type annotations
                const code = stripTypeAnnotations(tsCode)
                localFunctions.push({ name, code })
              }
            }
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return localFunctions
}
