/**
 * BarefootJS JSX Compiler - Local Function Extractor
 */

import ts from 'typescript'
import type { SignalDeclaration, LocalFunction } from '../types'
import { createSourceFile, isPascalCase, stripTypeAnnotations } from '../utils/helpers'

/**
 * コンポーネント内で定義されたローカル関数を抽出
 * const handleToggle = (id) => { ... }
 * const handleAdd = () => { ... }
 * ※ signal宣言は除外
 * ※ TypeScript型注釈は除去される
 */
export function extractLocalFunctions(
  source: string,
  filePath: string,
  signals: SignalDeclaration[]
): LocalFunction[] {
  const sourceFile = createSourceFile(source, filePath)

  const localFunctions: LocalFunction[] = []
  const signalNames = new Set(signals.flatMap(s => [s.getter, s.setter]))

  function visit(node: ts.Node) {
    // コンポーネント関数内のみを探索
    if (ts.isFunctionDeclaration(node) && node.name && isPascalCase(node.name.text)) {
      // コンポーネント関数の本体を探索
      if (node.body) {
        for (const statement of node.body.statements) {
          // const handleToggle = (id) => { ... } パターン
          if (ts.isVariableStatement(statement)) {
            for (const decl of statement.declarationList.declarations) {
              if (ts.isIdentifier(decl.name) && decl.initializer) {
                const name = decl.name.text
                // signal宣言は除外（const [count, setCount] = signal(0) は既に別で処理）
                if (signalNames.has(name)) continue
                // signal()呼び出しは除外
                if (ts.isCallExpression(decl.initializer) &&
                    ts.isIdentifier(decl.initializer.expression) &&
                    decl.initializer.expression.text === 'signal') continue

                // アロー関数または関数式の場合
                if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
                  const tsCode = statement.getText(sourceFile)
                  // TypeScript型注釈を除去
                  const code = stripTypeAnnotations(tsCode)
                  localFunctions.push({ name, code })
                }
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return localFunctions
}
