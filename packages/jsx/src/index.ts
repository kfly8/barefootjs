/**
 * BarefootJS JSX Compiler
 *
 * Multi-backend JSX compiler that generates Marked Templates and Client JS.
 */

// Main compiler API
export { compileJSX, compileJSXSync } from './compiler'
export type { CompileResult, CompileOptions, CompileOptionsWithAdapter, FileOutput } from './compiler'

// Pure IR types
export type {
  ComponentIR,
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRConditional,
  IRLoop,
  IRLoopChildComponent,
  IRComponent,
  IRFragment,
  IRSlot,
  IRIfStatement,
  IRProvider,
  IRMetadata,
  IRTemplateLiteral,
  IRTemplatePart,
  IRProp,
  ParamInfo,
  TypeInfo,
  SourceLocation,
  CompilerError,
} from './types'

// Analyzer
export { analyzeComponent, listExportedComponents, type AnalyzerContext } from './analyzer'

// JSX to IR transformer
export { jsxToIR } from './jsx-to-ir'

// Adapters
export { BaseAdapter } from './adapters/interface'
export type { TemplateAdapter, AdapterOutput, AdapterGenerateOptions } from './adapters/interface'

// Client JS Generator
export { generateClientJs } from './ir-to-client-js'

// Client JS Combiner (for build scripts)
export { combineParentChildClientJs } from './combine-client-js'

// Errors
export { ErrorCodes, createError, formatError, generateCodeFrame } from './errors'

// Expression Parser
export { parseExpression, isSupported, exprToString, parseBlockBody } from './expression-parser'
export type { ParsedExpr, ParsedStatement, SupportLevel, SupportResult, TemplatePart } from './expression-parser'

// HTML constants
export { BOOLEAN_ATTRS, isBooleanAttr } from './html-constants'

// HTML element attribute types
export type {
  // Event types
  TargetedEvent,
  TargetedInputEvent,
  TargetedFocusEvent,
  TargetedKeyboardEvent,
  TargetedMouseEvent,

  // Event handlers
  InputEventHandler,
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ChangeEventHandler,

  // Base attributes
  BaseEventAttributes,
  HTMLBaseAttributes,

  // Form attribute helper types
  HTMLAttributeFormEnctype,
  HTMLAttributeFormMethod,
  HTMLAttributeAnchorTarget,

  // Element-specific attributes
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  FormHTMLAttributes,
  AnchorHTMLAttributes,
  ImgHTMLAttributes,
  LabelHTMLAttributes,
  OptionHTMLAttributes,
} from './html-types'
