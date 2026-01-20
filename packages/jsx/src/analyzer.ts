/**
 * BarefootJS Compiler - Single-Pass Analyzer
 *
 * Analyzes TypeScript/JSX source code in a single pass,
 * extracting all necessary metadata for IR generation.
 */

import ts from 'typescript'
import type { ImportSpecifier, TypeInfo, ParamInfo } from './types'
import {
  type AnalyzerContext,
  createAnalyzerContext,
  getSourceLocation,
  typeNodeToTypeInfo,
  isComponentFunction,
  isArrowComponentFunction,
} from './analyzer-context'
import { createError, ErrorCodes } from './errors'

// =============================================================================
// Main Entry Point
// =============================================================================

export function analyzeComponent(
  source: string,
  filePath: string,
  targetComponentName?: string
): AnalyzerContext {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const ctx = createAnalyzerContext(sourceFile, filePath)

  // If no target specified, prioritize the default exported component
  if (!targetComponentName) {
    targetComponentName = findDefaultExportedComponent(sourceFile)
  }

  // Single pass visitor
  visit(sourceFile, ctx, targetComponentName)

  // Post-processing validations
  validateContext(ctx)

  return ctx
}

/**
 * Find the name of the default exported component in the source file.
 * Returns undefined if no default export or if it doesn't export a component.
 */
function findDefaultExportedComponent(sourceFile: ts.SourceFile): string | undefined {
  let defaultExportName: string | undefined

  function findDefaultExport(node: ts.Node): void {
    // export default ComponentName
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      if (ts.isIdentifier(node.expression)) {
        defaultExportName = node.expression.text
      }
    }
    ts.forEachChild(node, findDefaultExport)
  }

  ts.forEachChild(sourceFile, findDefaultExport)
  return defaultExportName
}

// =============================================================================
// Single Pass Visitor
// =============================================================================

function visit(
  node: ts.Node,
  ctx: AnalyzerContext,
  targetComponentName?: string
): void {
  // Check for 'use client' directive at module level
  if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression)) {
    if (
      node.expression.text === 'use client' ||
      node.expression.text === "'use client'"
    ) {
      ctx.hasUseClientDirective = true
    }
  }

  // Import declarations
  if (ts.isImportDeclaration(node)) {
    collectImport(node, ctx)
  }

  // Type definitions (interface, type alias)
  if (ts.isInterfaceDeclaration(node)) {
    collectInterfaceDefinition(node, ctx)
  }
  if (ts.isTypeAliasDeclaration(node)) {
    collectTypeAliasDefinition(node, ctx)
  }

  // Component function
  if (isComponentFunction(node)) {
    if (!targetComponentName || node.name.text === targetComponentName) {
      if (!ctx.componentName) {
        ctx.componentName = node.name.text
        ctx.componentNode = node
        analyzeComponentBody(node, ctx)
      }
    } else {
      // Skip recursion into non-target component bodies
      return
    }
  }

  // Arrow function component
  if (isArrowComponentFunction(node)) {
    if (!targetComponentName || node.name.text === targetComponentName) {
      if (!ctx.componentName) {
        ctx.componentName = node.name.text
        ctx.componentNode = node.initializer
        analyzeComponentBody(node.initializer, ctx)
      }
    } else {
      // Skip recursion into non-target component bodies
      return
    }
  }

  // Module-level constants (outside component)
  if (ts.isVariableStatement(node) && !ctx.componentNode) {
    for (const decl of node.declarationList.declarations) {
      if (
        ts.isIdentifier(decl.name) &&
        decl.initializer &&
        !isArrowComponentFunction(decl)
      ) {
        collectConstant(decl, ctx, true)
      }
    }
  }

  // Module-level functions (outside component)
  if (ts.isFunctionDeclaration(node) && node.name && !isComponentFunction(node)) {
    collectFunction(node, ctx, true)
  }

  // Default export: export default ComponentName
  if (ts.isExportAssignment(node) && !node.isExportEquals) {
    const expr = node.expression
    if (ts.isIdentifier(expr)) {
      // Check if it exports the component
      if (ctx.componentName && expr.text === ctx.componentName) {
        ctx.hasDefaultExport = true
      }
    }
  }

  ts.forEachChild(node, (child) => visit(child, ctx, targetComponentName))
}

// =============================================================================
// Component Body Analysis
// =============================================================================

function analyzeComponentBody(
  node: ts.FunctionDeclaration | ts.ArrowFunction,
  ctx: AnalyzerContext
): void {
  // Extract props
  if (node.parameters.length > 0) {
    extractProps(node.parameters[0], ctx)
  }

  // Visit component body
  const body = ts.isFunctionDeclaration(node) ? node.body : getArrowFunctionBody(node)
  if (body) {
    visitComponentBody(body, ctx)
  }
}

function getArrowFunctionBody(
  node: ts.ArrowFunction
): ts.Block | ts.Expression | undefined {
  if (ts.isBlock(node.body)) {
    return node.body
  }
  return node.body
}

function visitComponentBody(node: ts.Node, ctx: AnalyzerContext): void {
  // Variable declarations (signals, memos, constants)
  if (ts.isVariableStatement(node)) {
    for (const decl of node.declarationList.declarations) {
      if (isSignalDeclaration(decl)) {
        collectSignal(decl, ctx)
      } else if (isMemoDeclaration(decl)) {
        collectMemo(decl, ctx)
      } else if (ts.isIdentifier(decl.name) && decl.initializer) {
        collectConstant(decl, ctx, false)
      }
    }
  }

  // Effect calls - collect the effect but don't recurse into it
  if (ts.isExpressionStatement(node)) {
    if (isEffectCall(node.expression)) {
      collectEffect(node.expression as ts.CallExpression, ctx)
      // Don't recurse into createEffect body to avoid collecting inner variables
      return
    }
  }

  // Function declarations inside component
  if (ts.isFunctionDeclaration(node) && node.name) {
    collectFunction(node, ctx, false)
  }

  // Return statement with JSX
  if (ts.isReturnStatement(node) && node.expression) {
    if (
      ts.isJsxElement(node.expression) ||
      ts.isJsxFragment(node.expression) ||
      ts.isJsxSelfClosingElement(node.expression)
    ) {
      ctx.jsxReturn = node.expression
    }
    // Handle parenthesized JSX: return ( <div>...</div> )
    if (ts.isParenthesizedExpression(node.expression)) {
      const inner = node.expression.expression
      if (
        ts.isJsxElement(inner) ||
        ts.isJsxFragment(inner) ||
        ts.isJsxSelfClosingElement(inner)
      ) {
        ctx.jsxReturn = inner
      }
    }
  }

  // Arrow function with implicit return (JSX body)
  if (
    (ts.isJsxElement(node) ||
      ts.isJsxFragment(node) ||
      ts.isJsxSelfClosingElement(node)) &&
    !ctx.jsxReturn
  ) {
    ctx.jsxReturn = node
  }

  // Skip recursion into function bodies (arrow functions, function expressions)
  // to avoid collecting inner local variables
  ts.forEachChild(node, (child) => {
    // Don't recurse into arrow functions or function expressions
    if (ts.isArrowFunction(child) || ts.isFunctionExpression(child)) {
      return
    }
    visitComponentBody(child, ctx)
  })
}

// =============================================================================
// Signal Detection & Collection
// =============================================================================

function isSignalDeclaration(node: ts.VariableDeclaration): boolean {
  if (!ts.isArrayBindingPattern(node.name)) return false
  if (!node.initializer || !ts.isCallExpression(node.initializer)) return false

  const callExpr = node.initializer
  return (
    ts.isIdentifier(callExpr.expression) &&
    callExpr.expression.text === 'createSignal'
  )
}

function collectSignal(node: ts.VariableDeclaration, ctx: AnalyzerContext): void {
  const pattern = node.name as ts.ArrayBindingPattern
  const callExpr = node.initializer as ts.CallExpression

  const elements = pattern.elements
  if (
    elements.length !== 2 ||
    !ts.isBindingElement(elements[0]) ||
    !ts.isBindingElement(elements[1]) ||
    !ts.isIdentifier(elements[0].name) ||
    !ts.isIdentifier(elements[1].name)
  ) {
    return
  }

  const getter = elements[0].name.text
  const setter = elements[1].name.text
  const initialValue = callExpr.arguments[0]?.getText(ctx.sourceFile) || ''

  // Try to infer type from initial value or type argument
  let type: TypeInfo = { kind: 'unknown', raw: 'unknown' }

  // Check for type argument: createSignal<number>(0)
  if (callExpr.typeArguments && callExpr.typeArguments.length > 0) {
    type = typeNodeToTypeInfo(callExpr.typeArguments[0], ctx.sourceFile) ?? type
  } else {
    // Infer from initial value
    type = inferTypeFromValue(initialValue)
  }

  ctx.signals.push({
    getter,
    setter,
    initialValue,
    type,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Memo Detection & Collection
// =============================================================================

function isMemoDeclaration(node: ts.VariableDeclaration): boolean {
  if (!ts.isIdentifier(node.name)) return false
  if (!node.initializer || !ts.isCallExpression(node.initializer)) return false

  const callExpr = node.initializer
  return (
    ts.isIdentifier(callExpr.expression) &&
    callExpr.expression.text === 'createMemo'
  )
}

function collectMemo(node: ts.VariableDeclaration, ctx: AnalyzerContext): void {
  const name = (node.name as ts.Identifier).text
  const callExpr = node.initializer as ts.CallExpression
  const computation = callExpr.arguments[0]?.getText(ctx.sourceFile) || ''

  // Extract dependencies from computation
  const deps = extractDependencies(computation, ctx)

  // Try to infer type
  let type: TypeInfo = { kind: 'unknown', raw: 'unknown' }
  if (callExpr.typeArguments && callExpr.typeArguments.length > 0) {
    type = typeNodeToTypeInfo(callExpr.typeArguments[0], ctx.sourceFile) ?? type
  }

  ctx.memos.push({
    name,
    computation,
    type,
    deps,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Effect Detection & Collection
// =============================================================================

function isEffectCall(node: ts.Expression): boolean {
  if (!ts.isCallExpression(node)) return false
  return (
    ts.isIdentifier(node.expression) && node.expression.text === 'createEffect'
  )
}

function collectEffect(node: ts.CallExpression, ctx: AnalyzerContext): void {
  const body = node.arguments[0]?.getText(ctx.sourceFile) || ''
  const deps = extractDependencies(body, ctx)

  ctx.effects.push({
    body,
    deps,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Import Collection
// =============================================================================

function collectImport(node: ts.ImportDeclaration, ctx: AnalyzerContext): void {
  const source = (node.moduleSpecifier as ts.StringLiteral).text
  const specifiers: ImportSpecifier[] = []
  const isTypeOnly = !!node.importClause?.isTypeOnly

  if (node.importClause) {
    // Default import
    if (node.importClause.name) {
      specifiers.push({
        name: node.importClause.name.text,
        alias: null,
        isDefault: true,
        isNamespace: false,
      })
    }

    // Named imports
    if (node.importClause.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        for (const element of node.importClause.namedBindings.elements) {
          specifiers.push({
            name: element.propertyName?.text ?? element.name.text,
            alias: element.propertyName ? element.name.text : null,
            isDefault: false,
            isNamespace: false,
          })
        }
      }
      // Namespace import
      if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        specifiers.push({
          name: node.importClause.namedBindings.name.text,
          alias: null,
          isDefault: false,
          isNamespace: true,
        })
      }
    }
  }

  ctx.imports.push({
    source,
    specifiers,
    isTypeOnly,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Type Definition Collection
// =============================================================================

function collectInterfaceDefinition(
  node: ts.InterfaceDeclaration,
  ctx: AnalyzerContext
): void {
  ctx.typeDefinitions.push({
    kind: 'interface',
    name: node.name.text,
    definition: node.getText(ctx.sourceFile),
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

function collectTypeAliasDefinition(
  node: ts.TypeAliasDeclaration,
  ctx: AnalyzerContext
): void {
  ctx.typeDefinitions.push({
    kind: 'type',
    name: node.name.text,
    definition: node.getText(ctx.sourceFile),
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Function Collection
// =============================================================================

function collectFunction(
  node: ts.FunctionDeclaration,
  ctx: AnalyzerContext,
  _isModule: boolean
): void {
  if (!node.name) return

  const name = node.name.text
  const params: ParamInfo[] = node.parameters.map((p) => ({
    name: p.name.getText(ctx.sourceFile),
    type: typeNodeToTypeInfo(p.type, ctx.sourceFile) ?? {
      kind: 'unknown',
      raw: 'unknown',
    },
    optional: !!p.questionToken,
    defaultValue: p.initializer?.getText(ctx.sourceFile),
  }))
  const body = node.body?.getText(ctx.sourceFile) || ''
  const returnType = typeNodeToTypeInfo(node.type, ctx.sourceFile)

  // Check if function contains JSX
  const containsJsx = body.includes('<') && (body.includes('/>') || body.includes('</'))

  ctx.localFunctions.push({
    name,
    params,
    body,
    returnType,
    containsJsx,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Constant Collection
// =============================================================================

function collectConstant(
  node: ts.VariableDeclaration,
  ctx: AnalyzerContext,
  _isModule: boolean
): void {
  if (!ts.isIdentifier(node.name) || !node.initializer) return

  // Skip if it's a signal or memo
  if (isSignalDeclaration(node) || isMemoDeclaration(node)) return

  const name = node.name.text
  const value = node.initializer.getText(ctx.sourceFile)

  // Get type from annotation or infer
  let type: TypeInfo | null = null
  if (node.type) {
    type = typeNodeToTypeInfo(node.type, ctx.sourceFile)
  } else {
    type = inferTypeFromValue(value)
  }

  ctx.localConstants.push({
    name,
    value,
    type,
    loc: getSourceLocation(node, ctx.sourceFile, ctx.filePath),
  })
}

// =============================================================================
// Props Extraction
// =============================================================================

function extractProps(param: ts.ParameterDeclaration, ctx: AnalyzerContext): void {
  // Destructured props: { prop1, prop2 }
  if (ts.isObjectBindingPattern(param.name)) {
    for (const element of param.name.elements) {
      if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
        const localName = element.name.text
        const defaultValue = element.initializer?.getText(ctx.sourceFile)

        // Handle rest props: { ...props }
        if (element.dotDotDotToken) {
          ctx.restPropsName = localName
          continue
        }

        ctx.propsParams.push({
          name: localName,
          type: { kind: 'unknown', raw: 'unknown' },
          optional: !!element.initializer,
          defaultValue,
        })
      }
    }
  }

  // Get props type annotation
  if (param.type) {
    ctx.propsType = typeNodeToTypeInfo(param.type, ctx.sourceFile)
  }
}

// =============================================================================
// Helpers
// =============================================================================

function inferTypeFromValue(value: string): TypeInfo {
  const trimmed = value.trim()

  // Number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { kind: 'primitive', raw: 'number', primitive: 'number' }
  }

  // Boolean
  if (trimmed === 'true' || trimmed === 'false') {
    return { kind: 'primitive', raw: 'boolean', primitive: 'boolean' }
  }

  // String
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`'))
  ) {
    return { kind: 'primitive', raw: 'string', primitive: 'string' }
  }

  // Array
  if (trimmed.startsWith('[')) {
    return { kind: 'array', raw: 'unknown[]' }
  }

  // Object
  if (trimmed.startsWith('{')) {
    return { kind: 'object', raw: 'object' }
  }

  // Null/undefined
  if (trimmed === 'null') {
    return { kind: 'primitive', raw: 'null', primitive: 'null' }
  }
  if (trimmed === 'undefined') {
    return { kind: 'primitive', raw: 'undefined', primitive: 'undefined' }
  }

  return { kind: 'unknown', raw: 'unknown' }
}

function extractDependencies(code: string, ctx: AnalyzerContext): string[] {
  const deps: string[] = []

  // Find signal getter calls: signalName()
  for (const signal of ctx.signals) {
    const pattern = new RegExp(`\\b${signal.getter}\\s*\\(`, 'g')
    if (pattern.test(code)) {
      deps.push(signal.getter)
    }
  }

  // Find memo calls: memoName()
  for (const memo of ctx.memos) {
    const pattern = new RegExp(`\\b${memo.name}\\s*\\(`, 'g')
    if (pattern.test(code)) {
      deps.push(memo.name)
    }
  }

  return deps
}

// =============================================================================
// Validation
// =============================================================================

function validateContext(ctx: AnalyzerContext): void {
  // Check for 'use client' directive if signals/events exist
  if (ctx.signals.length > 0 && !ctx.hasUseClientDirective) {
    ctx.errors.push(
      createError(ErrorCodes.MISSING_USE_CLIENT, {
        file: ctx.filePath,
        start: { line: 1, column: 0 },
        end: { line: 1, column: 0 },
      })
    )
  }
}

// =============================================================================
// List Exported Components
// =============================================================================

/**
 * Returns all exported component names in the file.
 * Useful for files with multiple components (e.g., icon.tsx).
 */
export function listExportedComponents(
  source: string,
  filePath: string
): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  const componentNames: string[] = []

  function collectComponents(node: ts.Node): void {
    // Exported function declaration
    if (isComponentFunction(node)) {
      componentNames.push(node.name.text)
    }

    // Exported arrow function component
    if (isArrowComponentFunction(node)) {
      componentNames.push(node.name.text)
    }

    ts.forEachChild(node, collectComponents)
  }

  ts.forEachChild(sourceFile, collectComponents)

  return componentNames
}

// =============================================================================
// Export
// =============================================================================

export { type AnalyzerContext } from './analyzer-context'
