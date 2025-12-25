/**
 * BarefootJS JSX Compiler - Module Constants Extractor
 */

import ts from 'typescript'
import type { ModuleConstant } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Extracts module-level constant declarations from source code.
 * Only extracts constants with literal values (numbers, strings, booleans).
 *
 * @example
 * const GRID_SIZE = 100       // extracted
 * const NAME = "hello"        // extracted
 * const ENABLED = true        // extracted
 * const fn = () => {}         // NOT extracted (not a literal)
 * let x = 1                   // NOT extracted (not const)
 */
export function extractModuleConstants(source: string, filePath: string): ModuleConstant[] {
  const sourceFile = createSourceFile(source, filePath)
  const constants: ModuleConstant[] = []

  // Only process top-level statements
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return

    // Check if it's a const declaration
    const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0
    if (!isConst) return

    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue

      // Only extract literal values
      if (ts.isNumericLiteral(decl.initializer) ||
          ts.isStringLiteral(decl.initializer) ||
          decl.initializer.kind === ts.SyntaxKind.TrueKeyword ||
          decl.initializer.kind === ts.SyntaxKind.FalseKeyword) {

        const name = decl.name.text
        const value = decl.initializer.getText(sourceFile)

        constants.push({
          name,
          value,
          code: `const ${name} = ${value}`
        })
      }
    }
  })

  return constants
}

/**
 * Checks if a constant is used in client-side code.
 *
 * Looks for references in:
 * - Local functions
 * - Event handlers
 * - Ref callbacks
 */
export function isConstantUsedInClientCode(
  constantName: string,
  localFunctions: Array<{ code: string }>,
  eventHandlers: string[],
  refCallbacks: string[]
): boolean {
  const pattern = new RegExp(`\\b${constantName}\\b`)

  // Check local functions
  for (const fn of localFunctions) {
    if (pattern.test(fn.code)) return true
  }

  // Check event handlers
  for (const handler of eventHandlers) {
    if (pattern.test(handler)) return true
  }

  // Check ref callbacks
  for (const callback of refCallbacks) {
    if (pattern.test(callback)) return true
  }

  return false
}
