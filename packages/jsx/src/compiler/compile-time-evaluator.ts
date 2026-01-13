/**
 * Compile-Time Component Evaluator
 *
 * Evaluates components with known props at compile time to generate
 * actual HTML for templates instead of placeholders.
 *
 * This is the core of the compile-time evaluation system that enables
 * components like Icon to be inlined into conditional templates.
 */

import ts from 'typescript'
import { createSourceFile } from '../utils/helpers'
import type { CompileResult, ChildComponentInit } from '../types'
import {
  evaluateExpression,
  createEmptyContext,
  evaluatedValueToExpression,
  type EvalContext,
  type EvaluatedValue
} from './expression-evaluator'
import { extractModuleConstantsAsValues } from '../extractors/constants'
import { analyzeComponentBody, extractComponentProps } from './component-analyzer'

/**
 * Result of compile-time component evaluation
 */
export interface CompileTimeEvalResult {
  /** Generated HTML for the component */
  html: string
  /** Nested child components that need runtime initialization */
  nestedChildInits: ChildComponentInit[]
}

/**
 * Context for compile-time evaluation
 */
export interface CompileTimeEvalContext {
  /** Map of component name to CompileResult */
  components: Map<string, CompileResult>
  /** Map of component name to source code */
  componentSources: Map<string, string>
  /** Current evaluation depth (for cycle detection) */
  depth: number
  /** Maximum evaluation depth */
  maxDepth: number
}

/**
 * Creates a new compile-time evaluation context
 */
export function createCompileTimeContext(
  components: Map<string, CompileResult>,
  componentSources: Map<string, string>
): CompileTimeEvalContext {
  return {
    components,
    componentSources,
    depth: 0,
    maxDepth: 10
  }
}

/**
 * Creates a minimal CompileResult for components found in source files
 * but not in the components map (e.g., nested components)
 */
function createMinimalCompileResult(componentName: string): CompileResult {
  return {
    componentName,
    clientJs: '',
    signals: [],
    memos: [],
    effects: [],
    moduleConstants: [],
    localFunctions: [],
    moduleFunctions: [],
    localVariables: [],
    childInits: [],
    interactiveElements: [],
    dynamicElements: [],
    listElements: [],
    dynamicAttributes: [],
    refElements: [],
    conditionalElements: [],
    props: [],
    propsTypeRefName: null,
    restPropsName: null,
    typeDefinitions: [],
    source: '',
    ir: null,
    imports: [],
    externalImports: [],
    hasUseClientDirective: false
  }
}

/**
 * Evaluates a component with specific props at compile time.
 *
 * @param componentName - Name of the component to evaluate
 * @param props - Props to pass to the component (as expression strings)
 * @param ctx - Compile-time evaluation context
 * @returns Evaluation result with HTML and nested child inits, or null if not evaluable
 */
export function evaluateComponentWithProps(
  componentName: string,
  props: Map<string, string>,
  ctx: CompileTimeEvalContext
): CompileTimeEvalResult | null {
  // Check depth limit
  if (ctx.depth >= ctx.maxDepth) {
    return null
  }

  let componentResult = ctx.components.get(componentName)
  let componentSource = ctx.componentSources.get(componentName)

  // If component not found directly, check if it's defined in one of our source files
  // This handles the case where nested components (like Icon inside SunIcon) are in the same file
  if (!componentSource || !componentResult) {
    for (const [, source] of ctx.componentSources) {
      // Check if this source file defines the component we're looking for
      const analysis = analyzeComponentBody(source, componentName)
      if (analysis) {
        componentSource = source
        // Create a minimal result if we don't have one
        if (!componentResult) {
          componentResult = createMinimalCompileResult(componentName)
        }
        break
      }
    }
  }

  // Need both source and result to proceed
  if (!componentSource || !componentResult) {
    return null
  }

  // Analyze component body
  const analysis = analyzeComponentBody(componentSource, componentName)
  if (!analysis) {
    return null
  }

  // Get component's declared props (with defaults)
  const declaredProps = extractComponentProps(componentSource, componentName)

  // Build evaluation context
  const evalCtx = createEmptyContext()

  // Add module constants
  const moduleConstants = extractModuleConstantsAsValues(componentSource, `${componentName}.tsx`)
  for (const [name, value] of moduleConstants) {
    evalCtx.moduleConstants.set(name, value)
  }

  // Add signal/memo getters (these cannot be evaluated at compile time)
  for (const signal of componentResult.signals) {
    evalCtx.signalGetters.add(signal.getter)
  }
  for (const memo of componentResult.memos) {
    evalCtx.memoGetters.add(memo.getter)
  }

  // Evaluate props and add to context
  for (const declaredProp of declaredProps) {
    const propExpr = props.get(declaredProp.name)
    let propValue: EvaluatedValue

    if (propExpr !== undefined) {
      // Prop was passed - evaluate it
      propValue = evaluateExpression(propExpr, evalCtx)
    } else if (declaredProp.defaultValue !== undefined) {
      // Use default value
      propValue = evaluateExpression(declaredProp.defaultValue, evalCtx)
    } else {
      // No value and no default - cannot evaluate
      propValue = { kind: 'unknown' }
    }

    // Store under local name (e.g., className for class: className)
    evalCtx.props.set(declaredProp.localName, propValue)
    evalCtx.variables.set(declaredProp.localName, propValue)
  }

  // Evaluate variable declarations in order
  for (const varDecl of analysis.variableDeclarations) {
    const value = evaluateExpression(varDecl.expression, evalCtx)
    evalCtx.variables.set(varDecl.name, value)
  }

  // Evaluate conditional returns to find which branch to take
  for (const condReturn of analysis.conditionalReturns) {
    const conditionValue = evaluateExpression(condReturn.condition, evalCtx)

    // Convert condition value to JavaScript truthy/falsy
    const isTruthy = isTruthyValue(conditionValue)

    if (isTruthy === true) {
      // This branch is taken - evaluate the return JSX
      return evaluateJsxExpression(condReturn.returnExpression, evalCtx, {
        ...ctx,
        depth: ctx.depth + 1
      })
    } else if (isTruthy === false) {
      // This branch is not taken - continue to next condition
      continue
    } else {
      // Condition is dynamic or unknown - cannot evaluate at compile time
      return null
    }
  }

  // No conditional branch was taken - evaluate final return
  if (analysis.finalReturnExpression) {
    return evaluateJsxExpression(analysis.finalReturnExpression, evalCtx, {
      ...ctx,
      depth: ctx.depth + 1
    })
  }

  return null
}

/**
 * Evaluates a JSX expression at compile time
 */
function evaluateJsxExpression(
  jsxExpr: string,
  evalCtx: EvalContext,
  ctx: CompileTimeEvalContext
): CompileTimeEvalResult | null {
  // Handle null return
  if (jsxExpr === 'null') {
    return { html: '', nestedChildInits: [] }
  }

  // Parse the JSX expression
  const sourceFile = createSourceFile(`const __jsx = ${jsxExpr}`, '__jsx.tsx')
  const statement = sourceFile.statements[0]

  if (!ts.isVariableStatement(statement)) {
    return null
  }

  const decl = statement.declarationList.declarations[0]
  if (!decl.initializer) {
    return null
  }

  return evaluateJsxNode(decl.initializer, evalCtx, ctx, sourceFile)
}

/**
 * Evaluates a JSX AST node at compile time
 */
function evaluateJsxNode(
  node: ts.Expression,
  evalCtx: EvalContext,
  ctx: CompileTimeEvalContext,
  sourceFile: ts.SourceFile
): CompileTimeEvalResult | null {
  // JSX Element: <div>...</div>
  if (ts.isJsxElement(node)) {
    return evaluateJsxElement(node, evalCtx, ctx, sourceFile)
  }

  // Self-closing JSX: <Icon />
  if (ts.isJsxSelfClosingElement(node)) {
    return evaluateJsxSelfClosingElement(node, evalCtx, ctx, sourceFile)
  }

  // JSX Fragment: <>...</>
  if (ts.isJsxFragment(node)) {
    return evaluateJsxFragment(node, evalCtx, ctx, sourceFile)
  }

  // Parenthesized expression
  if (ts.isParenthesizedExpression(node)) {
    return evaluateJsxNode(node.expression, evalCtx, ctx, sourceFile)
  }

  return null
}

/**
 * Evaluates a JSX element (with opening and closing tags)
 */
function evaluateJsxElement(
  node: ts.JsxElement,
  evalCtx: EvalContext,
  ctx: CompileTimeEvalContext,
  sourceFile: ts.SourceFile
): CompileTimeEvalResult | null {
  const tagName = node.openingElement.tagName.getText(sourceFile)

  // Check if it's a component (PascalCase)
  if (isComponentTag(tagName)) {
    // Extract props from JSX attributes
    const props = extractJsxProps(node.openingElement.attributes, evalCtx, sourceFile)

    // Recursively evaluate the component
    return evaluateComponentWithProps(tagName, props, ctx)
  }

  // It's an HTML element
  const attrs = evaluateJsxAttributes(node.openingElement.attributes, evalCtx, sourceFile)
  if (attrs === null) {
    return null // Has dynamic attributes we can't resolve
  }

  // Evaluate children
  const childResults = evaluateJsxChildren(node.children, evalCtx, ctx, sourceFile)
  if (childResults === null) {
    return null
  }

  // Build HTML
  const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
  const childHtml = childResults.html
  const html = `<${tagName}${attrString}>${childHtml}</${tagName}>`

  return {
    html,
    nestedChildInits: childResults.nestedChildInits
  }
}

/**
 * Evaluates a self-closing JSX element
 */
function evaluateJsxSelfClosingElement(
  node: ts.JsxSelfClosingElement,
  evalCtx: EvalContext,
  ctx: CompileTimeEvalContext,
  sourceFile: ts.SourceFile
): CompileTimeEvalResult | null {
  const tagName = node.tagName.getText(sourceFile)

  // Check if it's a component
  if (isComponentTag(tagName)) {
    const props = extractJsxProps(node.attributes, evalCtx, sourceFile)
    return evaluateComponentWithProps(tagName, props, ctx)
  }

  // It's an HTML element
  const attrs = evaluateJsxAttributes(node.attributes, evalCtx, sourceFile)
  if (attrs === null) {
    return null
  }

  // Self-closing tags
  const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
  const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : ''

  const html = selfClosingTags.includes(tagName.toLowerCase())
    ? `<${tagName}${attrString}>`
    : `<${tagName}${attrString}></${tagName}>`

  return { html, nestedChildInits: [] }
}

/**
 * Evaluates a JSX fragment
 */
function evaluateJsxFragment(
  node: ts.JsxFragment,
  evalCtx: EvalContext,
  ctx: CompileTimeEvalContext,
  sourceFile: ts.SourceFile
): CompileTimeEvalResult | null {
  const childResults = evaluateJsxChildren(node.children, evalCtx, ctx, sourceFile)
  return childResults
}

/**
 * Evaluates JSX children
 */
function evaluateJsxChildren(
  children: ts.NodeArray<ts.JsxChild>,
  evalCtx: EvalContext,
  ctx: CompileTimeEvalContext,
  sourceFile: ts.SourceFile
): CompileTimeEvalResult | null {
  let html = ''
  const nestedChildInits: ChildComponentInit[] = []

  for (const child of children) {
    if (ts.isJsxText(child)) {
      // Whitespace/text
      const text = child.text
      // Skip pure whitespace
      if (text.trim()) {
        html += escapeHtml(text.trim())
      }
    } else if (ts.isJsxExpression(child) && child.expression) {
      // Expression: {value}
      const value = evaluateExpression(child.expression.getText(sourceFile), evalCtx)
      if (value.kind === 'literal') {
        html += escapeHtml(String(value.value ?? ''))
      } else if (value.kind === 'dynamic') {
        // Dynamic content - can't evaluate
        return null
      } else {
        return null
      }
    } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
      const result = evaluateJsxNode(child, evalCtx, ctx, sourceFile)
      if (result === null) {
        return null
      }
      html += result.html
      nestedChildInits.push(...result.nestedChildInits)
    }
  }

  return { html, nestedChildInits }
}

/**
 * Evaluates JSX attributes and returns HTML attribute strings
 */
function evaluateJsxAttributes(
  attributes: ts.JsxAttributes,
  evalCtx: EvalContext,
  sourceFile: ts.SourceFile
): string[] | null {
  const result: string[] = []

  for (const attr of attributes.properties) {
    if (ts.isJsxAttribute(attr)) {
      const attrName = attr.name.getText(sourceFile)
      // Convert className to class
      const htmlAttrName = attrName === 'className' ? 'class' : attrName

      if (!attr.initializer) {
        // Boolean attribute: <div disabled />
        result.push(htmlAttrName)
      } else if (ts.isStringLiteral(attr.initializer)) {
        // String literal: <div class="foo" />
        result.push(`${htmlAttrName}="${escapeHtmlAttr(attr.initializer.text)}"`)
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        // Expression: <div class={value} />
        const value = evaluateExpression(attr.initializer.expression.getText(sourceFile), evalCtx)

        if (value.kind === 'literal') {
          if (value.value === true) {
            result.push(htmlAttrName)
          } else if (value.value !== false && value.value !== null) {
            result.push(`${htmlAttrName}="${escapeHtmlAttr(String(value.value))}"`)
          }
        } else if (value.kind === 'dynamic') {
          // Dynamic attribute - can't evaluate at compile time
          return null
        } else {
          return null
        }
      }
    } else if (ts.isJsxSpreadAttribute(attr)) {
      // Spread attribute: <div {...props} />
      // Can't handle at compile time
      return null
    }
  }

  return result
}

/**
 * Extracts props from JSX attributes as expression strings
 */
function extractJsxProps(
  attributes: ts.JsxAttributes,
  evalCtx: EvalContext,
  sourceFile: ts.SourceFile
): Map<string, string> {
  const props = new Map<string, string>()

  for (const attr of attributes.properties) {
    if (ts.isJsxAttribute(attr)) {
      const attrName = attr.name.getText(sourceFile)

      if (!attr.initializer) {
        // Boolean attribute
        props.set(attrName, 'true')
      } else if (ts.isStringLiteral(attr.initializer)) {
        // String literal
        props.set(attrName, JSON.stringify(attr.initializer.text))
      } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
        // Expression - evaluate and convert back to expression string
        const exprText = attr.initializer.expression.getText(sourceFile)
        const value = evaluateExpression(exprText, evalCtx)

        if (value.kind === 'literal' || value.kind === 'object' || value.kind === 'array') {
          // Use evaluated value
          const expr = evaluatedValueToExpression(value)
          if (expr !== null) {
            props.set(attrName, expr)
          } else {
            props.set(attrName, exprText)
          }
        } else if (value.kind === 'dynamic') {
          // Keep as dynamic expression
          props.set(attrName, value.expression)
        } else {
          props.set(attrName, exprText)
        }
      }
    }
  }

  return props
}

/**
 * Checks if a tag name is a component (PascalCase)
 */
function isComponentTag(tagName: string): boolean {
  return /^[A-Z]/.test(tagName)
}

/**
 * Converts an EvaluatedValue to JavaScript truthy/falsy.
 * Returns true for truthy, false for falsy, or null if the value is dynamic/unknown.
 */
function isTruthyValue(value: EvaluatedValue): boolean | null {
  if (value.kind === 'literal') {
    // JavaScript truthy/falsy rules
    if (value.value === null || value.value === false || value.value === '' || value.value === 0) {
      return false
    }
    return true
  }

  if (value.kind === 'object') {
    // Objects are always truthy in JavaScript
    return true
  }

  if (value.kind === 'array') {
    // Arrays are always truthy in JavaScript
    return true
  }

  // Dynamic or unknown - cannot determine
  return null
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Escapes HTML attribute value
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Attempts to evaluate a component call from an IR node.
 * This is the entry point for integrating with ir-to-client-js.ts.
 *
 * @param componentName - Name of the component to evaluate
 * @param propsExpr - Props expression string (e.g., '{ size: "md" }')
 * @param ctx - Compile-time evaluation context
 * @returns HTML string or null if not evaluable
 */
export function tryEvaluateComponentCall(
  componentName: string,
  propsExpr: string,
  ctx: CompileTimeEvalContext
): string | null {
  // Parse props expression
  const propsValue = evaluateExpression(propsExpr, createEmptyContext())

  if (propsValue.kind !== 'object') {
    return null
  }

  // Convert to Map<string, string>
  const props = new Map<string, string>()
  for (const [key, value] of propsValue.entries) {
    const expr = evaluatedValueToExpression(value)
    if (expr === null) {
      return null
    }
    props.set(key, expr)
  }

  const result = evaluateComponentWithProps(componentName, props, ctx)
  return result?.html ?? null
}
