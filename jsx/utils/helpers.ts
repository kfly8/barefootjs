/**
 * BarefootJS JSX Compiler - Utility Functions
 */

import ts from 'typescript'

/**
 * Checks if string is PascalCase (for component tag detection)
 */
export function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str)
}

/**
 * Strips TypeScript type annotations and converts to JavaScript
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
 * Helper to create source file
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
