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
  props: PropWithType[]            // Props with type information
  typeDefinitions: string[]        // Type definitions used by props
  source: string   // Component source code (for inline expansion in map)
  ir: IRNode | null  // Intermediate Representation for server JSX generation
}

export type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
}

export type ComponentOutput = {
  name: string
  hash: string           // Content hash (e.g., 7dc6817c)
  filename: string       // Filename with hash (e.g., AddTodoForm-7dc6817c.js), empty if no client JS
  clientJs: string
  serverJsx: string      // Server JSX component (for hono/jsx integration)
  props: PropWithType[]  // Props with type information
  hasClientJs: boolean   // Whether this component needs client-side JS
}

export type CompileJSXResult = {
  components: ComponentOutput[]
}

export type OutputFormat = 'html' | 'jsx'

/**
 * Server Component Adapter
 *
 * Abstracts framework-specific server component generation.
 */
export type ServerComponentAdapter = {
  /**
   * Generate server component code
   * @param options - Component information
   * @returns Server component source code
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
  }) => string
}

export type CompileOptions = {
  outputFormat?: OutputFormat  // Default: 'html'
  serverAdapter?: ServerComponentAdapter  // Required for 'jsx' output
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
  staticHtml: string
  childInits: ChildComponentInit | null
}

export type IRConditional = {
  type: 'conditional'
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
