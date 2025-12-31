/**
 * BarefootJS JSX Compiler - Signal Extractor
 */

import ts from 'typescript'
import type { SignalDeclaration } from '../types'
import { createSourceFile } from '../utils/helpers'
import { findComponentFunction, forEachVariableDeclaration, isComponentFunction } from './common'

/**
 * Extracts signal declarations from source code.
 * Detects pattern like const [count, setCount] = createSignal(0)
 *
 * @param source - Source code
 * @param filePath - File path
 * @param targetComponentName - Optional: specific component to extract signals from
 */
export function extractSignals(source: string, filePath: string, targetComponentName?: string): SignalDeclaration[] {
  const sourceFile = createSourceFile(source, filePath)

  const signals: SignalDeclaration[] = []
  const fallbackSignals: SignalDeclaration[] = []
  let foundTargetComponent = false
  let currentTarget: SignalDeclaration[] = signals

  function extractSignalFromDeclaration(node: ts.VariableDeclaration) {
    if (ts.isArrayBindingPattern(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)) {

      const callExpr = node.initializer
      if (ts.isIdentifier(callExpr.expression) &&
          callExpr.expression.text === 'createSignal') {

        const elements = node.name.elements
        if (elements.length === 2 &&
            ts.isBindingElement(elements[0]) &&
            ts.isBindingElement(elements[1]) &&
            ts.isIdentifier(elements[0].name) &&
            ts.isIdentifier(elements[1].name)) {

          const getter = elements[0].name.text
          const setter = elements[1].name.text
          const initialValue = callExpr.arguments[0]?.getText(sourceFile) || '0'

          currentTarget.push({ getter, setter, initialValue })
        }
      }
    }
  }

  function visitComponent(node: ts.Node) {
    // Find the target component function
    if (isComponentFunction(node)) {
      // If targetComponentName is specified, only process that component
      if (targetComponentName && node.name.text !== targetComponentName) {
        // Save first component's signals as fallback
        if (fallbackSignals.length === 0 && node.body) {
          currentTarget = fallbackSignals
          forEachVariableDeclaration(node.body, (decl) => {
            extractSignalFromDeclaration(decl)
          })
          currentTarget = signals
        }
      } else if (!targetComponentName && signals.length > 0) {
        // If no target specified, only process the first PascalCase function found
        return
      } else {
        // Target found (or no target specified)
        foundTargetComponent = true
        if (node.body) {
          forEachVariableDeclaration(node.body, (decl) => {
            extractSignalFromDeclaration(decl)
          })
        }
      }
    }
    ts.forEachChild(node, visitComponent)
  }

  visitComponent(sourceFile)

  // If target component not found, use fallback
  if (signals.length === 0 && !foundTargetComponent && fallbackSignals.length > 0) {
    return fallbackSignals
  }

  return signals
}
