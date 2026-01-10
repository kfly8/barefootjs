/**
 * BarefootJS JSX Compiler - Import Extractor
 */

import ts from 'typescript'
import type { ComponentImport } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Represents an external package import (non-local)
 */
export interface ExternalImport {
  /** The full import statement code */
  code: string
  /** The module path (e.g., 'class-variance-authority') */
  path: string
  /** Imported names (for dependency tracking) */
  names: string[]
}

/**
 * Extracts import statements from file (local imports only - for component resolution)
 *
 * Note: Type-only imports (import type { ... }) are skipped because they don't
 * represent actual component dependencies and shouldn't affect Server/Client boundaries.
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

          // Skip type-only imports: import type { ... } from '...'
          if (importClause?.isTypeOnly) {
            return
          }

          if (importClause?.name) {
            // default import: import Counter from './Counter'
            imports.push({
              name: importClause.name.getText(sourceFile),
              path,
              isDefault: true,
            })
          }
          // named imports: import { Counter } from './Counter'
          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            for (const element of importClause.namedBindings.elements) {
              // Skip individual type-only imports: import { type Foo } from '...'
              if (element.isTypeOnly) {
                continue
              }
              imports.push({
                name: element.name.getText(sourceFile),
                path,
                isDefault: false,
              })
            }
          }
        }
      }
    }
  })

  return imports
}

/**
 * Extracts external package imports (non-local imports)
 * These are imports from npm packages.
 *
 * @example
 * import { myHelper } from 'some-package'
 * import { myUtil } from '../lib/utils'  // <- NOT extracted (local)
 */
export function extractExternalImports(source: string, filePath: string): ExternalImport[] {
  const sourceFile = createSourceFile(source, filePath)

  const imports: ExternalImport[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        const path = moduleSpecifier.text
        // External imports (NOT starting with ./ or ../)
        if (!path.startsWith('./') && !path.startsWith('../')) {
          // Skip special imports that are handled separately
          if (path === 'hono/jsx-renderer' || path === 'hono/jsx') {
            return
          }

          const names: string[] = []
          const importClause = node.importClause

          if (importClause?.name) {
            // default import
            names.push(importClause.name.getText(sourceFile))
          }
          if (importClause?.namedBindings) {
            if (ts.isNamedImports(importClause.namedBindings)) {
              for (const element of importClause.namedBindings.elements) {
                // Skip type-only imports
                if (!element.isTypeOnly) {
                  names.push(element.name.getText(sourceFile))
                }
              }
            } else if (ts.isNamespaceImport(importClause.namedBindings)) {
              // import * as name
              names.push(importClause.namedBindings.name.getText(sourceFile))
            }
          }

          // Only add if there are value imports (not just type imports)
          if (names.length > 0) {
            // Reconstruct import without type-only imports
            const code = reconstructImportCode(node, sourceFile)
            if (code) {
              imports.push({ code, path, names })
            }
          }
        }
      }
    }
  })

  return imports
}

/**
 * Reconstructs import code without type-only imports
 */
function reconstructImportCode(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): string | null {
  const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text
  const importClause = node.importClause

  if (!importClause) {
    // Side-effect import: import 'module'
    return `import '${moduleSpecifier}'`
  }

  const parts: string[] = []

  // Default import
  if (importClause.name) {
    parts.push(importClause.name.getText(sourceFile))
  }

  // Named imports
  if (importClause.namedBindings) {
    if (ts.isNamedImports(importClause.namedBindings)) {
      const valueImports = importClause.namedBindings.elements
        .filter(el => !el.isTypeOnly)
        .map(el => {
          if (el.propertyName) {
            return `${el.propertyName.getText(sourceFile)} as ${el.name.getText(sourceFile)}`
          }
          return el.name.getText(sourceFile)
        })

      if (valueImports.length > 0) {
        if (parts.length > 0) {
          parts.push(', ')
        }
        parts.push(`{ ${valueImports.join(', ')} }`)
      }
    } else if (ts.isNamespaceImport(importClause.namedBindings)) {
      if (parts.length > 0) {
        parts.push(', ')
      }
      parts.push(`* as ${importClause.namedBindings.name.getText(sourceFile)}`)
    }
  }

  if (parts.length === 0) {
    return null // Only type imports
  }

  return `import ${parts.join('')} from '${moduleSpecifier}'`
}
