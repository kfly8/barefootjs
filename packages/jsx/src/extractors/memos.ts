/**
 * BarefootJS JSX Compiler - Memo Extractor
 */

import ts from 'typescript'
import type { MemoDeclaration } from '../types'
import { createSourceFile } from '../utils/helpers'

/**
 * Extracts memo declarations from source code.
 * Detects pattern like const doubled = createMemo(() => count() * 2)
 */
export function extractMemos(source: string, filePath: string): MemoDeclaration[] {
  const sourceFile = createSourceFile(source, filePath)

  const memos: MemoDeclaration[] = []

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)) {

      const callExpr = node.initializer
      if (ts.isIdentifier(callExpr.expression) &&
          callExpr.expression.text === 'createMemo') {

        const getter = node.name.text
        const computation = callExpr.arguments[0]?.getText(sourceFile) || '() => null'

        memos.push({ getter, computation })
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return memos
}
