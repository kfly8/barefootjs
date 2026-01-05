/**
 * BarefootJS JSX Compiler - Effect Extractor
 *
 * Extracts user-written createEffect blocks from source code.
 * These are effects that perform side effects, including those without DOM bindings.
 */

import ts from 'typescript'
import type { EffectDeclaration } from '../types'
import { createSourceFile, stripTypeAnnotations } from '../utils/helpers'
import { isComponentFunction } from './common'

/**
 * Extracts createEffect declarations from source code.
 * Detects pattern like createEffect(() => { ... })
 *
 * Extracts ALL createEffect calls within a component function,
 * including those inside nested functions (event handlers, etc.).
 *
 * @param source - Source code
 * @param filePath - File path
 * @param targetComponentName - Optional: specific component to extract effects from
 */
export function extractEffects(
  source: string,
  filePath: string,
  targetComponentName?: string
): EffectDeclaration[] {
  const sourceFile = createSourceFile(source, filePath)
  const effects: EffectDeclaration[] = []
  let foundComponent = false

  function extractEffectsFromNode(node: ts.Node) {
    // Check for createEffect call expression
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) &&
          node.expression.text === 'createEffect') {
        // Get the full statement if this is part of an expression statement
        let parent = node.parent
        while (parent && !ts.isExpressionStatement(parent) && !ts.isSourceFile(parent)) {
          parent = parent.parent
        }

        const tsCode = ts.isExpressionStatement(parent)
          ? parent.getText(sourceFile)
          : node.getText(sourceFile)
        // Strip TypeScript type annotations to produce valid JavaScript
        const code = stripTypeAnnotations(tsCode)

        effects.push({ code })
      }
    }

    // Recurse into all children
    ts.forEachChild(node, extractEffectsFromNode)
  }

  function visitComponent(node: ts.Node) {
    if (foundComponent) return

    if (isComponentFunction(node)) {
      // If targetComponentName is specified, only process that component
      if (targetComponentName && node.name.text !== targetComponentName) {
        // Skip this function and continue to siblings
      } else if (!targetComponentName && effects.length > 0) {
        // If no target specified, only process the first PascalCase function found
        return
      } else {
        foundComponent = true
        // Extract effects from within this component function
        if (node.body) {
          extractEffectsFromNode(node.body)
        }
      }
    }
    ts.forEachChild(node, visitComponent)
  }

  visitComponent(sourceFile)
  return effects
}
