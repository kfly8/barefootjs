/**
 * BarefootJS JSX Compiler - Module-Level Function Extractor
 *
 * Extracts helper functions defined at the module level (not inside components).
 * These functions are included in the client JS so they can be called by event handlers.
 */

import ts from 'typescript'
import type { LocalFunction } from '../types'
import { createSourceFile, stripTypeAnnotations } from '../utils/helpers'
import { isComponentFunction } from './common'

/**
 * Extracts module-level function declarations.
 * These are functions defined at the top level of the file, not inside any component.
 * e.g., function validateEmail(email: string): string { ... }
 *       const createField = (id: number) => { ... }
 *
 * @param source - Source code
 * @param filePath - File path
 */
export function extractModuleFunctions(
  source: string,
  filePath: string
): LocalFunction[] {
  const sourceFile = createSourceFile(source, filePath)

  const moduleFunctions: LocalFunction[] = []

  // Only process direct children of the source file (module level)
  for (const statement of sourceFile.statements) {
    // Function declarations: function validateEmail(...) { ... }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      // Skip component functions (PascalCase functions that likely return JSX)
      if (!isComponentFunction(statement)) {
        const name = statement.name.text
        const tsCode = statement.getText(sourceFile)
        const code = stripTypeAnnotations(tsCode)
        moduleFunctions.push({ name, code })
      }
    }

    // Variable declarations with arrow functions: const createField = () => { ... }
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            const name = decl.name.text
            // Skip if it looks like a component (PascalCase)
            if (/^[A-Z]/.test(name)) continue
            const tsCode = statement.getText(sourceFile)
            const code = stripTypeAnnotations(tsCode)
            moduleFunctions.push({ name, code })
          }
        }
      }
    }
  }

  return moduleFunctions
}
