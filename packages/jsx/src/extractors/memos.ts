/**
 * BarefootJS JSX Compiler - Memo Extractor
 */

import ts from 'typescript'
import type { MemoDeclaration } from '../types'
import { createSourceFile, isPascalCase } from '../utils/helpers'

/**
 * Extracts memo declarations from source code.
 * Detects pattern like const doubled = createMemo(() => count() * 2)
 *
 * @param source - Source code
 * @param filePath - File path
 * @param targetComponentName - Optional: specific component to extract memos from
 */
export function extractMemos(source: string, filePath: string, targetComponentName?: string): MemoDeclaration[] {
  const sourceFile = createSourceFile(source, filePath)

  const memos: MemoDeclaration[] = []

  function visitComponent(node: ts.Node) {
    // Find the target component function
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      // If targetComponentName is specified, only process that component
      if (targetComponentName && node.name.text !== targetComponentName) {
        // Skip this function and continue to siblings
      } else if (!targetComponentName && memos.length > 0) {
        // If no target specified, only process the first PascalCase function found
        return
      } else {
        // Extract memos from within this component function
        if (node.body) {
          extractMemosFromBlock(node.body)
        }
      }
    }
    ts.forEachChild(node, visitComponent)
  }

  function extractMemosFromBlock(block: ts.Block) {
    for (const statement of block.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const decl of statement.declarationList.declarations) {
          extractMemoFromDeclaration(decl)
        }
      }
    }
  }

  function extractMemoFromDeclaration(node: ts.VariableDeclaration) {
    if (ts.isIdentifier(node.name) &&
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
  }

  visitComponent(sourceFile)
  return memos
}
