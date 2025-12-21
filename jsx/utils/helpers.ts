/**
 * BarefootJS JSX Compiler - Utility Functions
 */

import ts from 'typescript'

/**
 * PascalCaseかどうか判定（コンポーネントタグの判定用）
 */
export function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

/**
 * TypeScriptの型注釈を除去してJavaScriptに変換
 */
export function stripTypeAnnotations(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
    },
  })
  return result.outputText.trim()
}

/**
 * ソースファイルを作成するヘルパー
 */
export function createSourceFile(source: string, filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
}
