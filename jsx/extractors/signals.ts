/**
 * BarefootJS JSX Compiler - Signal Extractor
 */

import ts from 'typescript'
import type { SignalDeclaration } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * ソースコードからsignal宣言を抽出
 * const [count, setCount] = createSignal(0) のパターンを検出
 */
export function extractSignals(source: string, filePath: string): SignalDeclaration[] {
  const sourceFile = createSourceFile(source, filePath)

  const signals: SignalDeclaration[] = []

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) &&
        ts.isArrayBindingPattern(node.name) &&
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

          signals.push({ getter, setter, initialValue })
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return signals
}
