/**
 * BarefootJS JSX Compiler - Expression Parser
 *
 * Uses TypeScript API to accurately parse JavaScript expressions.
 * Replaces regex-based parsing to handle edge cases.
 */

import ts from 'typescript'

/**
 * Parses expression and returns TypeScript AST
 */
function parseExpression(code: string): ts.Expression | null {
  // Wrap expression to be interpreted as a statement
  const wrapped = `(${code})`
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    wrapped,
    ts.ScriptTarget.Latest,
    true
  )

  if (sourceFile.statements.length === 0) return null

  const stmt = sourceFile.statements[0]
  if (!ts.isExpressionStatement(stmt)) return null

  // Get contents of parenthesized expression
  const expr = stmt.expression
  if (ts.isParenthesizedExpression(expr)) {
    return expr.expression
  }
  return expr
}

/**
 * Checks if expression is an arrow function
 */
export function isArrowFunction(code: string): boolean {
  const expr = parseExpression(code)
  return expr !== null && ts.isArrowFunction(expr)
}

/**
 * Checks if expression is a simple identifier (e.g., `toggle`, `handleClick`)
 *
 * Returns true for:
 * - `toggle`
 * - `handleClick`
 * - `_privateFunc`
 * - `$helper`
 *
 * Returns false for:
 * - `toggle()` (function call)
 * - `() => toggle()` (arrow function)
 * - `obj.method` (property access)
 */
export function isSimpleIdentifier(code: string): boolean {
  const trimmed = code.trim()
  // Match valid JS identifiers: start with letter/underscore/$, followed by alphanumeric/underscore/$
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)
}

/**
 * Extracts arrow function body
 */
export function extractArrowBody(handler: string): string {
  const expr = parseExpression(handler)
  if (!expr || !ts.isArrowFunction(expr)) {
    return handler
  }

  const body = expr.body
  if (ts.isBlock(body)) {
    // For { ... } block, extract contents
    const text = body.getText().trim()
    return text.slice(1, -1).trim() // Remove { and }
  }

  // For expression, return as-is
  return body.getText()
}

/**
 * Extracts arrow function parameter part
 */
export function extractArrowParams(handler: string): string {
  const expr = parseExpression(handler)
  if (!expr || !ts.isArrowFunction(expr)) {
    return '()'
  }

  const params = expr.parameters
  if (params.length === 0) {
    return '()'
  }

  // Rebuild parameters as string
  const paramTexts = params.map(p => p.getText())
  return `(${paramTexts.join(', ')})`
}

/**
 * Parses conditional handler (condition && action)
 *
 * Supports following patterns:
 * - `e.key === 'Enter' && doSomething()` → { condition: "e.key === 'Enter'", action: "doSomething()" }
 * - `e.key === 'Enter' && !e.isComposing && doSomething()` → { condition: "e.key === 'Enter' && !e.isComposing", action: "doSomething()" }
 *
 * When the rightmost expression is a function call, treat it as action,
 * and treat the rest as condition.
 */
export function parseConditionalHandler(body: string): { condition: string; action: string } | null {
  const expr = parseExpression(body)
  if (!expr) return null

  // Check for condition && action format
  if (!ts.isBinaryExpression(expr)) return null
  if (expr.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return null

  const condition = expr.left.getText().trim()
  const action = expr.right.getText().trim()

  // Check if right side (action) is a function call
  // e.g., doSomething(), handleFinish(id, text), etc.
  if (ts.isCallExpression(expr.right)) {
    // Check if left side (condition) is a valid condition expression
    if (isValidCondition(expr.left)) {
      return { condition, action }
    }
  }

  return null
}

/**
 * Checks if expression is a valid condition expression
 *
 * Valid conditions:
 * - Comparison operators: `a === b`, `x !== y`, `n > 0`, etc.
 * - Negation operator: `!e.isComposing`
 * - Conditions connected with logical AND: `a === b && !c`
 * - Identifiers or property access: `item.done`, `isValid`
 */
function isValidCondition(expr: ts.Expression): boolean {
  // Parenthesized expression
  if (ts.isParenthesizedExpression(expr)) {
    return isValidCondition(expr.expression)
  }

  // Comparison operators
  if (ts.isBinaryExpression(expr)) {
    const op = expr.operatorToken.kind

    // Comparison operators
    const isComparison =
      op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
      op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
      op === ts.SyntaxKind.EqualsEqualsToken ||
      op === ts.SyntaxKind.ExclamationEqualsToken ||
      op === ts.SyntaxKind.GreaterThanToken ||
      op === ts.SyntaxKind.LessThanToken ||
      op === ts.SyntaxKind.GreaterThanEqualsToken ||
      op === ts.SyntaxKind.LessThanEqualsToken

    if (isComparison) {
      return true
    }

    // Conditions connected with logical AND (a && b)
    if (op === ts.SyntaxKind.AmpersandAmpersandToken) {
      return isValidCondition(expr.left) && isValidCondition(expr.right)
    }

    // Logical OR operator (a || b)
    if (op === ts.SyntaxKind.BarBarToken) {
      return isValidCondition(expr.left) && isValidCondition(expr.right)
    }
  }

  // Negation operator (!x)
  if (ts.isPrefixUnaryExpression(expr) && expr.operator === ts.SyntaxKind.ExclamationToken) {
    return true
  }

  // Identifiers or property access (item.done, isValid)
  if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
    return true
  }

  // Function calls (condition functions like isValid())
  if (ts.isCallExpression(expr)) {
    return true
  }

  return false
}

/**
 * Replaces signal calls with initial values (using AST)
 *
 * Does not replace signal names within string literals.
 */
export function replaceSignalCalls(
  expr: string,
  signals: Array<{ getter: string; initialValue: string }>
): string {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    expr,
    ts.ScriptTarget.Latest,
    true
  )

  // Record replacement positions (sorted in reverse for replacing from end)
  const replacements: Array<{ start: number; end: number; value: string }> = []

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (ts.isIdentifier(callee) && node.arguments.length === 0) {
        const name = callee.text
        const signal = signals.find(s => s.getter === name)
        if (signal) {
          replacements.push({
            start: node.getStart(),
            end: node.getEnd(),
            value: signal.initialValue,
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Replace from end
  replacements.sort((a, b) => b.start - a.start)
  let result = expr
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.value + result.slice(r.end)
  }

  return result
}

/**
 * Replace prop identifiers with getter calls using AST transformation
 *
 * Handles:
 * - Regular identifier: variant → variant()
 * - Shorthand property: { variant } → { variant: variant() }
 * - Skips: string literals, property access (.variant), already called (variant())
 */
export function replacePropsWithGetterCallsAST(
  code: string,
  propNames: string[]
): string {
  if (propNames.length === 0 || code.trim() === '') {
    return code
  }

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  )

  const replacements: Array<{ start: number; end: number; value: string }> = []
  const propSet = new Set(propNames)

  function shouldSkipIdentifier(node: ts.Identifier): boolean {
    const parent = node.parent

    // Property access right side: obj.variant
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
      return true
    }

    // Property definition key: { variant: value }
    if (ts.isPropertyAssignment(parent) && parent.name === node) {
      return true
    }

    // Already a function call: variant()
    if (ts.isCallExpression(parent) && parent.expression === node) {
      return true
    }

    // Parameter definition: (variant) => ...
    if (ts.isParameter(parent)) {
      return true
    }

    // Variable declaration left side: const variant = ...
    if (ts.isVariableDeclaration(parent) && parent.name === node) {
      return true
    }

    // Binding element (destructuring): const { variant } = obj
    if (ts.isBindingElement(parent)) {
      return true
    }

    // Function declaration name: function variant() {}
    if (ts.isFunctionDeclaration(parent) && parent.name === node) {
      return true
    }

    // Method name: { variant() {} }
    if (ts.isMethodDeclaration(parent) && parent.name === node) {
      return true
    }

    return false
  }

  function visit(node: ts.Node) {
    // Shorthand property: { variant } → { variant: variant() }
    if (ts.isShorthandPropertyAssignment(node)) {
      const name = node.name.text
      if (propSet.has(name)) {
        replacements.push({
          start: node.getStart(),
          end: node.getEnd(),
          value: `${name}: ${name}()`
        })
        return // Don't visit children
      }
    }

    // Regular identifier: variant → variant()
    if (ts.isIdentifier(node) && propSet.has(node.text)) {
      if (!shouldSkipIdentifier(node)) {
        replacements.push({
          start: node.getStart(),
          end: node.getEnd(),
          value: `${node.text}()`
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Replace from end to preserve positions
  replacements.sort((a, b) => b.start - a.start)
  let result = code
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.value + result.slice(r.end)
  }

  return result
}

/**
 * Substitutes identifiers with provided values using AST transformation.
 *
 * Context-aware: skips identifiers in positions where replacement would be incorrect:
 * - Property access right side: obj.name
 * - Property definition key: { name: value }
 * - Already a function call: name()
 * - Parameter definition: (name) => ...
 * - Variable declaration: const name = ...
 * - Binding element: const { name } = obj
 * - Function/method declaration name
 */
export function substituteIdentifiersAST(
  code: string,
  substitutions: Map<string, string>
): string {
  if (substitutions.size === 0 || code.trim() === '') {
    return code
  }

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  )

  const replacements: Array<{ start: number; end: number; value: string }> = []

  function shouldSkipIdentifier(node: ts.Identifier): boolean {
    const parent = node.parent

    // Property access right side: obj.name
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
      return true
    }

    // Property definition key: { name: value }
    if (ts.isPropertyAssignment(parent) && parent.name === node) {
      return true
    }

    // Already a function call: name() - skip callee position
    if (ts.isCallExpression(parent) && parent.expression === node) {
      return true
    }

    // Parameter definition: (name) => ...
    if (ts.isParameter(parent)) {
      return true
    }

    // Variable declaration left side: const name = ...
    if (ts.isVariableDeclaration(parent) && parent.name === node) {
      return true
    }

    // Binding element (destructuring): const { name } = obj
    if (ts.isBindingElement(parent)) {
      return true
    }

    // Function declaration name: function name() {}
    if (ts.isFunctionDeclaration(parent) && parent.name === node) {
      return true
    }

    // Method name: { name() {} }
    if (ts.isMethodDeclaration(parent) && parent.name === node) {
      return true
    }

    return false
  }

  function visit(node: ts.Node) {
    // Shorthand property: { name } → { name: substitutedValue }
    if (ts.isShorthandPropertyAssignment(node)) {
      const name = node.name.text
      if (substitutions.has(name)) {
        replacements.push({
          start: node.getStart(),
          end: node.getEnd(),
          value: `${name}: ${substitutions.get(name)}`
        })
        return // Don't visit children
      }
    }

    // Regular identifier: name → substitutedValue
    if (ts.isIdentifier(node) && substitutions.has(node.text)) {
      if (!shouldSkipIdentifier(node)) {
        replacements.push({
          start: node.getStart(),
          end: node.getEnd(),
          value: substitutions.get(node.text)!
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Replace from end to preserve positions
  replacements.sort((a, b) => b.start - a.start)
  let result = code
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.value + result.slice(r.end)
  }

  return result
}

/**
 * Replace getter names with function calls using AST transformation.
 *
 * e.g., `buttonClass` → `buttonClass()`
 *
 * Handles:
 * - Regular identifier: buttonClass → buttonClass()
 * - Skips: property access (.buttonClass), already called (buttonClass()),
 *          declarations (const buttonClass = ...), etc.
 */
export function replaceGettersWithCallsAST(
  code: string,
  getterNames: string[]
): string {
  if (getterNames.length === 0 || code.trim() === '') {
    return code
  }

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  )

  const replacements: Array<{ start: number; end: number; value: string }> = []
  const getterSet = new Set(getterNames)

  function shouldSkipIdentifier(node: ts.Identifier): boolean {
    const parent = node.parent

    // Property access right side: obj.buttonClass
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
      return true
    }

    // Property definition key: { buttonClass: value }
    if (ts.isPropertyAssignment(parent) && parent.name === node) {
      return true
    }

    // Already a function call: buttonClass()
    if (ts.isCallExpression(parent) && parent.expression === node) {
      return true
    }

    // Parameter definition: (buttonClass) => ...
    if (ts.isParameter(parent)) {
      return true
    }

    // Variable declaration left side: const buttonClass = ...
    if (ts.isVariableDeclaration(parent) && parent.name === node) {
      return true
    }

    // Binding element (destructuring): const { buttonClass } = obj
    if (ts.isBindingElement(parent)) {
      return true
    }

    // Function declaration name: function buttonClass() {}
    if (ts.isFunctionDeclaration(parent) && parent.name === node) {
      return true
    }

    // Method name: { buttonClass() {} }
    if (ts.isMethodDeclaration(parent) && parent.name === node) {
      return true
    }

    return false
  }

  function visit(node: ts.Node) {
    // Regular identifier: buttonClass → buttonClass()
    if (ts.isIdentifier(node) && getterSet.has(node.text)) {
      if (!shouldSkipIdentifier(node)) {
        replacements.push({
          start: node.getStart(),
          end: node.getEnd(),
          value: `${node.text}()`
        })
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Replace from end to preserve positions
  replacements.sort((a, b) => b.start - a.start)
  let result = code
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.value + result.slice(r.end)
  }

  return result
}

/**
 * Substitutes prop function calls with inlined values using AST transformation.
 *
 * Handles two cases:
 * 1. If propValue is an arrow function: propName(args) → body with args substituted
 * 2. Otherwise: propName(args) → (propValue)(args)
 *
 * Uses AST to correctly parse nested parentheses in arguments.
 */
export function substitutePropCallsAST(
  code: string,
  propsMap: Map<string, string>
): string {
  if (propsMap.size === 0 || code.trim() === '') {
    return code
  }

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  )

  const replacements: Array<{ start: number; end: number; value: string }> = []
  const propNames = new Set(propsMap.keys())

  function visit(node: ts.Node) {
    // Look for function calls where callee is a prop name
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      if (ts.isIdentifier(callee) && propNames.has(callee.text)) {
        const propName = callee.text
        const propValue = propsMap.get(propName)!

        // Get argument values as strings
        const argValues = node.arguments.map(arg => arg.getText())

        let replacementValue: string
        if (isArrowFunction(propValue)) {
          // Extract arrow function params and body
          const arrowParamsWithParen = extractArrowParams(propValue)
          const arrowParams = arrowParamsWithParen.slice(1, -1) // Remove ( and )
          let body = extractArrowBody(propValue)

          // Substitute parameters with argument values using AST
          if (argValues.length > 0 && arrowParams) {
            const paramNames = arrowParams.split(',').map(p => p.trim()).filter(p => p)
            const paramSubstitutions = new Map<string, string>()
            for (let i = 0; i < paramNames.length && i < argValues.length; i++) {
              if (paramNames[i]) {
                paramSubstitutions.set(paramNames[i], argValues[i])
              }
            }
            if (paramSubstitutions.size > 0) {
              body = substituteIdentifiersAST(body, paramSubstitutions)
            }
          }
          replacementValue = body
        } else {
          // Wrap non-arrow function and call with args
          replacementValue = `(${propValue})(${argValues.join(', ')})`
        }

        replacements.push({
          start: node.getStart(),
          end: node.getEnd(),
          value: replacementValue
        })
        return // Don't visit children of this call
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Replace from end to preserve positions
  replacements.sort((a, b) => b.start - a.start)
  let result = code
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.value + result.slice(r.end)
  }

  return result
}
