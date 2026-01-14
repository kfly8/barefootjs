/**
 * BarefootJS JSX Compiler - Type Definitions
 */

// ============================================================================
// Compiler Warning Types
// ============================================================================

export type CompilerWarning = {
  type: 'reactive-children'
  message: string
  componentName: string
  parentComponent: string
}

// ============================================================================
// Transform Context Types
// ============================================================================

/**
 * Base context shared by all transformation phases.
 *
 * Contains reactive declarations (signals and memos) that are needed
 * across JSX → IR, IR → Marked JSX, and IR → Client JS transformations.
 */
export interface BaseTransformContext {
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]
}

/**
 * Context for JSX to IR transformation.
 *
 * Used during the first phase of compilation where JSX AST is converted
 * to Intermediate Representation (IR).
 */
export interface JsxToIRContext extends BaseTransformContext {
  /** TypeScript source file being compiled */
  sourceFile: any  // ts.SourceFile - using 'any' to avoid TypeScript import in types
  /** Map of available child components for inlining */
  components: Map<string, CompileResult>
  /** ID generator for creating unique slot IDs */
  idGenerator: any  // IdGenerator - using 'any' to avoid circular import
  /** Warnings collected during compilation */
  warnings: CompilerWarning[]
  /** Current component name being compiled */
  currentComponentName: string
  /** Value prop names (non-callback props) for reactivity detection */
  valueProps: string[]
}

/**
 * Context for Marked JSX generation.
 *
 * Used when converting IR to Marked JSX code that includes
 * hydration markers (data-bf-scope, data-bf, etc.).
 */
export interface MarkedJsxContext extends BaseTransformContext {
  /** Name of the component being generated */
  componentName: string
  /** IDs that need data-bf attribute for querySelector fallback */
  needsDataBfIds: Set<string>
  /** Event ID counter for event attribute output (to match client-side event delegation) */
  eventIdCounter: { value: number } | null
  /** Whether we're inside a list context (for passing __listIndex to child components) */
  inListContext: boolean
  /** Props with default values for SSR/client consistency */
  propsWithDefaults: Map<string, string>
}

/**
 * Context for collecting Client JS information from IR.
 *
 * A lightweight context that only needs signal and memo declarations
 * for determining reactivity during IR traversal.
 */
export type CollectContext = BaseTransformContext

/**
 * Extended context for collecting Client JS information with compile-time evaluation support.
 *
 * When compileTimeEval is provided, components without inlinedIR can be
 * evaluated at compile time if their props are statically known.
 */
export interface CollectContextWithCompileTimeEval extends BaseTransformContext {
  /** Compile-time evaluation context for evaluating components with static props */
  compileTimeEval?: {
    /** Map of component name to CompileResult */
    components: Map<string, CompileResult>
    /** Map of component name to source code */
    componentSources: Map<string, string>
  }
}

/**
 * Context for Client JS code generation.
 *
 * Used during the final phase when generating executable client-side
 * JavaScript for hydration and interactivity.
 */
export interface ClientJsGeneratorContext {
  /** Name of the component being generated */
  componentName: string
  /** Map of element IDs to their DOM traversal paths */
  elementPaths: Map<string, string | null>
  /** Map of declared path prefixes to their variable names for chaining optimization */
  declaredPaths: Map<string, string>
  /** Set of element IDs that have already been queried */
  queriedIds: Set<string>
  /** Function to generate variable name from element ID */
  varName: (id: string) => string
  /** Function to generate optimized element access code */
  getElementAccessCode: (id: string) => string
}

// ============================================================================
// Element Types
// ============================================================================

export type InteractiveElement = {
  id: string
  tagName: string
  events: Array<{
    name: string      // onClick
    eventName: string // click
    handler: string   // () => setCount(n => n + 1)
  }>
}

export type DynamicElement = {
  id: string
  tagName: string
  expression: string    // count()
  fullContent: string   // e.g., "doubled: " + count() * 2
}

export type ListElement = {
  id: string
  tagName: string
  mapExpression: string  // items().map(item => '<li>' + item + '</li>').join('')
  itemEvents: Array<{
    eventId: number       // ID to distinguish events
    eventName: string     // click, change, keydown
    handler: string       // (item) => remove(item.id)
    paramName: string     // item
  }>
  arrayExpression: string // items() - expression to get the array
  /** Key expression for efficient list reconciliation (null if no key) */
  keyExpression: string | null
  /** Parameter name in map callback (e.g., 'item') */
  paramName: string
  /** Item template for rendering */
  itemTemplate: string
}

export type DynamicAttribute = {
  id: string
  tagName: string
  attrName: string       // class, style, disabled, value, etc.
  expression: string     // isActive() ? 'active' : ''
}

export type RefElement = {
  id: string
  tagName: string
  callback: string       // (el) => inputRef = el
}

export type ConditionalElement = {
  id: string
  condition: string           // show()
  whenTrueTemplate: string    // '<span data-bf-cond="0">Content</span>' or '<!--bf-cond-start:0-->...<!--bf-cond-end:0-->'
  whenFalseTemplate: string   // '<!--bf-cond-start:0--><!--bf-cond-end:0-->' (for null)
  /** Interactive elements inside this conditional that need event re-attachment after DOM updates */
  interactiveElements: InteractiveElement[]
  /** Child components inside whenTrue branch that need re-initialization after DOM updates */
  whenTrueChildInits: ChildComponentInit[]
  /** Child components inside whenFalse branch that need re-initialization after DOM updates */
  whenFalseChildInits: ChildComponentInit[]
}

export type SignalDeclaration = {
  getter: string      // count, on
  setter: string      // setCount, setOn
  initialValue: string // 0, false
}

export type MemoDeclaration = {
  getter: string      // doubled
  computation: string // () => count() * 2
}

export type EffectDeclaration = {
  code: string        // createEffect(() => { ... })
}

export type ModuleConstant = {
  name: string        // GRID_SIZE
  value: string       // 100 (literal value as string)
  code: string        // const GRID_SIZE = 100
}

export type LocalFunction = {
  name: string        // handleToggle
  code: string        // const handleToggle = (id) => { ... } - For Client JS (jsx() calls if contains JSX)
  containsJsx: boolean // Whether this function contains JSX elements
  tsxCode?: string    // For Marked JSX (JSX preserved) - only set if containsJsx is true
}

export type LocalVariable = {
  name: string        // placementClass
  code: string        // const placementClass = placementStyles[placement]
}

export type ChildComponentInit = {
  name: string        // AddTodoForm
  propsExpr: string   // { onAdd: handleAdd }
}

export type PropWithType = {
  name: string        // class (the prop name passed to the component)
  localName?: string  // className (the local variable name, if different from name)
  type: string        // boolean
  optional: boolean   // true if has ? or default value
  defaultValue?: string  // 'false', '0', '""' - default value if prop has one
}

export type CompileResult = {
  componentName: string            // Actual component function name (e.g., 'ButtonPage')
  clientJs: string
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]         // Memoized computed values
  effects: EffectDeclaration[]     // User-written createEffect blocks
  moduleConstants: ModuleConstant[] // Module-level constants
  localFunctions: LocalFunction[]  // Functions defined within the component
  moduleFunctions: LocalFunction[] // Module-level functions (outside component)
  localVariables: LocalVariable[]  // Local variables defined within the component (non-function)
  childInits: ChildComponentInit[] // Child components that need initialization
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  listElements: ListElement[]
  dynamicAttributes: DynamicAttribute[]
  refElements: RefElement[]        // Elements with ref callbacks
  conditionalElements: ConditionalElement[]  // Conditional rendering elements
  props: PropWithType[]            // Props with type information
  propsTypeRefName: string | null  // Original type reference name (e.g., "ButtonProps") or null for inline types
  restPropsName: string | null     // Name of rest spread props (e.g., 'props' from ...props)
  typeDefinitions: string[]        // Type definitions used by props
  source: string   // Component source code (for inline expansion in map)
  ir: IRNode | null  // Intermediate Representation for Marked JSX generation
  imports: ComponentImport[]       // Import statements from source file (local only)
  externalImports: ExternalImport[] // External package imports (npm packages)
  isDefaultExport?: boolean        // Whether this component is the default export
  hasUseClientDirective: boolean   // Whether file has "use client" directive
}

export type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
  isDefault: boolean // true for default import, false for named import
}

export type ExternalImport = {
  code: string      // Full import statement code
  path: string      // Module path (e.g., 'class-variance-authority')
  names: string[]   // Imported names (for dependency tracking)
}

export type ComponentOutput = {
  name: string
  hash: string           // Content hash (e.g., 7dc6817c)
  filename: string       // Filename with hash (e.g., AddTodoForm-7dc6817c.js), empty if no client JS
  clientJs: string
  markedJsx: string      // Marked JSX component (for hono/jsx integration)
  props: PropWithType[]  // Props with type information
  hasClientJs: boolean   // Whether this component needs client-side JS
  sourcePath: string     // Relative path from entry (e.g., 'components/Button.tsx')
}

/**
 * File-based output (preserves source file structure)
 *
 * Multiple components in a single source file are kept together in the output.
 */
export type FileOutput = {
  /** Source file path relative to root (e.g., '_shared/docs.tsx') */
  sourcePath: string
  /** Combined Marked JSX containing all component exports */
  markedJsx: string
  /** Combined client JS containing all init functions */
  clientJs: string
  /** Content hash based on all components */
  hash: string
  /** Client JS filename with hash (e.g., 'docs-abc123.js') */
  clientJsFilename: string
  /** Whether this file needs client-side JS */
  hasClientJs: boolean
  /** Component names exported from this file */
  componentNames: string[]
  /** Props for each component (keyed by component name) */
  componentProps: Record<string, PropWithType[]>
  /** Whether file has "use client" directive */
  hasUseClientDirective: boolean
  /** Component dependencies (keyed by component name) - child components that need client-side initialization */
  componentDependencies: Record<string, string[]>
}

export type CompileJSXResult = {
  /** File-based output (preserves source file structure) */
  files: FileOutput[]
}

export type OutputFormat = 'html' | 'jsx'

/**
 * Marked JSX Adapter
 *
 * Abstracts framework-specific Marked JSX component generation.
 */
/** Component data for file-based generation */
export type MarkedJsxComponentData = {
  name: string
  props: PropWithType[]
  /** Original type reference name (e.g., "ButtonProps") or null for inline types */
  propsTypeRefName: string | null
  /** Name of rest spread props (e.g., 'props' from ...props) */
  restPropsName: string | null
  typeDefinitions: string[]
  jsx: string
  ir: IRNode | null
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]
  /** Child components used by this component */
  childComponents: string[]
  /** Local variables defined within the component */
  localVariables?: LocalVariable[]
  /** Whether this component is the default export */
  isDefaultExport?: boolean
}

export type MarkedJsxAdapter = {
  /**
   * Generate Marked JSX file code (multiple components in one file)
   * @param options - File and component information
   * @returns Marked JSX file source code with all component exports
   */
  generateMarkedJsxFile: (options: {
    /** Source file path relative to root (e.g., '_shared/docs.tsx') */
    sourcePath: string
    /** All components in this file */
    components: MarkedJsxComponentData[]
    /** Module-level constants shared by all components */
    moduleConstants: ModuleConstant[]
    /** Module-level helper functions shared by all components */
    moduleFunctions: LocalFunction[]
    /** Original import statements for child components */
    originalImports: ComponentImport[]
    /** External package imports (npm packages like 'class-variance-authority') */
    externalImports: ExternalImport[]
  }) => string

  /**
   * Raw HTML helper configuration for outputting comment nodes.
   * Used for fragment conditional markers (<!--bf-cond-start:N-->).
   *
   * If undefined, the adapter doesn't support __rawHtml() in JSX output.
   * For HTML-only adapters (like testHtmlAdapter), comments are embedded directly.
   */
  rawHtmlHelper?: {
    /** Import statement for raw HTML function (e.g., "import { raw } from 'hono/html'") */
    importStatement: string
    /** Helper code to define __rawHtml (e.g., "const __rawHtml = raw") */
    helperCode: string
  }
}

export type CompileOptions = {
  outputFormat?: OutputFormat  // Default: 'html'
  markedJsxAdapter?: MarkedJsxAdapter  // Required for 'jsx' output
  rootDir?: string  // Root directory for computing relative source paths
  /**
   * Path aliases for resolving imports (e.g., { '@/': '/path/to/src/' })
   * Keys should include the trailing slash for prefix matching.
   * Values should be absolute paths with trailing slash.
   */
  pathAliases?: Record<string, string>
}

export type ListExpressionInfo = {
  mapExpression: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  arrayExpression: string
}

export type MapExpressionResult = {
  mapExpression: string
  initialHtml: string
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  arrayExpression: string
}

export type TemplateStringResult = {
  template: string
  events: Array<{
    eventId: number
    eventName: string
    handler: string
  }>
}


/**
 * Intermediate Representation (IR) Type Definitions
 *
 * Transformed from JSX AST and used to generate various outputs (HTML, ClientJS, MarkedJSX).
 */

export type IRNode =
  | IRElement
  | IRText
  | IRExpression
  | IRComponent
  | IRConditional
  | IRFragment

export type IRElement = {
  type: 'element'
  tagName: string
  id: string | null
  staticAttrs: Array<{ name: string; value: string }>
  dynamicAttrs: Array<{ name: string; expression: string }>
  /** Spread attributes ({...props}) */
  spreadAttrs: Array<{ expression: string }>
  /** Ref callback expression */
  ref: string | null
  events: Array<{ name: string; eventName: string; handler: string }>
  children: IRNode[]
  listInfo: IRListInfo | null
  // Dynamic content info (for elements with signal-dependent children)
  dynamicContent: { expression: string; fullContent: string } | null
}

export type IRText = {
  type: 'text'
  content: string
}

export type IRExpression = {
  type: 'expression'
  expression: string
  isDynamic: boolean
}

export type IRComponent = {
  type: 'component'
  name: string
  props: Array<{ name: string; value: string; isDynamic: boolean }>
  /** Spread props ({...prop}) */
  spreadProps: Array<{ expression: string }>
  staticHtml: string
  childInits: ChildComponentInit | null
  children: IRNode[]  // Children passed to the component
  /** Whether children contain reactive expressions and should be lazy-evaluated */
  hasLazyChildren: boolean
  /** Inlined IR for static components (no client JS) - used in cond() templates */
  inlinedIR?: IRNode
}

export type IRConditional = {
  type: 'conditional'
  id: string | null      // Slot ID for dynamic conditionals (null if static)
  condition: string
  whenTrue: IRNode
  whenFalse: IRNode
}

export type IRListInfo = {
  arrayExpression: string
  paramName: string
  /** User's index parameter name (e.g., 'index' from (item, index) => ...), null if not used */
  indexParamName: string | null
  itemTemplate: string
  /** IR nodes for list item (used for server JSX generation) */
  itemIR: IRNode | null
  itemEvents: Array<{
    eventId: number
    eventName: string
    handler: string
    paramName: string
  }>
  /** Key expression for efficient list reconciliation (null if no key) */
  keyExpression: string | null
}

export type IRFragment = {
  type: 'fragment'
  children: IRNode[]
}
