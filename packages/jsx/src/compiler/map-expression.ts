/**
 * JSX Compiler - Map Expression Handler
 *
 * Detects map expressions like items().map(item => <li>{item}</li>)
 * and transforms them into template literals.
 */

import ts from 'typescript'
import type {
  CompileResult,
  SignalDeclaration,
  MapExpressionResult,
} from '../types'
import { replaceSignalCalls } from '../extractors/expression'
import { evaluateArrayExpression, evaluateTemplate } from './utils'
import { jsxToTemplateString } from './template-generator'

/**
 * Extracts map expression.
 * Detects pattern like items().map(item => <li>{item}</li>)
 */
export function extractMapExpression(
  expr: ts.Expression,
  sourceFile: ts.SourceFile,
  signals: SignalDeclaration[],
  components: Map<string, CompileResult> = new Map()
): MapExpressionResult | null {
  // Detect .map() in CallExpression
  if (!ts.isCallExpression(expr)) return null

  const callExpr = expr
  if (!ts.isPropertyAccessExpression(callExpr.expression)) return null

  const propAccess = callExpr.expression
  if (propAccess.name.text !== 'map') return null

  // Get map callback
  const callback = callExpr.arguments[0]
  if (!callback) return null

  // If callback is an arrow function
  if (ts.isArrowFunction(callback)) {
    const param = callback.parameters[0]
    if (!param) return null
    const paramName = param.name.getText(sourceFile)

    // If callback body is a JSX element
    const body = callback.body
    let jsxBody: ts.JsxElement | ts.JsxSelfClosingElement | null = null

    if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body)) {
      jsxBody = body
    } else if (ts.isParenthesizedExpression(body)) {
      const inner = body.expression
      if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
        jsxBody = inner
      }
    }

    if (jsxBody) {
      // Convert JSX to template literal format
      const templateResult = jsxToTemplateString(jsxBody, sourceFile, paramName, components)
      const arrayExpr = propAccess.expression.getText(sourceFile)

      // Use __index if there are events
      const hasEvents = templateResult.events.length > 0
      const mapParams = hasEvents ? `(${paramName}, __index)` : paramName
      const mapExpression = `${arrayExpr}.map(${mapParams} => ${templateResult.template}).join('')`

      // Generate HTML using initial values
      const initialHtml = evaluateMapWithInitialValues(arrayExpr, paramName, templateResult.template, signals)

      // Collect event information
      const itemEvents = templateResult.events.map(e => ({
        eventId: e.eventId,
        eventName: e.eventName,
        handler: e.handler,
        paramName,
      }))

      return { mapExpression, initialHtml, itemEvents, arrayExpression: arrayExpr }
    }
  }

  return null
}

/**
 * Evaluates map expression with initial values to generate HTML.
 * Uses TypeScript API to accurately replace signal calls.
 */
export function evaluateMapWithInitialValues(
  arrayExpr: string,
  paramName: string,
  templateStr: string,
  signals: SignalDeclaration[]
): string {
  // Find signal calls from array expression and get initial values
  // Supports patterns like items() or items().filter(...)

  // Create expression with signal calls replaced by initial values (AST-based)
  const replaced = replaceSignalCalls(arrayExpr, signals)

  // Safely evaluate array
  const arrayValue = evaluateArrayExpression(replaced)
  if (arrayValue === null) {
    return ''
  }

  // Apply template to each element (without eval)
  try {
    const results = arrayValue.map((item, __index) => {
      // Safely evaluate template literal
      // templateStr is in format like `<li>${item}</li>`
      return evaluateTemplate(templateStr, paramName, item, __index)
    })
    return results.join('')
  } catch {
    return ''
  }
}
