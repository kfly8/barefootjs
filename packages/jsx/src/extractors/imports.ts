/**
 * BarefootJS JSX Compiler - Import Extractor
 */

import ts from 'typescript'
import type { ComponentImport } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Extracts import statements from file
 */
export function extractImports(source: string, filePath: string): ComponentImport[] {
  const sourceFile = createSourceFile(source, filePath)

  const imports: ComponentImport[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        const path = moduleSpecifier.text
        // Only local imports (starting with ./)
        if (path.startsWith('./') || path.startsWith('../')) {
          const importClause = node.importClause
          if (importClause?.name) {
            // default import: import Counter from './Counter'
            imports.push({
              name: importClause.name.getText(sourceFile),
              path,
            })
          }
        }
      }
    }
  })

  return imports
}
