/**
 * BarefootJS Compiler - Pure IR Types
 *
 * JSX-independent intermediate representation for multi-backend support.
 */

// =============================================================================
// Source Location (for Error Reporting)
// =============================================================================

export interface Position {
  line: number // 1-indexed
  column: number // 0-indexed
}

export interface SourceLocation {
  file: string
  start: Position
  end: Position
}

// =============================================================================
// Type Information
// =============================================================================

export type TypeKind =
  | 'primitive'
  | 'object'
  | 'array'
  | 'union'
  | 'function'
  | 'interface'
  | 'unknown'

export interface TypeInfo {
  kind: TypeKind
  raw: string // Original TypeScript type string

  // For primitives
  primitive?: 'string' | 'number' | 'boolean' | 'null' | 'undefined'

  // For objects/interfaces
  properties?: PropertyInfo[]

  // For arrays
  elementType?: TypeInfo

  // For unions
  unionTypes?: TypeInfo[]

  // For functions
  params?: ParamInfo[]
  returnType?: TypeInfo
}

export interface PropertyInfo {
  name: string
  type: TypeInfo
  optional: boolean
  readonly: boolean
}

export interface ParamInfo {
  name: string
  type: TypeInfo
  optional: boolean
  defaultValue?: string
}

// =============================================================================
// IR Node Types
// =============================================================================

export type IRNode =
  | IRElement
  | IRText
  | IRExpression
  | IRConditional
  | IRLoop
  | IRComponent
  | IRSlot
  | IRFragment

export interface IRElement {
  type: 'element'
  tag: string
  attrs: IRAttribute[]
  events: IREvent[]
  ref: string | null
  children: IRNode[]
  slotId: string | null
  needsScope: boolean
  loc: SourceLocation
}

export interface IRText {
  type: 'text'
  value: string
  loc: SourceLocation
}

export interface IRExpression {
  type: 'expression'
  expr: string
  typeInfo: TypeInfo | null
  reactive: boolean
  slotId: string | null
  loc: SourceLocation
  /** When true, expression should be evaluated on client side only */
  clientOnly?: boolean
}

export interface IRConditional {
  type: 'conditional'
  condition: string
  conditionType: TypeInfo | null
  reactive: boolean
  whenTrue: IRNode
  whenFalse: IRNode
  slotId: string | null
  loc: SourceLocation
  /** When true, condition should be evaluated on client side only */
  clientOnly?: boolean
}

/**
 * Child component info for loop rendering with createComponent()
 */
export interface IRLoopChildComponent {
  name: string
  props: Array<{
    name: string
    value: string // Expression (can use loop variables)
    dynamic: boolean
    isLiteral: boolean // true if value came from a string literal attribute
    isEventHandler: boolean
  }>
}

export interface IRLoop {
  type: 'loop'
  array: string
  arrayType: TypeInfo | null
  itemType: TypeInfo | null
  param: string
  index: string | null
  key: string | null
  children: IRNode[]
  slotId: string | null
  loc: SourceLocation

  /**
   * True if the array is a static prop (not a signal).
   * Static arrays don't need reconcileList - SSR elements are hydrated directly.
   * Dynamic signal arrays need reconcileList to update DOM when signal changes.
   */
  isStaticArray: boolean

  /**
   * When the loop body is a single component, store its info here
   * for createComponent-based rendering instead of template strings.
   * This enables proper parent-to-child prop passing (including event handlers).
   */
  childComponent?: IRLoopChildComponent

  /**
   * Filter predicate for filter().map() pattern.
   * When present, the loop renders with an if-condition wrapping each iteration.
   * Example: todos.filter(t => !t.done).map(...) stores { param: 't', expr: '!t.done' }
   */
  filterPredicate?: { param: string; expr: string }

  /**
   * When true, loop should be evaluated on client side only.
   * SSR adapters should skip rendering and output placeholder markers.
   */
  clientOnly?: boolean
}

export interface IRComponent {
  type: 'component'
  name: string
  props: IRProp[]
  propsType: TypeInfo | null
  children: IRNode[]
  template: string // Reference to partial
  slotId: string | null // For components with event handlers
  loc: SourceLocation
}

export interface IRSlot {
  type: 'slot'
  name: string
  loc: SourceLocation
}

export interface IRFragment {
  type: 'fragment'
  children: IRNode[]
  loc: SourceLocation
}

// =============================================================================
// IR Attributes & Events
// =============================================================================

/**
 * Template literal with ternary expressions for structured conditional rendering.
 * Used when attribute values contain template literals with ternaries like:
 * style={`background: ${on() ? '#4caf50' : '#ccc'}`}
 */
export interface IRTemplateLiteral {
  type: 'template-literal'
  parts: IRTemplatePart[]
}

export type IRTemplatePart =
  | { type: 'string'; value: string }
  | { type: 'ternary'; condition: string; whenTrue: string; whenFalse: string }

export interface IRAttribute {
  name: string
  value: string | IRTemplateLiteral | null // null for boolean attrs like 'disabled'
  dynamic: boolean
  isLiteral: boolean // true if value came from a string literal attribute
  loc: SourceLocation
}

export interface IREvent {
  name: string // 'click', 'input', 'keydown'
  handler: string // JS expression: '() => setCount(n => n + 1)'
  loc: SourceLocation
}

export interface IRProp {
  name: string
  value: string
  dynamic: boolean
  isLiteral: boolean // true if value came from a string literal attribute (e.g., value="account")
  loc: SourceLocation
}

// =============================================================================
// Metadata
// =============================================================================

export interface SignalInfo {
  getter: string
  setter: string
  initialValue: string
  type: TypeInfo
  loc: SourceLocation
}

export interface MemoInfo {
  name: string
  computation: string
  type: TypeInfo
  deps: string[]
  loc: SourceLocation
}

export interface EffectInfo {
  body: string
  deps: string[]
  loc: SourceLocation
}

export interface OnMountInfo {
  body: string
  loc: SourceLocation
}

export interface ImportInfo {
  source: string
  specifiers: ImportSpecifier[]
  isTypeOnly: boolean
  loc: SourceLocation
}

export interface ImportSpecifier {
  name: string
  alias: string | null
  isDefault: boolean
  isNamespace: boolean
}

export interface FunctionInfo {
  name: string
  params: ParamInfo[]
  body: string
  returnType: TypeInfo | null
  containsJsx: boolean
  loc: SourceLocation
}

export interface ConstantInfo {
  name: string
  value: string
  type: TypeInfo | null
  loc: SourceLocation
}

export interface TypeDefinition {
  kind: 'interface' | 'type'
  name: string
  definition: string // Original TypeScript definition
  loc: SourceLocation
}

export interface IRMetadata {
  componentName: string
  hasDefaultExport: boolean
  typeDefinitions: TypeDefinition[]
  propsType: TypeInfo | null
  propsParams: ParamInfo[]
  restPropsName: string | null
  signals: SignalInfo[]
  memos: MemoInfo[]
  effects: EffectInfo[]
  onMounts: OnMountInfo[]
  imports: ImportInfo[]
  localFunctions: FunctionInfo[]
  localConstants: ConstantInfo[]
}

// =============================================================================
// Component IR (Complete Output)
// =============================================================================

export interface ComponentIR {
  version: '0.1'
  metadata: IRMetadata
  root: IRNode
  errors: CompilerError[]
}

// =============================================================================
// Error Types
// =============================================================================

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface CompilerError {
  code: string // 'BF001', 'BF002', etc.
  severity: ErrorSeverity
  message: string
  loc: SourceLocation
  suggestion?: ErrorSuggestion
}

export interface ErrorSuggestion {
  message: string
  replacement?: string
}

// =============================================================================
// Compile Options & Results
// =============================================================================

export interface CompileOptions {
  outputIR?: boolean // Output *.ir.json
  sourceMaps?: boolean
}

export interface FileOutput {
  path: string
  content: string
  type: 'markedTemplate' | 'clientJs' | 'ir'
}

export interface CompileResult {
  files: FileOutput[]
  errors: CompilerError[]
}
