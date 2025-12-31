/**
 * BarefootJS JSX Compiler - Local Component Extractor
 *
 * Extracts component functions defined in the same file as the main component.
 * These are PascalCase functions that are used as JSX elements within the main component.
 */

import ts from 'typescript'
import { createSourceFile } from '../utils/helpers'
import { forEachComponentFunction, isComponentFunction } from './common'

export type LocalComponentFunction = {
  name: string      // ToggleItem
  source: string    // Full function source code
  startLine: number // Starting line number in the file
}

/**
 * Extracts local component functions from a source file.
 *
 * Finds all PascalCase function declarations that:
 * 1. Return JSX (contain JSX elements)
 * 2. Are NOT the main exported component (not default export)
 *
 * @param source - Source code
 * @param filePath - File path
 * @param mainComponentName - Name of the main component (to exclude)
 * @returns Array of local component functions
 */
export function extractLocalComponentFunctions(
  source: string,
  filePath: string,
  mainComponentName?: string
): LocalComponentFunction[] {
  const sourceFile = createSourceFile(source, filePath)
  const localComponents: LocalComponentFunction[] = []

  // Find the default exported component name
  let defaultExportName: string | null = null
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      // export default ComponentName
      if (ts.isIdentifier(node.expression)) {
        defaultExportName = node.expression.getText(sourceFile)
      }
    }
  })

  // If mainComponentName is provided, use it; otherwise use the detected default export
  const excludeName = mainComponentName || defaultExportName || undefined

  forEachComponentFunction(
    sourceFile,
    (component, name) => {
      // Check if this function returns JSX
      if (component.body && containsJsxReturn(component.body)) {
        const start = component.getStart(sourceFile)
        const end = component.getEnd()
        const funcSource = source.substring(start, end)

        const { line } = sourceFile.getLineAndCharacterOfPosition(start)

        localComponents.push({
          name,
          source: funcSource,
          startLine: line + 1, // 1-based line number
        })
      }
    },
    { excludeName }
  )

  return localComponents
}

/**
 * Extracts all exported component function names from a source file.
 *
 * Finds all PascalCase function declarations that:
 * 1. Are exported (export function Foo or export { Foo })
 * 2. Return JSX
 *
 * @param source - Source code
 * @param filePath - File path
 * @returns Array of exported component names
 */
export function extractExportedComponentNames(
  source: string,
  filePath: string
): string[] {
  const sourceFile = createSourceFile(source, filePath)
  const exportedNames: string[] = []

  ts.forEachChild(sourceFile, (node) => {
    // Check for exported function declarations: export function Foo() { ... }
    if (isComponentFunction(node)) {
      const hasExportModifier = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      )
      if (hasExportModifier && node.body && containsJsxReturn(node.body)) {
        exportedNames.push(node.name.text)
      }
    }
  })

  return exportedNames
}

/**
 * Checks if a function body contains a JSX return statement
 */
function containsJsxReturn(body: ts.Block): boolean {
  let hasJsx = false

  function visit(node: ts.Node) {
    if (hasJsx) return

    if (ts.isReturnStatement(node) && node.expression) {
      let expr = node.expression
      // Unwrap parentheses
      while (ts.isParenthesizedExpression(expr)) {
        expr = expr.expression
      }
      if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr) || ts.isJsxFragment(expr)) {
        hasJsx = true
        return
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(body)
  return hasJsx
}

/**
 * Gets the default exported component name from a source file.
 *
 * Detects patterns like:
 * - `export default function Foo() { ... }`
 * - `export default Foo` (where Foo is a function)
 *
 * @param source - Source code
 * @param filePath - File path
 * @returns Default export name, or null if no default export
 */
export function getDefaultExportName(
  source: string,
  filePath: string
): string | null {
  const sourceFile = createSourceFile(source, filePath)
  let defaultExportName: string | null = null

  ts.forEachChild(sourceFile, (node) => {
    // Pattern: export default Foo
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      if (ts.isIdentifier(node.expression)) {
        defaultExportName = node.expression.getText(sourceFile)
      }
    }
    // Pattern: export default function Foo() { ... }
    if (ts.isFunctionDeclaration(node) && node.name) {
      const hasExportModifier = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      )
      const hasDefaultModifier = node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.DefaultKeyword
      )
      if (hasExportModifier && hasDefaultModifier) {
        defaultExportName = node.name.text
      }
    }
  })

  return defaultExportName
}
