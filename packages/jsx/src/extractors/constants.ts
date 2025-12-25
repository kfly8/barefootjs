/**
 * BarefootJS JSX Compiler - Module Constants Extractor
 */

import ts from 'typescript'
import type { ModuleConstant } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Checks if an initializer is a module-level value (can be included in generated code).
 * Includes literals, template literals, arrays, objects, functions, and type assertions.
 */
function isModuleLevelValue(node: ts.Expression): boolean {
  // Simple literals
  if (ts.isNumericLiteral(node) ||
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      node.kind === ts.SyntaxKind.TrueKeyword ||
      node.kind === ts.SyntaxKind.FalseKeyword ||
      node.kind === ts.SyntaxKind.NullKeyword) {
    return true
  }

  // Template literals (with substitutions)
  if (ts.isTemplateExpression(node)) {
    return true
  }

  // Functions (arrow functions and function expressions)
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return true
  }

  // Array literals
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.every(el => {
      if (ts.isSpreadElement(el)) return false
      return isModuleLevelValue(el as ts.Expression)
    })
  }

  // Object literals
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.every(prop => {
      if (ts.isPropertyAssignment(prop) && prop.initializer) {
        return isModuleLevelValue(prop.initializer)
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        return true // Shorthand like { name } - assume static
      }
      if (ts.isMethodDeclaration(prop)) {
        return true // Object methods
      }
      return false
    })
  }

  // Type assertions (e.g., "hello" as const, value satisfies Type)
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return isModuleLevelValue(node.expression)
  }

  // Parenthesized expressions
  if (ts.isParenthesizedExpression(node)) {
    return isModuleLevelValue(node.expression)
  }

  return false
}

/**
 * Extracts module-level variable declarations from source code.
 * Extracts const and let with values (literals, templates, arrays, objects, functions).
 *
 * @example
 * const GRID_SIZE = 100                    // extracted
 * const NAME = "hello"                     // extracted
 * const CODE = `template string`           // extracted
 * const ITEMS = ["a", "b"]                 // extracted
 * const CONFIG = { key: "value" }          // extracted
 * const handleClick = () => {}             // extracted (function)
 * let counter = 0                          // extracted (let)
 * let state = { count: 0 }                 // extracted (let with object)
 */
export function extractModuleVariables(source: string, filePath: string): ModuleConstant[] {
  const sourceFile = createSourceFile(source, filePath)
  const constants: ModuleConstant[] = []

  // Only process top-level statements
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return

    // Check if it's const or let (not var)
    const flags = node.declarationList.flags
    const isConst = (flags & ts.NodeFlags.Const) !== 0
    const isLet = (flags & ts.NodeFlags.Let) !== 0
    if (!isConst && !isLet) return

    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue

      // Extract module-level values (including functions)
      if (isModuleLevelValue(decl.initializer)) {
        const name = decl.name.text
        // Get the full declaration including type annotations
        const fullDecl = node.getText(sourceFile)

        constants.push({
          name,
          value: decl.initializer.getText(sourceFile),
          code: fullDecl
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
