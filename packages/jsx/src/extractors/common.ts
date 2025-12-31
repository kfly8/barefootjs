/**
 * BarefootJS JSX Compiler - Common Extractor Utilities
 *
 * Shared utilities for component function detection and traversal patterns.
 */

import ts from 'typescript'
import { isPascalCase } from '../utils/helpers'

/**
 * Checks if a node is a PascalCase function declaration (a component function).
 *
 * @param node - AST node to check
 * @returns true if the node is a named function with PascalCase name
 */
export function isComponentFunction(node: ts.Node): node is ts.FunctionDeclaration & { name: ts.Identifier } {
  return (
    ts.isFunctionDeclaration(node) &&
    node.name !== undefined &&
    isPascalCase(node.name.text)
  )
}

/**
 * Finds the first component function in a source file.
 *
 * If targetName is provided, finds the component with that specific name.
 * Otherwise, finds the first PascalCase function declaration.
 *
 * @param sourceFile - Source file to search
 * @param targetName - Optional: specific component name to find
 * @returns The found function declaration, or undefined if not found
 */
export function findComponentFunction(
  sourceFile: ts.SourceFile,
  targetName?: string
): (ts.FunctionDeclaration & { name: ts.Identifier }) | undefined {
  let found: (ts.FunctionDeclaration & { name: ts.Identifier }) | undefined

  function visit(node: ts.Node) {
    if (found) return

    if (isComponentFunction(node)) {
      if (targetName) {
        if (node.name.text === targetName) {
          found = node
        }
      } else {
        found = node
      }
    }

    if (!found) {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)
  return found
}

/**
 * Options for forEachComponentFunction.
 */
export type ForEachComponentOptions = {
  /**
   * Skip components matching this name.
   * Useful for excluding the main component when finding local components.
   */
  excludeName?: string

  /**
   * Additional predicate to filter components.
   * Only components that pass this predicate will be processed.
   */
  predicate?: (node: ts.FunctionDeclaration & { name: ts.Identifier }) => boolean
}

/**
 * Iterates over all component functions in a source file.
 *
 * Useful for extractors that need to process all components (like local-components.ts).
 *
 * @param sourceFile - Source file to search
 * @param callback - Called for each component found
 * @param options - Optional filtering options
 */
export function forEachComponentFunction(
  sourceFile: ts.SourceFile,
  callback: (component: ts.FunctionDeclaration & { name: ts.Identifier }, name: string) => void,
  options?: ForEachComponentOptions
): void {
  ts.forEachChild(sourceFile, (node) => {
    if (isComponentFunction(node)) {
      const name = node.name.text

      // Skip excluded name
      if (options?.excludeName && name === options.excludeName) {
        return
      }

      // Apply additional predicate
      if (options?.predicate && !options.predicate(node)) {
        return
      }

      callback(node, name)
    }
  })
}

/**
 * Iterates over all variable declarations in a function body.
 *
 * This is the common pattern for extracting signals, memos, and local functions.
 *
 * @param body - Function body block
 * @param callback - Called for each variable declaration found
 */
export function forEachVariableDeclaration(
  body: ts.Block,
  callback: (decl: ts.VariableDeclaration, statement: ts.VariableStatement) => void
): void {
  for (const statement of body.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        callback(decl, statement)
      }
    }
  }
}
