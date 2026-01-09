/**
 * BarefootJS JSX Compiler - Module Constants Extractor
 */

import ts from 'typescript'
import type { ModuleConstant } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Checks if an initializer is a module-level value (can be included in generated code).
 * Includes literals, template literals, arrays, objects, functions, call expressions, and type assertions.
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

  // Call expressions with static arguments
  if (ts.isCallExpression(node)) {
    return node.arguments.every(arg => isModuleLevelValue(arg as ts.Expression))
  }

  // Identifiers (references to other variables/imports)
  // Allow these for patterns like: const Comp = asChild ? Slot : 'button'
  if (ts.isIdentifier(node)) {
    return true
  }

  // Conditional (ternary) expressions
  if (ts.isConditionalExpression(node)) {
    return isModuleLevelValue(node.condition) &&
           isModuleLevelValue(node.whenTrue) &&
           isModuleLevelValue(node.whenFalse)
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
        const value = decl.initializer.getText(sourceFile)
        // Reconstruct declaration without type annotations (for client JS)
        const keyword = isConst ? 'const' : 'let'
        const code = `${keyword} ${name} = ${value}`

        constants.push({
          name,
          value,
          code
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
 * - Child component props expressions
 * - Memo computations (createMemo)
 * - Signal initializers (createSignal)
 * - Effect bodies (createEffect)
 * - Dynamic expressions (rendered on client)
 *
 * Note: localVariables are SSR-only and not checked here.
 */
export function isConstantUsedInClientCode(
  constantName: string,
  localFunctions: Array<{ code: string }>,
  eventHandlers: string[],
  refCallbacks: string[],
  childPropsExpressions: string[] = [],
  memoComputations: string[] = [],
  signalInitializers: string[] = [],
  effectBodies: string[] = [],
  dynamicExpressions: string[] = []
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

  // Check child component props expressions
  for (const propsExpr of childPropsExpressions) {
    if (pattern.test(propsExpr)) return true
  }

  // Check memo computations
  for (const computation of memoComputations) {
    if (pattern.test(computation)) return true
  }

  // Check signal initializers
  for (const initializer of signalInitializers) {
    if (pattern.test(initializer)) return true
  }

  // Check effect bodies
  for (const body of effectBodies) {
    if (pattern.test(body)) return true
  }

  // Check dynamic expressions (client-side rendered)
  for (const expr of dynamicExpressions) {
    if (pattern.test(expr)) return true
  }

  return false
}
