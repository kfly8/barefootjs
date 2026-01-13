/**
 * Expression Evaluator for Compile-Time Component Evaluation
 *
 * Evaluates JavaScript expressions at compile time when possible.
 * Used to inline component HTML when props are statically known.
 *
 * Evaluable expressions:
 * - Literals: "sun", 20, true, null
 * - Object property access: sizeMap["md"], strokeIcons.sun
 * - Variable references: pixelSize
 * - Binary operators: ===, !==, +
 * - Ternary operators: a ? b : c
 *
 * Non-evaluable (kept as runtime expressions):
 * - Signal/memo calls: count(), doubled()
 * - External function calls
 * - Props passed from parent (unless value is known)
 */

import ts from 'typescript'
import { createSourceFile } from '../utils/helpers'

/**
 * Represents the result of evaluating an expression at compile time
 */
export type EvaluatedValue =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'object'; entries: Map<string, EvaluatedValue> }
  | { kind: 'array'; elements: EvaluatedValue[] }
  | { kind: 'dynamic'; expression: string }  // Signal/prop reference that needs runtime evaluation
  | { kind: 'unknown' }  // Cannot be evaluated

/**
 * Context for expression evaluation
 */
export interface EvalContext {
  /** Local variables in scope (e.g., pixelSize = 20) */
  variables: Map<string, EvaluatedValue>
  /** Module-level constants (e.g., sizeMap, strokeIcons) */
  moduleConstants: Map<string, EvaluatedValue>
  /** Props passed to the component with their values */
  props: Map<string, EvaluatedValue>
  /** Signal getters (names that end with () and are reactive) */
  signalGetters: Set<string>
  /** Memo getters (names that end with () and are reactive) */
  memoGetters: Set<string>
}

/**
 * Creates an empty evaluation context
 */
export function createEmptyContext(): EvalContext {
  return {
    variables: new Map(),
    moduleConstants: new Map(),
    props: new Map(),
    signalGetters: new Set(),
    memoGetters: new Set()
  }
}

/**
 * Evaluates an expression string at compile time
 *
 * @param expr - The expression string to evaluate
 * @param ctx - The evaluation context with known values
 * @returns The evaluated value or unknown if not evaluable
 */
export function evaluateExpression(expr: string, ctx: EvalContext): EvaluatedValue {
  const trimmed = expr.trim()

  // Parse the expression as TypeScript
  const sourceFile = createSourceFile(`const __expr = ${trimmed}`, '__eval.ts')
  const statement = sourceFile.statements[0]

  if (!ts.isVariableStatement(statement)) {
    return { kind: 'unknown' }
  }

  const decl = statement.declarationList.declarations[0]
  if (!decl.initializer) {
    return { kind: 'unknown' }
  }

  return evaluateNode(decl.initializer, ctx)
}

/**
 * Evaluates a TypeScript AST node at compile time
 */
function evaluateNode(node: ts.Expression, ctx: EvalContext): EvaluatedValue {
  // String literal
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { kind: 'literal', value: node.text }
  }

  // Numeric literal
  if (ts.isNumericLiteral(node)) {
    return { kind: 'literal', value: parseFloat(node.text) }
  }

  // Boolean literals
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return { kind: 'literal', value: true }
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return { kind: 'literal', value: false }
  }

  // Null literal
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return { kind: 'literal', value: null }
  }

  // Undefined
  if (ts.isIdentifier(node) && node.text === 'undefined') {
    return { kind: 'literal', value: null }  // Treat undefined as null
  }

  // Identifier (variable reference)
  if (ts.isIdentifier(node)) {
    const name = node.text

    // Check if it's a signal/memo getter (reactive)
    if (ctx.signalGetters.has(name) || ctx.memoGetters.has(name)) {
      return { kind: 'dynamic', expression: name + '()' }
    }

    // Check props first
    if (ctx.props.has(name)) {
      return ctx.props.get(name)!
    }

    // Check local variables
    if (ctx.variables.has(name)) {
      return ctx.variables.get(name)!
    }

    // Check module constants
    if (ctx.moduleConstants.has(name)) {
      return ctx.moduleConstants.get(name)!
    }

    // Unknown identifier
    return { kind: 'unknown' }
  }

  // Call expression (e.g., count(), doubled(), array.includes(value))
  if (ts.isCallExpression(node)) {
    // Check if it's a signal/memo call
    if (ts.isIdentifier(node.expression)) {
      const name = node.expression.text
      if (ctx.signalGetters.has(name) || ctx.memoGetters.has(name)) {
        return { kind: 'dynamic', expression: name + '()' }
      }
    }

    // Check if it's a method call on an array (e.g., array.includes(value))
    if (ts.isPropertyAccessExpression(node.expression)) {
      const methodName = node.expression.name.text
      const objValue = evaluateNode(node.expression.expression, ctx)

      // Handle array.includes(value)
      if (methodName === 'includes' && objValue.kind === 'array' && node.arguments.length === 1) {
        const argValue = evaluateNode(node.arguments[0], ctx)
        if (argValue.kind === 'literal') {
          const found = objValue.elements.some(
            el => el.kind === 'literal' && el.value === argValue.value
          )
          return { kind: 'literal', value: found }
        }
      }
    }

    // Other function calls are not evaluable
    return { kind: 'unknown' }
  }

  // Property access (e.g., sizeMap.md)
  if (ts.isPropertyAccessExpression(node)) {
    const objValue = evaluateNode(node.expression, ctx)
    const propName = node.name.text

    if (objValue.kind === 'object') {
      const value = objValue.entries.get(propName)
      return value ?? { kind: 'unknown' }
    }

    return { kind: 'unknown' }
  }

  // Element access (e.g., sizeMap["md"])
  if (ts.isElementAccessExpression(node)) {
    const objValue = evaluateNode(node.expression, ctx)
    const keyValue = evaluateNode(node.argumentExpression, ctx)

    if (objValue.kind === 'object' && keyValue.kind === 'literal' && typeof keyValue.value === 'string') {
      const value = objValue.entries.get(keyValue.value)
      return value ?? { kind: 'unknown' }
    }

    return { kind: 'unknown' }
  }

  // Binary expression (e.g., a === b, a + b)
  if (ts.isBinaryExpression(node)) {
    const left = evaluateNode(node.left, ctx)
    const right = evaluateNode(node.right, ctx)

    // If either side is dynamic, the result is dynamic
    if (left.kind === 'dynamic' || right.kind === 'dynamic') {
      const leftExpr = evaluatedValueToExpression(left)
      const rightExpr = evaluatedValueToExpression(right)
      if (leftExpr === null || rightExpr === null) {
        return { kind: 'unknown' }
      }
      const operator = node.operatorToken.getText()
      return { kind: 'dynamic', expression: `${leftExpr} ${operator} ${rightExpr}` }
    }

    // Both sides are known - evaluate
    if (left.kind === 'literal' && right.kind === 'literal') {
      const operator = node.operatorToken.kind

      switch (operator) {
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
          return { kind: 'literal', value: left.value === right.value }
        case ts.SyntaxKind.ExclamationEqualsEqualsToken:
          return { kind: 'literal', value: left.value !== right.value }
        case ts.SyntaxKind.EqualsEqualsToken:
          return { kind: 'literal', value: left.value == right.value }
        case ts.SyntaxKind.ExclamationEqualsToken:
          return { kind: 'literal', value: left.value != right.value }
        case ts.SyntaxKind.PlusToken:
          if (typeof left.value === 'string' || typeof right.value === 'string') {
            return { kind: 'literal', value: String(left.value) + String(right.value) }
          }
          if (typeof left.value === 'number' && typeof right.value === 'number') {
            return { kind: 'literal', value: left.value + right.value }
          }
          break
        case ts.SyntaxKind.MinusToken:
          if (typeof left.value === 'number' && typeof right.value === 'number') {
            return { kind: 'literal', value: left.value - right.value }
          }
          break
        case ts.SyntaxKind.AsteriskToken:
          if (typeof left.value === 'number' && typeof right.value === 'number') {
            return { kind: 'literal', value: left.value * right.value }
          }
          break
        case ts.SyntaxKind.SlashToken:
          if (typeof left.value === 'number' && typeof right.value === 'number') {
            return { kind: 'literal', value: left.value / right.value }
          }
          break
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return { kind: 'literal', value: Boolean(left.value) && Boolean(right.value) }
        case ts.SyntaxKind.BarBarToken:
          return { kind: 'literal', value: Boolean(left.value) || Boolean(right.value) }
      }
    }

    return { kind: 'unknown' }
  }

  // Conditional (ternary) expression
  if (ts.isConditionalExpression(node)) {
    const condition = evaluateNode(node.condition, ctx)

    if (condition.kind === 'literal') {
      // Condition is known - evaluate the appropriate branch
      if (condition.value) {
        return evaluateNode(node.whenTrue, ctx)
      } else {
        return evaluateNode(node.whenFalse, ctx)
      }
    }

    if (condition.kind === 'dynamic') {
      // Condition is dynamic - return dynamic expression
      const whenTrue = evaluateNode(node.whenTrue, ctx)
      const whenFalse = evaluateNode(node.whenFalse, ctx)
      const trueExpr = evaluatedValueToExpression(whenTrue)
      const falseExpr = evaluatedValueToExpression(whenFalse)

      if (trueExpr === null || falseExpr === null) {
        return { kind: 'unknown' }
      }

      return { kind: 'dynamic', expression: `${condition.expression} ? ${trueExpr} : ${falseExpr}` }
    }

    return { kind: 'unknown' }
  }

  // Parenthesized expression
  if (ts.isParenthesizedExpression(node)) {
    return evaluateNode(node.expression, ctx)
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
          const value = evaluateNode(prop.initializer, ctx)
          entries.set(key, value)
        }
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        const key = prop.name.text
        const value = evaluateNode(prop.name as unknown as ts.Expression, ctx)
        entries.set(key, value)
      }
    }

    return { kind: 'object', entries }
  }

  // Array literal
  if (ts.isArrayLiteralExpression(node)) {
    const elements: EvaluatedValue[] = []

    for (const el of node.elements) {
      if (ts.isSpreadElement(el)) {
        return { kind: 'unknown' }  // Spread not supported
      }
      elements.push(evaluateNode(el as ts.Expression, ctx))
    }

    return { kind: 'array', elements }
  }

  // Template literal
  if (ts.isTemplateExpression(node)) {
    // Evaluate template parts
    let result = node.head.text
    let hasDynamic = false
    const dynamicParts: string[] = [JSON.stringify(node.head.text)]

    for (const span of node.templateSpans) {
      const spanValue = evaluateNode(span.expression, ctx)

      if (spanValue.kind === 'literal') {
        result += String(spanValue.value) + span.literal.text
        dynamicParts.push(JSON.stringify(String(spanValue.value)))
      } else if (spanValue.kind === 'dynamic') {
        hasDynamic = true
        dynamicParts.push(spanValue.expression)
      } else {
        return { kind: 'unknown' }
      }

      dynamicParts.push(JSON.stringify(span.literal.text))
    }

    if (hasDynamic) {
      return { kind: 'dynamic', expression: dynamicParts.filter(p => p !== '""').join(' + ') }
    }

    return { kind: 'literal', value: result }
  }

  // Prefix unary expression (e.g., !value, -num)
  if (ts.isPrefixUnaryExpression(node)) {
    const operand = evaluateNode(node.operand, ctx)

    if (operand.kind === 'literal') {
      switch (node.operator) {
        case ts.SyntaxKind.ExclamationToken:
          return { kind: 'literal', value: !operand.value }
        case ts.SyntaxKind.MinusToken:
          if (typeof operand.value === 'number') {
            return { kind: 'literal', value: -operand.value }
          }
          break
        case ts.SyntaxKind.PlusToken:
          if (typeof operand.value === 'number') {
            return { kind: 'literal', value: +operand.value }
          }
          break
      }
    }

    if (operand.kind === 'dynamic') {
      const op = node.operator === ts.SyntaxKind.ExclamationToken ? '!' :
                 node.operator === ts.SyntaxKind.MinusToken ? '-' : '+'
      return { kind: 'dynamic', expression: `${op}${operand.expression}` }
    }

    return { kind: 'unknown' }
  }

  // Type assertion (as const, satisfies Type)
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return evaluateNode(node.expression, ctx)
  }

  return { kind: 'unknown' }
}

/**
 * Converts an EvaluatedValue back to a JavaScript expression string
 */
export function evaluatedValueToExpression(value: EvaluatedValue): string | null {
  switch (value.kind) {
    case 'literal':
      if (value.value === null) return 'null'
      if (typeof value.value === 'string') return JSON.stringify(value.value)
      return String(value.value)

    case 'dynamic':
      return value.expression

    case 'object': {
      const entries: string[] = []
      for (const [key, val] of value.entries) {
        const valExpr = evaluatedValueToExpression(val)
        if (valExpr === null) return null
        // Use quoted key if needed
        const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        const keyStr = needsQuotes ? JSON.stringify(key) : key
        entries.push(`${keyStr}: ${valExpr}`)
      }
      return `{ ${entries.join(', ')} }`
    }

    case 'array': {
      const elements: string[] = []
      for (const el of value.elements) {
        const elExpr = evaluatedValueToExpression(el)
        if (elExpr === null) return null
        elements.push(elExpr)
      }
      return `[${elements.join(', ')}]`
    }

    case 'unknown':
      return null
  }
}

/**
 * Gets the literal value from an EvaluatedValue, or null if not a literal
 */
export function getLiteralValue(value: EvaluatedValue): string | number | boolean | null {
  if (value.kind === 'literal') {
    return value.value
  }
  return null
}

/**
 * Checks if an EvaluatedValue is statically known (not dynamic or unknown)
 */
export function isStaticallyKnown(value: EvaluatedValue): boolean {
  switch (value.kind) {
    case 'literal':
      return true
    case 'object':
      return Array.from(value.entries.values()).every(isStaticallyKnown)
    case 'array':
      return value.elements.every(isStaticallyKnown)
    case 'dynamic':
    case 'unknown':
      return false
  }
}

/**
 * Parses an object literal expression and returns a Map of EvaluatedValues
 */
export function parseObjectLiteral(expr: string): Map<string, EvaluatedValue> | null {
  const result = evaluateExpression(expr, createEmptyContext())
  if (result.kind === 'object') {
    return result.entries
  }
  return null
}
