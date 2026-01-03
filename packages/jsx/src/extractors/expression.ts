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
