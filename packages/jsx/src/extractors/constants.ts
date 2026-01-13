/**
 * BarefootJS JSX Compiler - Module Constants Extractor
 */

import ts from 'typescript'
import type { ModuleConstant } from '../types'
import { createSourceFile } from '../utils/helpers'
import type { EvaluatedValue } from '../compiler/expression-evaluator'

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
 * - Dynamic element expressions (JSX template interpolations)
 * - List element expressions (.map() arrays and templates)
 * - Local variable codes (e.g., const classes = `${baseClasses}...`)
 *
 * Note: Dynamic attribute expressions are NOT included because
 * attributes are evaluated at SSR time, not client time.
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
  dynamicElementExpressions: string[] = [],
  listElementExpressions: string[] = [],
  localVariableCodes: string[] = []
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

  // Check dynamic element expressions (JSX template interpolations)
  for (const expr of dynamicElementExpressions) {
    if (pattern.test(expr)) return true
  }

  // Check list element expressions (.map() arrays and templates)
  for (const expr of listElementExpressions) {
    if (pattern.test(expr)) return true
  }

  // Note: Dynamic attribute expressions are NOT checked here because
  // attributes are evaluated at SSR time, not client time

  // Check local variable codes (e.g., const classes = `${baseClasses}...`)
  for (const code of localVariableCodes) {
    if (pattern.test(code)) return true
  }

  return false
}

/**
 * Parses a module constant value into an EvaluatedValue for compile-time evaluation.
 *
 * This enables the compiler to evaluate expressions like:
 * - sizeMap["md"] → 20
 * - strokeIcons["sun"] → "M12..."
 *
 * @param constant - The module constant to parse
 * @returns EvaluatedValue representation of the constant
 */
export function parseModuleConstantValue(constant: ModuleConstant): EvaluatedValue {
  return parseValueExpression(constant.value)
}

/**
 * Parses a value expression string into an EvaluatedValue.
 * Handles literals, objects, and arrays.
 */
function parseValueExpression(valueStr: string): EvaluatedValue {
  const trimmed = valueStr.trim()

  // Parse as TypeScript expression
  const sourceFile = createSourceFile(`const __val = ${trimmed}`, '__parse.ts')
  const statement = sourceFile.statements[0]

  if (!ts.isVariableStatement(statement)) {
    return { kind: 'unknown' }
  }

  const decl = statement.declarationList.declarations[0]
  if (!decl.initializer) {
    return { kind: 'unknown' }
  }

  return nodeToEvaluatedValue(decl.initializer)
}

/**
 * Converts a TypeScript AST node to an EvaluatedValue.
 */
function nodeToEvaluatedValue(node: ts.Expression): EvaluatedValue {
  // String literal
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { kind: 'literal', value: node.text }
  }

  // Numeric literal
  if (ts.isNumericLiteral(node)) {
    return { kind: 'literal', value: parseFloat(node.text) }
  }

  // Boolean and null literals
  switch (node.kind) {
    case ts.SyntaxKind.TrueKeyword:
      return { kind: 'literal', value: true }
    case ts.SyntaxKind.FalseKeyword:
      return { kind: 'literal', value: false }
    case ts.SyntaxKind.NullKeyword:
      return { kind: 'literal', value: null }
  }

  // Object literal
  if (ts.isObjectLiteralExpression(node)) {
    const entries = new Map<string, EvaluatedValue>()

    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        let key: string | null = null

        if (ts.isIdentifier(prop.name)) {
          key = prop.name.text
        } else if (ts.isStringLiteral(prop.name)) {
          key = prop.name.text
        }

        if (key !== null) {
          entries.set(key, nodeToEvaluatedValue(prop.initializer))
        }
      }
    }

    return { kind: 'object', entries }
  }

  // Array literal
  if (ts.isArrayLiteralExpression(node)) {
    const elements: EvaluatedValue[] = []

    for (const el of node.elements) {
      if (ts.isSpreadElement(el)) {
        return { kind: 'unknown' }
      }
      elements.push(nodeToEvaluatedValue(el as ts.Expression))
    }

    return { kind: 'array', elements }
  }

  // Type assertions (as const, satisfies Type)
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return nodeToEvaluatedValue(node.expression)
  }

  // Parenthesized expressions
  if (ts.isParenthesizedExpression(node)) {
    return nodeToEvaluatedValue(node.expression)
  }

  // For other types (functions, template expressions, etc.), return unknown
  // These can't be used in compile-time evaluation of props
  return { kind: 'unknown' }
}

/**
 * Extracts module constants and parses them into EvaluatedValue format.
 *
 * @returns Map of constant name to EvaluatedValue
 */
export function extractModuleConstantsAsValues(source: string, filePath: string): Map<string, EvaluatedValue> {
  const constants = extractModuleVariables(source, filePath)
  const result = new Map<string, EvaluatedValue>()

  for (const constant of constants) {
    const value = parseModuleConstantValue(constant)
    // Only add if we could parse it
    if (value.kind !== 'unknown') {
      result.set(constant.name, value)
    }
  }

  return result
}
