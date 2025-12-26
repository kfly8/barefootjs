/**
 * BarefootJS JSX Compiler - Type Definitions
 */

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

export type ModuleConstant = {
  name: string        // GRID_SIZE
  value: string       // 100 (literal value as string)
  code: string        // const GRID_SIZE = 100
}

export type LocalFunction = {
  name: string        // handleToggle
  code: string        // const handleToggle = (id) => { ... }
}

export type ChildComponentInit = {
  name: string        // AddTodoForm
  propsExpr: string   // { onAdd: handleAdd }
}

export type PropWithType = {
  name: string        // showCounter
  type: string        // boolean
  optional: boolean   // true if has ? or default value
}

export type CompileResult = {
  componentName: string            // Actual component function name (e.g., 'ButtonPage')
  clientJs: string
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]         // Memoized computed values
  moduleConstants: ModuleConstant[] // Module-level constants
  localFunctions: LocalFunction[]  // Functions defined within the component
  childInits: ChildComponentInit[] // Child components that need initialization
  interactiveElements: InteractiveElement[]
  dynamicElements: DynamicElement[]
  listElements: ListElement[]
  dynamicAttributes: DynamicAttribute[]
  refElements: RefElement[]        // Elements with ref callbacks
  conditionalElements: ConditionalElement[]  // Conditional rendering elements
  props: PropWithType[]            // Props with type information
  typeDefinitions: string[]        // Type definitions used by props
  source: string   // Component source code (for inline expansion in map)
  ir: IRNode | null  // Intermediate Representation for server JSX generation
  imports: ComponentImport[]       // Import statements from source file
  isDefaultExport?: boolean        // Whether this component is the default export
}

export type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
  isDefault: boolean // true for default import, false for named import
}

export type ComponentOutput = {
  name: string
  hash: string           // Content hash (e.g., 7dc6817c)
  filename: string       // Filename with hash (e.g., AddTodoForm-7dc6817c.js), empty if no client JS
  clientJs: string
  serverJsx: string      // Server JSX component (for hono/jsx integration)
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
  /** Combined server JSX containing all component exports */
  serverJsx: string
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
}

export type CompileJSXResult = {
  /** @deprecated Use files instead. Component-based output for backward compatibility */
  components: ComponentOutput[]
  /** File-based output (preserves source file structure) */
  files: FileOutput[]
}

export type OutputFormat = 'html' | 'jsx'

/**
 * Server Component Adapter
 *
 * Abstracts framework-specific server component generation.
 */
/** Component data for file-based generation */
export type ServerComponentData = {
  name: string
  props: PropWithType[]
  typeDefinitions: string[]
  jsx: string
  ir: IRNode | null
  signals: SignalDeclaration[]
  memos: MemoDeclaration[]
  /** Child components used by this component */
  childComponents: string[]
}

export type ServerComponentAdapter = {
  /**
   * Generate server component code (single component)
   * @param options - Component information
   * @returns Server component source code
   * @deprecated Use generateServerFile for file-based output
   */
  generateServerComponent: (options: {
    name: string
    props: PropWithType[]
    typeDefinitions: string[]
    jsx: string
    ir: IRNode | null
    signals: SignalDeclaration[]
    memos: MemoDeclaration[]
    /** Child components used by this component */
    childComponents: string[]
    /** Module-level constants (e.g., const GRID_SIZE = 100) */
    moduleConstants: ModuleConstant[]
    /** Original import statements for child components */
    originalImports: ComponentImport[]
    /** Source path relative to root (e.g., 'pages/button.tsx') */
    sourcePath: string
    /** Whether this component is the default export */
    isDefaultExport?: boolean
  }) => string

  /**
   * Generate server file code (multiple components in one file)
   * @param options - File and component information
   * @returns Server file source code with all component exports
   */
  generateServerFile?: (options: {
    /** Source file path relative to root (e.g., '_shared/docs.tsx') */
    sourcePath: string
    /** All components in this file */
    components: ServerComponentData[]
    /** Module-level constants shared by all components */
    moduleConstants: ModuleConstant[]
    /** Original import statements for child components */
    originalImports: ComponentImport[]
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
  serverAdapter?: ServerComponentAdapter  // Required for 'jsx' output
  rootDir?: string  // Root directory for computing relative source paths
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
 * Transformed from JSX AST and used to generate various outputs (HTML, ClientJS, ServerJSX).
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
