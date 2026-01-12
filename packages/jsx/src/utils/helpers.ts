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
 * Note: This does not handle JSX - use transpileWithJsx for code containing JSX
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
 * Checks if code contains JSX elements
 * Used to determine which transpilation method to use for module functions
 */
export function containsJsxInCode(code: string): boolean {
  // Match JSX-like patterns:
  // - <tagName (lowercase tag name followed by space or >)
  // - <TagName (PascalCase component name)
  // - </tagName> or </TagName> (closing tags)
  // Exclude: comparison operators like x < y, generics like Array<T>
  return /<[A-Za-z][A-Za-z0-9]*[\s/>]/.test(code) ||
         /<\/[A-Za-z][A-Za-z0-9]*>/.test(code)
}

/**
 * Strips TypeScript type annotations while preserving JSX
 * For Marked JSX output where JSX runtime handles JSX elements
 */
export function stripTypeAnnotationsPreserveJsx(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
      jsx: ts.JsxEmit.Preserve,  // Preserve JSX syntax
    },
  })
  return result.outputText.trim()
}

/**
 * Transpiles TypeScript code with JSX to JavaScript with jsx() calls
 * For Client JS output
 */
export function transpileWithJsx(code: string): string {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      removeComments: false,
      jsx: ts.JsxEmit.React,
      jsxFactory: 'jsx',
      jsxFragmentFactory: 'Fragment',
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
