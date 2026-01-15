/**
 * BarefootJS Compiler v2 - Public API
 */

// Main compiler
export { compileJSX, compileJSXSync } from './compiler'

// Types
export type {
  ComponentIR,
  CompileOptions,
  CompileResult,
  FileOutput,
} from './compiler'

export type {
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRFragment,
  IRSlot,
  IRAttribute,
  IREvent,
  IRProp,
  IRMetadata,
  SignalInfo,
  MemoInfo,
  EffectInfo,
  ImportInfo,
  FunctionInfo,
  ConstantInfo,
  TypeDefinition,
  TypeInfo,
  SourceLocation,
  CompilerError,
} from './types'

// Analyzer
export { analyzeComponent, type AnalyzerContext } from './analyzer'

// JSX to IR
export { jsxToIR } from './jsx-to-ir'

// Adapters
export { HonoAdapter } from './adapters/hono'
export type { TemplateAdapter, AdapterOutput } from './adapters/interface'

// Client JS Generator
export { generateClientJs } from './ir-to-client-js'

// Errors
export { ErrorCodes, createError, formatError, generateCodeFrame } from './errors'
