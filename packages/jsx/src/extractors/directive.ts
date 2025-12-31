/**
 * BarefootJS JSX Compiler - Directive Extractor
 *
 * Detects "use client" directive at the start of a file.
 * Following the React Server Components convention.
 */

import ts from 'typescript'
import { createSourceFile } from '../utils/helpers'

/**
 * Extracts "use client" directive from file
 *
 * The directive must be at the very start of the file (before any imports).
 * It can be a string literal expression statement: "use client" or 'use client'
 *
 * @param source - Source code
 * @param filePath - File path (for error messages)
 * @returns true if "use client" directive is present
 */
export function extractUseClientDirective(source: string, filePath: string): boolean {
  const sourceFile = createSourceFile(source, filePath)

  // Check the first statement in the file
  for (const statement of sourceFile.statements) {
    // Skip leading comments by checking actual statement
    if (ts.isExpressionStatement(statement)) {
      const expr = statement.expression
      if (ts.isStringLiteral(expr)) {
        const text = expr.text
        if (text === 'use client') {
          return true
        }
      }
      // If first expression statement is not "use client", stop checking
      // The directive must be at the very start
      break
    }

    // If first statement is an import or other declaration, no directive
    break
  }

  return false
}

/**
 * Validates that @barefootjs/dom imports are only used with "use client" directive
 *
 * @param source - Source code
 * @param filePath - File path (for error messages)
 * @param hasUseClientDirective - Whether the file has "use client" directive
 * @throws Error if @barefootjs/dom is imported without "use client"
 */
export function validateDomImports(
  source: string,
  filePath: string,
  hasUseClientDirective: boolean
): void {
  if (hasUseClientDirective) {
    // Directive present, no validation needed
    return
  }

  const sourceFile = createSourceFile(source, filePath)

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        const modulePath = moduleSpecifier.text
        if (modulePath === '@barefootjs/dom') {
          // Extract imported names for better error message
          const importedNames: string[] = []
          const importClause = statement.importClause
          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            for (const element of importClause.namedBindings.elements) {
              importedNames.push(element.name.getText(sourceFile))
            }
          }

          const namesStr = importedNames.length > 0
            ? ` (${importedNames.join(', ')})`
            : ''

          throw new Error(
            `Build error in ${filePath}: ` +
            `@barefootjs/dom${namesStr} requires "use client" directive.\n\n` +
            `Add "use client" at the top of the file to use reactive APIs:\n\n` +
            `  "use client"\n` +
            `  import { ${importedNames.join(', ') || 'createSignal'} } from '@barefootjs/dom'\n`
          )
        }
      }
    }
  }
}

/**
 * Validates that event handlers are only used with "use client" directive
 *
 * Event handlers like onClick, onChange, etc. require client-side JavaScript
 * to function, so files using them must have the "use client" directive.
 *
 * @param source - Source code
 * @param filePath - File path (for error messages)
 * @param hasUseClientDirective - Whether the file has "use client" directive
 * @throws Error if event handlers are used without "use client"
 */
export function validateEventHandlers(
  source: string,
  filePath: string,
  hasUseClientDirective: boolean
): void {
  if (hasUseClientDirective) {
    // Directive present, no validation needed
    return
  }

  const sourceFile = createSourceFile(source, filePath)
  const eventHandlers: string[] = []

  // Recursively find event handlers in JSX
  function visit(node: ts.Node): void {
    if (ts.isJsxAttribute(node)) {
      const attrName = node.name.getText(sourceFile)
      // Check for event handler attributes (onClick, onChange, onBlur, etc.)
      if (/^on[A-Z]/.test(attrName)) {
        if (!eventHandlers.includes(attrName)) {
          eventHandlers.push(attrName)
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (eventHandlers.length > 0) {
    const handlersStr = eventHandlers.join(', ')
    throw new Error(
      `Build error in ${filePath}: ` +
      `Event handlers (${handlersStr}) require "use client" directive.\n\n` +
      `Components with event handlers need client-side JavaScript to function.\n` +
      `Add "use client" at the top of the file:\n\n` +
      `  "use client"\n` +
      `  // ... your component code\n`
    )
  }
}
