/**
 * BarefootJS JSX Compiler - Module-Level Function Extractor
 *
 * Extracts helper functions defined at the module level (not inside components).
 * These functions are included in the client JS so they can be called by event handlers.
 *
 * Note: JSX-containing helper functions are SSR-only and not included in Client JS.
 * This is by design - BarefootJS updates DOM directly without re-rendering JSX on the client.
 */

import ts from 'typescript'
import type { LocalFunction } from '../types'
import {
  createSourceFile,
  stripTypeAnnotations,
  containsJsxInCode,
  stripTypeAnnotationsPreserveJsx,
} from '../utils/helpers'
import { isComponentFunction } from './common'

/**
 * Extracts module-level function declarations.
 * These are functions defined at the top level of the file, not inside any component.
 * e.g., function validateEmail(email: string): string { ... }
 *       const createField = (id: number) => { ... }
 *
 * JSX-containing functions are SSR-only:
 * - tsxCode is set for Marked JSX (SSR) output
 * - code is empty (not included in Client JS)
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
        const hasJsx = containsJsxInCode(tsCode)

        if (hasJsx) {
          // JSX-containing function: SSR-only (not included in Client JS)
          const tsxCode = stripTypeAnnotationsPreserveJsx(tsCode)
          moduleFunctions.push({ name, code: '', containsJsx: true, tsxCode })
        } else {
          // No JSX: included in both SSR and Client JS
          const code = stripTypeAnnotations(tsCode)
          moduleFunctions.push({ name, code, containsJsx: false })
        }
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
            const hasJsx = containsJsxInCode(tsCode)

            if (hasJsx) {
              // JSX-containing function: SSR-only (not included in Client JS)
              const tsxCode = stripTypeAnnotationsPreserveJsx(tsCode)
              moduleFunctions.push({ name, code: '', containsJsx: true, tsxCode })
            } else {
              // No JSX: included in both SSR and Client JS
              const code = stripTypeAnnotations(tsCode)
              moduleFunctions.push({ name, code, containsJsx: false })
            }
          }
        }
      }
    }
  }

  return moduleFunctions
}
