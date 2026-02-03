/**
 * Expression Parser for BarefootJS
 *
 * Parses JavaScript expressions into a structured AST-like representation
 * using TypeScript Compiler API. This enables proper support detection
 * and conversion to backend template syntax.
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
  | { kind: 'arrow-fn'; param: string; body: ParsedExpr }
  | { kind: 'higher-order'; method: 'filter' | 'every' | 'some'; object: ParsedExpr; param: string; predicate: ParsedExpr }
  | { kind: 'unsupported'; raw: string; reason: string }

export type TemplatePart =
  | { type: 'string'; value: string }
  | { type: 'expression'; expr: ParsedExpr }

// =============================================================================
// Parsed Statement Types (for block body arrow functions)
// =============================================================================

export type ParsedStatement =
  | { kind: 'var-decl'; name: string; init: ParsedExpr }
  | { kind: 'return'; value: ParsedExpr }
  | {
      kind: 'if';
      condition: ParsedExpr;
      consequent: ParsedStatement[];
      alternate?: ParsedStatement[];  // else / else if chain
    }

// =============================================================================
// Support Level Classification
// =============================================================================

export type SupportLevel =
  | 'L1' // Simple identifiers and signals: count(), name
  | 'L2' // Member access and .length: user.name, items().length
  | 'L3' // Comparison operators: count() > 0, filter() === 'all'
  | 'L4' // Logical operators: a && b, !isLoading()
  | 'L5' // Higher-order functions with simple predicates: items().filter(x => !x.done).length
  | 'L5_UNSUPPORTED' // Higher-order functions with complex predicates

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

    // Detect higher-order methods: arr.filter(x => pred), arr.every(x => pred), arr.some(x => pred)
    if (callee.kind === 'member' && ['filter', 'every', 'some'].includes(callee.property)) {
      if (args.length === 1 && args[0].kind === 'arrow-fn') {
        const arrowFn = args[0] as { kind: 'arrow-fn'; param: string; body: ParsedExpr }
        return {
          kind: 'higher-order',
          method: callee.property as 'filter' | 'every' | 'some',
          object: callee.object,
          param: arrowFn.param,
          predicate: arrowFn.body,
        }
      }
    }

    return { kind: 'call', callee, args }
  }

  // Property access: user.name, items().length
  if (ts.isPropertyAccessExpression(node)) {
    const object = convertNode(node.expression, raw)
    const property = node.name.text

    // Return as normal member - filter.length is handled in adapter
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

  // Arrow function: x => expr
  if (ts.isArrowFunction(node)) {
    // Only support single parameter without destructuring
    if (node.parameters.length !== 1) {
      return { kind: 'unsupported', raw, reason: 'Only single parameter arrow functions are supported' }
    }
    const param = node.parameters[0]
    if (!ts.isIdentifier(param.name)) {
      return { kind: 'unsupported', raw, reason: 'Destructuring parameters are not supported' }
    }
    const paramName = param.name.text

    // Only expression body is supported (not block body)
    if (ts.isBlock(node.body)) {
      return { kind: 'unsupported', raw, reason: 'Block body arrow functions are not supported' }
    }

    const body = convertNode(node.body, raw)
    return { kind: 'arrow-fn', param: paramName, body }
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

    // Nullish coalescing
    case ts.SyntaxKind.QuestionQuestionToken: return '??'

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
 * Check if a parsed expression is supported for SSR template conversion.
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

    case 'arrow-fn': {
      // Arrow functions are only supported as arguments to higher-order methods
      // They shouldn't appear standalone in supported contexts
      return { supported: false, reason: 'Standalone arrow functions are not supported' }
    }

    case 'higher-order': {
      // Check if predicate uses L1-L4 features
      const predSupport = checkSupport(expr.predicate)
      if (!predSupport.supported) {
        return {
          supported: false,
          level: 'L5_UNSUPPORTED',
          reason: `Higher-order method '${expr.method}()' with complex predicate. ${predSupport.reason || 'Simplify the predicate.'}`,
        }
      }
      // Nested higher-order (e.g., arr.filter(...).filter(...)) is not supported
      if (containsHigherOrder(expr.predicate)) {
        return {
          supported: false,
          level: 'L5_UNSUPPORTED',
          reason: `Nested higher-order methods are not supported. Use @client directive.`,
        }
      }
      return { supported: true, level: 'L5' }
    }


    case 'call': {
      // Check if callee is supported
      const calleeSupport = checkSupport(expr.callee)
      if (!calleeSupport.supported) {
        return calleeSupport
      }

      // Check for higher-order array methods: items().filter(...)
      // This handles the case where the pattern wasn't recognized as higher-order
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

/**
 * Check if expression contains any higher-order method calls.
 */
function containsHigherOrder(expr: ParsedExpr): boolean {
  switch (expr.kind) {
    case 'higher-order':
      return true
    case 'call':
      return expr.args.some(containsHigherOrder) || containsHigherOrder(expr.callee)
    case 'member':
      return containsHigherOrder(expr.object)
    case 'binary':
      return containsHigherOrder(expr.left) || containsHigherOrder(expr.right)
    case 'unary':
      return containsHigherOrder(expr.argument)
    case 'logical':
      return containsHigherOrder(expr.left) || containsHigherOrder(expr.right)
    case 'conditional':
      return containsHigherOrder(expr.test) || containsHigherOrder(expr.consequent) || containsHigherOrder(expr.alternate)
    case 'arrow-fn':
      return containsHigherOrder(expr.body)
    default:
      return false
  }
}

// =============================================================================
// Debug Helper
// =============================================================================

// =============================================================================
// Block Body Parser (for arrow functions with block body)
// =============================================================================

/**
 * Parse a block body into ParsedStatement array.
 * Used for filter predicates with block bodies like:
 * ```
 * filter(t => {
 *   const f = filter()
 *   if (f === 'active') return !t.done
 *   return true
 * })
 * ```
 */
export function parseBlockBody(block: ts.Block, sourceFile: ts.SourceFile): ParsedStatement[] | null {
  const statements: ParsedStatement[] = []

  for (const stmt of block.statements) {
    const parsed = parseStatement(stmt, sourceFile)
    if (parsed === null) {
      // Unsupported statement type
      return null
    }
    statements.push(parsed)
  }

  return statements
}

/**
 * Parse a single statement into ParsedStatement.
 */
function parseStatement(stmt: ts.Statement, sourceFile: ts.SourceFile): ParsedStatement | null {
  // Variable declaration: const f = filter()
  if (ts.isVariableStatement(stmt)) {
    const decl = stmt.declarationList.declarations[0]
    if (!decl || !ts.isIdentifier(decl.name) || !decl.initializer) {
      return null
    }
    const name = decl.name.text
    const initText = decl.initializer.getText(sourceFile)
    const init = parseExpression(initText)
    if (init.kind === 'unsupported') {
      return null
    }
    return { kind: 'var-decl', name, init }
  }

  // Return statement: return !t.done
  if (ts.isReturnStatement(stmt)) {
    if (!stmt.expression) {
      // return; (no value) -> return undefined, treat as return true
      return { kind: 'return', value: { kind: 'literal', value: true, literalType: 'boolean' } }
    }
    const valueText = stmt.expression.getText(sourceFile)
    const value = parseExpression(valueText)
    if (value.kind === 'unsupported') {
      return null
    }
    return { kind: 'return', value }
  }

  // If statement: if (f === 'active') return !t.done
  if (ts.isIfStatement(stmt)) {
    const conditionText = stmt.expression.getText(sourceFile)
    const condition = parseExpression(conditionText)
    if (condition.kind === 'unsupported') {
      return null
    }

    // Parse consequent (then branch)
    const consequent = parseIfBranch(stmt.thenStatement, sourceFile)
    if (consequent === null) {
      return null
    }

    // Parse alternate (else branch) if present
    let alternate: ParsedStatement[] | undefined
    if (stmt.elseStatement) {
      // else if -> recurse as if statement
      if (ts.isIfStatement(stmt.elseStatement)) {
        const elseIf = parseStatement(stmt.elseStatement, sourceFile)
        if (elseIf === null) {
          return null
        }
        alternate = [elseIf]
      } else {
        // else { ... }
        const elseBranch = parseIfBranch(stmt.elseStatement, sourceFile)
        if (elseBranch === null) {
          return null
        }
        alternate = elseBranch
      }
    }

    return { kind: 'if', condition, consequent, alternate }
  }

  // Unsupported statement (for, while, switch, etc.)
  return null
}

/**
 * Parse an if branch (then or else) into ParsedStatement array.
 */
function parseIfBranch(branch: ts.Statement, sourceFile: ts.SourceFile): ParsedStatement[] | null {
  // Block: { ... }
  if (ts.isBlock(branch)) {
    return parseBlockBody(branch, sourceFile)
  }

  // Single statement (no braces): return !t.done
  const parsed = parseStatement(branch, sourceFile)
  if (parsed === null) {
    return null
  }
  return [parsed]
}

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
    case 'arrow-fn':
      return `${expr.param} => ${exprToString(expr.body)}`
    case 'higher-order':
      return `${exprToString(expr.object)}.${expr.method}(${expr.param} => ${exprToString(expr.predicate)})`
    case 'unsupported':
      return `[UNSUPPORTED: ${expr.raw}]`
  }
}

// =============================================================================
// Prop Reference Transformation
// =============================================================================

/**
 * Operator precedence for stringifyExpr.
 * Higher number = higher precedence (binds tighter).
 */
const OPERATOR_PRECEDENCE: Record<string, number> = {
  '??': 4,
  '||': 4,
  '&&': 5,
  '|': 6,
  '^': 7,
  '&': 8,
  '===': 10,
  '!==': 10,
  '==': 10,
  '!=': 10,
  '>': 11,
  '<': 11,
  '>=': 11,
  '<=': 11,
  '+': 13,
  '-': 13,
  '*': 14,
  '/': 14,
  '%': 14,
}

/**
 * Convert ParsedExpr to JavaScript string with proper operator precedence.
 * Unlike exprToString(), this produces valid JS code with parentheses where needed.
 */
export function stringifyExpr(expr: ParsedExpr, parentPrecedence = 0): string {
  switch (expr.kind) {
    case 'identifier':
      return expr.name

    case 'literal':
      if (expr.literalType === 'string') return `'${expr.value}'`
      if (expr.value === null) return 'null'
      return String(expr.value)

    case 'call':
      return `${stringifyExpr(expr.callee, 20)}(${expr.args.map(a => stringifyExpr(a, 0)).join(', ')})`

    case 'member':
      if (expr.computed) {
        return `${stringifyExpr(expr.object, 20)}[${expr.property}]`
      }
      return `${stringifyExpr(expr.object, 20)}.${expr.property}`

    case 'binary': {
      const prec = OPERATOR_PRECEDENCE[expr.op] ?? 0
      const inner = `${stringifyExpr(expr.left, prec)} ${expr.op} ${stringifyExpr(expr.right, prec + 1)}`
      return prec < parentPrecedence ? `(${inner})` : inner
    }

    case 'unary':
      return `${expr.op}${stringifyExpr(expr.argument, 16)}`

    case 'logical': {
      const prec = OPERATOR_PRECEDENCE[expr.op] ?? 0
      const inner = `${stringifyExpr(expr.left, prec)} ${expr.op} ${stringifyExpr(expr.right, prec + 1)}`
      return prec < parentPrecedence ? `(${inner})` : inner
    }

    case 'conditional': {
      // Ternary has very low precedence (3)
      const inner = `${stringifyExpr(expr.test, 4)} ? ${stringifyExpr(expr.consequent, 0)} : ${stringifyExpr(expr.alternate, 0)}`
      return parentPrecedence > 3 ? `(${inner})` : inner
    }

    case 'template-literal':
      return '`' + expr.parts.map(p =>
        p.type === 'string' ? p.value : `\${${stringifyExpr(p.expr, 0)}}`
      ).join('') + '`'

    case 'arrow-fn':
      return `${expr.param} => ${stringifyExpr(expr.body, 0)}`

    case 'higher-order':
      return `${stringifyExpr(expr.object, 20)}.${expr.method}(${expr.param} => ${stringifyExpr(expr.predicate, 0)})`

    case 'unsupported':
      return expr.raw
  }
}

/**
 * Transform prop references in a ParsedExpr.
 * Converts bare identifier like `open` to `props.open` or `(props.open ?? defaultValue)`.
 * Skips identifiers already prefixed with `props.` (member access on props object).
 */
export function transformPropReferences(
  expr: ParsedExpr,
  propNames: Set<string>,
  defaultValues: Map<string, string>
): ParsedExpr {
  return transformPropReferencesNode(expr, propNames, defaultValues, false)
}

/**
 * Internal recursive helper for transformPropReferences.
 * @param expr - The expression node to transform
 * @param propNames - Set of prop names to transform
 * @param defaultValues - Map of prop name to default value
 * @param skipTransform - If true, don't transform identifiers (used for props.xxx property)
 */
function transformPropReferencesNode(
  expr: ParsedExpr,
  propNames: Set<string>,
  defaultValues: Map<string, string>,
  skipTransform: boolean
): ParsedExpr {
  switch (expr.kind) {
    case 'identifier': {
      // Skip if we're the property part of props.xxx
      if (skipTransform) return expr
      // Skip if not a prop name
      if (!propNames.has(expr.name)) return expr

      // Transform: open -> props.open or (props.open ?? default)
      const defaultVal = defaultValues.get(expr.name)
      const memberExpr: ParsedExpr = {
        kind: 'member',
        object: { kind: 'identifier', name: 'props' },
        property: expr.name,
        computed: false,
      }

      if (defaultVal !== undefined) {
        // Wrap with nullish coalescing: (props.open ?? defaultValue)
        const defaultExpr = parseExpression(defaultVal)
        return {
          kind: 'binary',
          op: '??',
          left: memberExpr,
          right: defaultExpr.kind !== 'unsupported' ? defaultExpr : { kind: 'identifier', name: defaultVal },
        }
      }
      return memberExpr
    }

    case 'member':
      // For props.xxx pattern, the property is not an identifier to transform.
      // We only transform the object part (which won't match if it's 'props').
      return {
        ...expr,
        object: transformPropReferencesNode(expr.object, propNames, defaultValues, false),
      }

    case 'call':
      return {
        ...expr,
        callee: transformPropReferencesNode(expr.callee, propNames, defaultValues, false),
        args: expr.args.map(a => transformPropReferencesNode(a, propNames, defaultValues, false)),
      }

    case 'binary':
      return {
        ...expr,
        left: transformPropReferencesNode(expr.left, propNames, defaultValues, false),
        right: transformPropReferencesNode(expr.right, propNames, defaultValues, false),
      }

    case 'unary':
      return {
        ...expr,
        argument: transformPropReferencesNode(expr.argument, propNames, defaultValues, false),
      }

    case 'logical':
      return {
        ...expr,
        left: transformPropReferencesNode(expr.left, propNames, defaultValues, false),
        right: transformPropReferencesNode(expr.right, propNames, defaultValues, false),
      }

    case 'conditional':
      return {
        ...expr,
        test: transformPropReferencesNode(expr.test, propNames, defaultValues, false),
        consequent: transformPropReferencesNode(expr.consequent, propNames, defaultValues, false),
        alternate: transformPropReferencesNode(expr.alternate, propNames, defaultValues, false),
      }

    case 'template-literal':
      return {
        ...expr,
        parts: expr.parts.map(p =>
          p.type === 'string'
            ? p
            : { ...p, expr: transformPropReferencesNode(p.expr, propNames, defaultValues, false) }
        ),
      }

    case 'arrow-fn':
      // Don't transform the arrow fn parameter name
      const paramName = expr.param
      const filteredPropNames = new Set([...propNames].filter(n => n !== paramName))
      return {
        ...expr,
        body: transformPropReferencesNode(expr.body, filteredPropNames, defaultValues, false),
      }

    case 'higher-order':
      // Don't transform the callback parameter name
      const hoParamName = expr.param
      const hoFilteredPropNames = new Set([...propNames].filter(n => n !== hoParamName))
      return {
        ...expr,
        object: transformPropReferencesNode(expr.object, propNames, defaultValues, false),
        predicate: transformPropReferencesNode(expr.predicate, hoFilteredPropNames, defaultValues, false),
      }

    case 'literal':
    case 'unsupported':
      return expr
  }
}
