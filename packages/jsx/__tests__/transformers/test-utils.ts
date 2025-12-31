/**
 * Test Utilities for Transformer Tests
 *
 * Provides common setup and fixtures for testing JSX to IR transformations.
 */

import ts from 'typescript'
import type { JsxToIRContext, SignalDeclaration, MemoDeclaration, CompileResult } from '../../src/types'
import { IdGenerator } from '../../src/utils/id-generator'

/**
 * Parses JSX source code into a TypeScript SourceFile
 */
export function parseJsx(source: string): ts.SourceFile {
  return ts.createSourceFile(
    'test.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
}

/**
 * Creates a JsxToIRContext for testing
 */
export function createContext(
  sourceFile: ts.SourceFile,
  options: {
    signals?: SignalDeclaration[]
    memos?: MemoDeclaration[]
    components?: Map<string, CompileResult>
    valueProps?: string[]
    currentComponentName?: string
  } = {}
): JsxToIRContext {
  return {
    sourceFile,
    signals: options.signals ?? [],
    memos: options.memos ?? [],
    components: options.components ?? new Map(),
    idGenerator: new IdGenerator(),
    warnings: [],
    currentComponentName: options.currentComponentName ?? 'TestComponent',
    valueProps: options.valueProps ?? [],
  }
}

/**
 * Helper to find and return the first JSX element in the source
 */
export function findJsxElement(sourceFile: ts.SourceFile): ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment | null {
  let result: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment | null = null

  function visit(node: ts.Node): void {
    if (result) return

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      result = node
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

/**
 * Helper to find and return the JSX expression inside a JSX element
 */
export function findJsxExpression(sourceFile: ts.SourceFile): ts.JsxExpression | null {
  let result: ts.JsxExpression | null = null

  function visit(node: ts.Node): void {
    if (result) return

    if (ts.isJsxExpression(node)) {
      result = node
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

/**
 * Common signal declarations for testing
 */
export const testSignals: SignalDeclaration[] = [
  { getter: 'count', setter: 'setCount', initialValue: '0' },
  { getter: 'name', setter: 'setName', initialValue: '"John"' },
  { getter: 'isActive', setter: 'setIsActive', initialValue: 'false' },
  { getter: 'items', setter: 'setItems', initialValue: '[]' },
]

/**
 * Common memo declarations for testing
 */
export const testMemos: MemoDeclaration[] = [
  { getter: 'doubled', computation: '() => count() * 2' },
  { getter: 'fullName', computation: '() => name() + " Doe"' },
]

/**
 * Creates a minimal CompileResult for testing component references
 */
export function createMockCompileResult(name: string): CompileResult {
  return {
    componentName: name,
    clientJs: '',
    signals: [],
    memos: [],
    moduleConstants: [],
    localFunctions: [],
    childInits: [],
    interactiveElements: [],
    dynamicElements: [],
    listElements: [],
    dynamicAttributes: [],
    refElements: [],
    conditionalElements: [],
    props: [],
    typeDefinitions: [],
    source: `function ${name}() { return <div /> }`,
    ir: null,
    imports: [],
  }
}
