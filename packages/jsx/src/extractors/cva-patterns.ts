/**
 * BarefootJS JSX Compiler - CVA Pattern Extractor
 *
 * Extracts class-variance-authority (cva) patterns for generating
 * lookup maps in client JS for reactive variant/size updates.
 */

import ts from 'typescript'
import type { CvaPatternInfo } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Extracts string value from AST node.
 * Handles string literals and template literals.
 */
function extractStringValue(node: ts.Expression): string | null {
  if (ts.isStringLiteral(node)) {
    return node.text
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  return null
}

/**
 * Extracts object literal as a simple key-value map.
 * Only handles string literal values.
 */
function extractSimpleObject(node: ts.ObjectLiteralExpression): Record<string, string> {
  const result: Record<string, string> = {}

  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = ts.isIdentifier(prop.name)
        ? prop.name.text
        : ts.isStringLiteral(prop.name)
          ? prop.name.text
          : null

      if (key) {
        const value = extractStringValue(prop.initializer)
        if (value !== null) {
          result[key] = value
        }
      }
    }
  }

  return result
}

/**
 * Extracts nested object literal as a map of maps.
 * Used for variants: { variant: { default: '...', destructive: '...' }, size: {...} }
 */
function extractVariantsObject(node: ts.ObjectLiteralExpression): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {}

  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = ts.isIdentifier(prop.name)
        ? prop.name.text
        : ts.isStringLiteral(prop.name)
          ? prop.name.text
          : null

      if (key && ts.isObjectLiteralExpression(prop.initializer)) {
        result[key] = extractSimpleObject(prop.initializer)
      }
    }
  }

  return result
}

/**
 * Parses cva() call expression and extracts pattern info.
 *
 * Expected pattern:
 * cva('base-class', {
 *   variants: { variant: { default: '...', ... }, size: { ... } },
 *   defaultVariants: { variant: 'default', size: 'default' }
 * })
 */
function parseCvaCall(name: string, callExpr: ts.CallExpression): CvaPatternInfo | null {
  // cva expects at least 1 argument (base class)
  if (callExpr.arguments.length < 1) {
    return null
  }

  // First argument: base class (string)
  const baseClassArg = callExpr.arguments[0]
  const baseClass = extractStringValue(baseClassArg) || ''

  // Second argument (optional): options object with variants and defaultVariants
  let variantDefs: Record<string, Record<string, string>> = {}
  let defaultVariants: Record<string, string> = {}

  if (callExpr.arguments.length >= 2) {
    const optionsArg = callExpr.arguments[1]
    if (ts.isObjectLiteralExpression(optionsArg)) {
      for (const prop of optionsArg.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const propName = ts.isIdentifier(prop.name) ? prop.name.text : null

          if (propName === 'variants' && ts.isObjectLiteralExpression(prop.initializer)) {
            variantDefs = extractVariantsObject(prop.initializer)
          }

          if (propName === 'defaultVariants' && ts.isObjectLiteralExpression(prop.initializer)) {
            defaultVariants = extractSimpleObject(prop.initializer)
          }
        }
      }
    }
  }

  // Only return if we have variants defined
  if (Object.keys(variantDefs).length === 0) {
    return null
  }

  return {
    name,
    baseClass,
    variantDefs,
    defaultVariants
  }
}

/**
 * Extracts CVA patterns from source code.
 *
 * Looks for patterns like:
 * const buttonVariants = cva('base-class', {
 *   variants: { variant: {...}, size: {...} },
 *   defaultVariants: { variant: 'default', size: 'default' }
 * })
 */
export function extractCvaPatterns(source: string, filePath: string): CvaPatternInfo[] {
  const sourceFile = createSourceFile(source, filePath)
  const patterns: CvaPatternInfo[] = []

  // Only process top-level statements
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return

    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue

      // Check if initializer is a cva() call
      if (ts.isCallExpression(decl.initializer)) {
        const callExpr = decl.initializer
        const callee = callExpr.expression

        // Check if it's calling 'cva'
        if (ts.isIdentifier(callee) && callee.text === 'cva') {
          const pattern = parseCvaCall(decl.name.text, callExpr)
          if (pattern) {
            patterns.push(pattern)
          }
        }
      }
    }
  })

  return patterns
}
