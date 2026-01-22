/**
 * Expression Parser for GoTemplateAdapter
 *
 * Parses JavaScript expressions into a structured AST-like representation
 * using TypeScript Compiler API. This enables proper support detection
 * and conversion to Go template syntax.
 */

import ts from 'typescript'

// =============================================================================
// Parsed Expression Types
// =============================================================================

export type ParsedExpr =
  | { kind: 'identifier'; name: string }
  | { kind: 'literal'; value: string | number | boolean | null; literalType: 'string' | 'number' | 'boolean' | 'null' }
  | { kind: 'call'; callee: ParsedExpr; args: ParsedExpr[] }
  | { kind: 'member'; object: ParsedExpr; property: string; computed: boolean }
  | { kind: 'binary'; op: string; left: ParsedExpr; right: ParsedExpr }
  | { kind: 'unary'; op: string; argument: ParsedExpr }
  | { kind: 'conditional'; test: ParsedExpr; consequent: ParsedExpr; alternate: ParsedExpr }
  | { kind: 'logical'; op: '&&' | '||'; left: ParsedExpr; right: ParsedExpr }
  | { kind: 'template-literal'; parts: TemplatePart[] }
  | { kind: 'unsupported'; raw: string; reason: string }

export type TemplatePart =
  | { type: 'string'; value: string }
  | { type: 'expression'; expr: ParsedExpr }

// =============================================================================
// Support Level Classification
// =============================================================================

export type SupportLevel =
  | 'L1' // Simple identifiers and signals: count(), name
  | 'L2' // Member access and .length: user.name, items().length
  | 'L3' // Comparison operators: count() > 0, filter() === 'all'
  | 'L4' // Logical operators: a && b, !isLoading()
  | 'L5_UNSUPPORTED' // Higher-order functions: items().filter(), items().every()

export interface SupportResult {
  supported: boolean
  level?: SupportLevel
  reason?: string
}

// Higher-order array methods that are not supported
const UNSUPPORTED_METHODS = new Set([
  'filter', 'map', 'reduce', 'reduceRight', 'every', 'some',
  'find', 'findIndex', 'findLast', 'findLastIndex',
  'forEach', 'flatMap', 'flat', 'sort', 'toSorted',
])

// =============================================================================
// Expression Parser
// =============================================================================

/**
 * Parse a JavaScript expression string into a ParsedExpr tree.
 */
export function parseExpression(expr: string): ParsedExpr {
  const trimmed = expr.trim()
  if (!trimmed) {
    return { kind: 'unsupported', raw: expr, reason: 'Empty expression' }
  }

  // Create a minimal source file containing just the expression
  const sourceFile = ts.createSourceFile(
    'expression.ts',
    trimmed,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  // Get the first statement which should be an expression statement
  if (sourceFile.statements.length === 0) {
    return { kind: 'unsupported', raw: expr, reason: 'No statements found' }
  }

  const firstStmt = sourceFile.statements[0]
  if (!ts.isExpressionStatement(firstStmt)) {
    return { kind: 'unsupported', raw: expr, reason: 'Not an expression statement' }
  }

  return convertNode(firstStmt.expression, expr)
}

/**
 * Convert a TypeScript AST node to ParsedExpr.
 */
function convertNode(node: ts.Node, raw: string): ParsedExpr {
  // Identifier: count, name, items
  if (ts.isIdentifier(node)) {
    return { kind: 'identifier', name: node.text }
  }

  // String literal: 'all', "completed"
  if (ts.isStringLiteral(node)) {
    return { kind: 'literal', value: node.text, literalType: 'string' }
  }

  // Numeric literal: 0, 5, 3.14
  if (ts.isNumericLiteral(node)) {
    const value = parseFloat(node.text)
    return { kind: 'literal', value, literalType: 'number' }
  }

  // Boolean literals and null
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return { kind: 'literal', value: true, literalType: 'boolean' }
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return { kind: 'literal', value: false, literalType: 'boolean' }
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return { kind: 'literal', value: null, literalType: 'null' }
  }

  // Call expression: count(), items(), filter()
  if (ts.isCallExpression(node)) {
    const callee = convertNode(node.expression, raw)
    const args = node.arguments.map(arg => convertNode(arg, raw))
    return { kind: 'call', callee, args }
  }

  // Property access: user.name, items().length
  if (ts.isPropertyAccessExpression(node)) {
    const object = convertNode(node.expression, raw)
    const property = node.name.text
    return { kind: 'member', object, property, computed: false }
  }

  // Element access: items[0], obj['key']
  if (ts.isElementAccessExpression(node)) {
    const object = convertNode(node.expression, raw)
    const argNode = node.argumentExpression
    // For simple number/string access, store as property
    if (ts.isNumericLiteral(argNode)) {
      return { kind: 'member', object, property: argNode.text, computed: true }
    }
    if (ts.isStringLiteral(argNode)) {
      return { kind: 'member', object, property: argNode.text, computed: true }
    }
    // Complex computed access
    return { kind: 'unsupported', raw, reason: 'Complex computed property access' }
  }

  // Binary expression: a === b, count > 0, a + b
  if (ts.isBinaryExpression(node)) {
    const left = convertNode(node.left, raw)
    const right = convertNode(node.right, raw)
    const opToken = node.operatorToken

    // Logical operators
    if (opToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      return { kind: 'logical', op: '&&', left, right }
    }
    if (opToken.kind === ts.SyntaxKind.BarBarToken) {
      return { kind: 'logical', op: '||', left, right }
    }

    // Convert operator token to string
    const op = getOperatorString(opToken.kind)
    return { kind: 'binary', op, left, right }
  }

  // Prefix unary expression: !value, -count
  if (ts.isPrefixUnaryExpression(node)) {
    const argument = convertNode(node.operand, raw)
    const op = getUnaryOperatorString(node.operator)
    return { kind: 'unary', op, argument }
  }

  // Conditional expression: cond ? a : b
  if (ts.isConditionalExpression(node)) {
    const test = convertNode(node.condition, raw)
    const consequent = convertNode(node.whenTrue, raw)
    const alternate = convertNode(node.whenFalse, raw)
    return { kind: 'conditional', test, consequent, alternate }
  }

  // Parenthesized expression: (a + b)
  if (ts.isParenthesizedExpression(node)) {
    return convertNode(node.expression, raw)
  }

  // Template literal: `Hello ${name}`
  if (ts.isTemplateExpression(node)) {
    const parts: TemplatePart[] = []
    // Head part
    if (node.head.text) {
      parts.push({ type: 'string', value: node.head.text })
    }
    // Spans (expression + literal pairs)
    for (const span of node.templateSpans) {
      parts.push({ type: 'expression', expr: convertNode(span.expression, raw) })
      if (span.literal.text) {
        parts.push({ type: 'string', value: span.literal.text })
      }
    }
    return { kind: 'template-literal', parts }
  }

  // No-substitution template literal: `hello`
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return { kind: 'literal', value: node.text, literalType: 'string' }
  }

  // Arrow function (unsupported in SSR)
  if (ts.isArrowFunction(node)) {
    return { kind: 'unsupported', raw, reason: 'Arrow functions cannot be evaluated at SSR time' }
  }

  // Function expression (unsupported)
  if (ts.isFunctionExpression(node)) {
    return { kind: 'unsupported', raw, reason: 'Function expressions cannot be evaluated at SSR time' }
  }

  // Default: unsupported
  return { kind: 'unsupported', raw, reason: `Unsupported syntax: ${ts.SyntaxKind[node.kind]}` }
}

/**
 * Convert TypeScript binary operator to string representation.
 */
function getOperatorString(kind: ts.SyntaxKind): string {
  switch (kind) {
    // Comparison
    case ts.SyntaxKind.EqualsEqualsToken: return '=='
    case ts.SyntaxKind.EqualsEqualsEqualsToken: return '==='
    case ts.SyntaxKind.ExclamationEqualsToken: return '!='
    case ts.SyntaxKind.ExclamationEqualsEqualsToken: return '!=='
    case ts.SyntaxKind.GreaterThanToken: return '>'
    case ts.SyntaxKind.LessThanToken: return '<'
    case ts.SyntaxKind.GreaterThanEqualsToken: return '>='
    case ts.SyntaxKind.LessThanEqualsToken: return '<='

    // Arithmetic
    case ts.SyntaxKind.PlusToken: return '+'
    case ts.SyntaxKind.MinusToken: return '-'
    case ts.SyntaxKind.AsteriskToken: return '*'
    case ts.SyntaxKind.SlashToken: return '/'
    case ts.SyntaxKind.PercentToken: return '%'

    default: return 'unknown'
  }
}

/**
 * Convert TypeScript prefix unary operator to string representation.
 */
function getUnaryOperatorString(op: ts.PrefixUnaryOperator): string {
  switch (op) {
    case ts.SyntaxKind.ExclamationToken: return '!'
    case ts.SyntaxKind.MinusToken: return '-'
    case ts.SyntaxKind.PlusToken: return '+'
    case ts.SyntaxKind.TildeToken: return '~'
    default: return 'unknown'
  }
}

// =============================================================================
// Support Checking
// =============================================================================

/**
 * Check if a parsed expression is supported for Go template conversion.
 */
export function isSupported(expr: ParsedExpr): SupportResult {
  return checkSupport(expr)
}

function checkSupport(expr: ParsedExpr): SupportResult {
  switch (expr.kind) {
    case 'unsupported':
      return { supported: false, reason: expr.reason }

    case 'identifier':
      return { supported: true, level: 'L1' }

    case 'literal':
      return { supported: true, level: 'L1' }

    case 'call': {
      // Check if callee is supported
      const calleeSupport = checkSupport(expr.callee)
      if (!calleeSupport.supported) {
        return calleeSupport
      }

      // Check for higher-order array methods: items().filter(...)
      if (expr.callee.kind === 'member') {
        const methodName = expr.callee.property
        if (UNSUPPORTED_METHODS.has(methodName)) {
          return {
            supported: false,
            level: 'L5_UNSUPPORTED',
            reason: `Higher-order method '${methodName}()' requires client-side evaluation. Use @client directive or pre-compute in Go.`,
          }
        }
      }

      // Signal calls like count() with no args are L1
      if (expr.callee.kind === 'identifier' && expr.args.length === 0) {
        return { supported: true, level: 'L1' }
      }

      // Other function calls - check args
      for (const arg of expr.args) {
        const argSupport = checkSupport(arg)
        if (!argSupport.supported) {
          return argSupport
        }
      }
      return { supported: true, level: 'L2' }
    }

    case 'member': {
      const objSupport = checkSupport(expr.object)
      if (!objSupport.supported) {
        return objSupport
      }
      // .length is L2
      if (expr.property === 'length') {
        return { supported: true, level: 'L2' }
      }
      return { supported: true, level: 'L2' }
    }

    case 'binary': {
      const leftSupport = checkSupport(expr.left)
      if (!leftSupport.supported) return leftSupport
      const rightSupport = checkSupport(expr.right)
      if (!rightSupport.supported) return rightSupport

      // Comparison operators are L3
      if (['===', '==', '!==', '!=', '>', '<', '>=', '<='].includes(expr.op)) {
        return { supported: true, level: 'L3' }
      }

      // Arithmetic operators are L3
      if (['+', '-', '*', '/', '%'].includes(expr.op)) {
        return { supported: true, level: 'L3' }
      }

      return { supported: false, reason: `Unknown operator: ${expr.op}` }
    }

    case 'unary': {
      const argSupport = checkSupport(expr.argument)
      if (!argSupport.supported) return argSupport

      // Negation is L4
      if (expr.op === '!') {
        return { supported: true, level: 'L4' }
      }
      // Numeric negation is L3
      if (expr.op === '-' || expr.op === '+') {
        return { supported: true, level: 'L3' }
      }

      return { supported: false, reason: `Unsupported unary operator: ${expr.op}` }
    }

    case 'logical': {
      const leftSupport = checkSupport(expr.left)
      if (!leftSupport.supported) return leftSupport
      const rightSupport = checkSupport(expr.right)
      if (!rightSupport.supported) return rightSupport

      return { supported: true, level: 'L4' }
    }

    case 'conditional': {
      const testSupport = checkSupport(expr.test)
      if (!testSupport.supported) return testSupport
      const consSupport = checkSupport(expr.consequent)
      if (!consSupport.supported) return consSupport
      const altSupport = checkSupport(expr.alternate)
      if (!altSupport.supported) return altSupport

      return { supported: true, level: 'L4' }
    }

    case 'template-literal': {
      for (const part of expr.parts) {
        if (part.type === 'expression') {
          const partSupport = checkSupport(part.expr)
          if (!partSupport.supported) return partSupport
        }
      }
      return { supported: true, level: 'L2' }
    }

    default:
      return { supported: false, reason: 'Unknown expression kind' }
  }
}

// =============================================================================
// Debug Helper
// =============================================================================

/**
 * Convert ParsedExpr back to a string for debugging.
 */
export function exprToString(expr: ParsedExpr): string {
  switch (expr.kind) {
    case 'identifier':
      return expr.name
    case 'literal':
      if (expr.literalType === 'string') return `"${expr.value}"`
      if (expr.value === null) return 'null'
      return String(expr.value)
    case 'call':
      return `${exprToString(expr.callee)}(${expr.args.map(exprToString).join(', ')})`
    case 'member':
      return `${exprToString(expr.object)}.${expr.property}`
    case 'binary':
      return `${exprToString(expr.left)} ${expr.op} ${exprToString(expr.right)}`
    case 'unary':
      return `${expr.op}${exprToString(expr.argument)}`
    case 'logical':
      return `${exprToString(expr.left)} ${expr.op} ${exprToString(expr.right)}`
    case 'conditional':
      return `${exprToString(expr.test)} ? ${exprToString(expr.consequent)} : ${exprToString(expr.alternate)}`
    case 'template-literal':
      return '`' + expr.parts.map(p =>
        p.type === 'string' ? p.value : `\${${exprToString(p.expr)}}`
      ).join('') + '`'
    case 'unsupported':
      return `[UNSUPPORTED: ${expr.raw}]`
  }
}
