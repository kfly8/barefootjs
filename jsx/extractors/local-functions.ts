/**
 * BarefootJS JSX Compiler - Local Function Extractor
 */

import ts from 'typescript'
import type { SignalDeclaration, LocalFunction } from '../types'
import { createSourceFile, isPascalCase, stripTypeAnnotations } from '../utils/helpers'

/**
 * Extracts local functions defined within a component.
 * e.g., const handleToggle = (id) => { ... }
 *       const handleAdd = () => { ... }
 * Note: Signal declarations are excluded.
 * Note: TypeScript type annotations are stripped.
 */
export function extractLocalFunctions(
  source: string,
  filePath: string,
  signals: SignalDeclaration[]
): LocalFunction[] {
  const sourceFile = createSourceFile(source, filePath)

  const localFunctions: LocalFunction[] = []
  const signalNames = new Set(signals.flatMap(s => [s.getter, s.setter]))

  function visit(node: ts.Node) {
    // Only explore within component functions
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      // Explore component function body
      if (node.body) {
        for (const statement of node.body.statements) {
          // Pattern: const handleToggle = (id) => { ... }
          if (ts.isVariableStatement(statement)) {
            for (const decl of statement.declarationList.declarations) {
              if (ts.isIdentifier(decl.name) && decl.initializer) {
                const name = decl.name.text
                // Exclude signal declarations (const [count, setCount] = signal(0) is already processed separately)
                if (signalNames.has(name)) continue
                // Exclude signal() calls
                if (ts.isCallExpression(decl.initializer) &&
                    ts.isIdentifier(decl.initializer.expression) &&
                    decl.initializer.expression.text === 'signal') continue

                // If it's an arrow function or function expression
                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                  const tsCode = statement.getText(sourceFile)
                  // Strip TypeScript type annotations
                  const code = stripTypeAnnotations(tsCode)
                  localFunctions.push({ name, code })
                }
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return localFunctions
}
