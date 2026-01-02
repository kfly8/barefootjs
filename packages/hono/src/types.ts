/**
 * BarefootJS Hono Integration - Type Definitions
 */

export type PropWithType = {
  name: string        // showCounter
  type: string        // boolean
  optional: boolean   // true if has ? or default value
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

export type LocalVariable = {
  name: string        // placementClass
  code: string        // const placementClass = placementStyles[placement]
}

export type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
  isDefault: boolean // true for default import, false for named import
}

export type IRNode = unknown // Simplified - full IR types are in @barefootjs/jsx

/** Component data for file-based generation */
export type MarkedJsxComponentData = {
  name: string
  props: PropWithType[]
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

/**
 * Marked JSX Adapter
 *
 * Abstracts framework-specific Marked JSX component generation.
 */
export type MarkedJsxAdapter = {
  /**
   * Generate Marked JSX component code (single component)
   * @param options - Component information
   * @returns Marked JSX component source code
   * @deprecated Use generateMarkedJsxFile for file-based output
   */
  generateMarkedJsxComponent: (options: {
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
    /** Local variables defined within the component */
    localVariables?: LocalVariable[]
    /** Original import statements for child components */
    originalImports: ComponentImport[]
    /** Source path relative to root (e.g., 'pages/button.tsx') */
    sourcePath: string
    /** Whether this component is the default export */
    isDefaultExport?: boolean
  }) => string

  /**
   * Generate Marked JSX file code (multiple components in one file)
   * @param options - File and component information
   * @returns Marked JSX file source code with all component exports
   */
  generateMarkedJsxFile?: (options: {
    /** Source file path relative to root (e.g., '_shared/docs.tsx') */
    sourcePath: string
    /** All components in this file */
    components: MarkedJsxComponentData[]
    /** Module-level constants shared by all components */
    moduleConstants: ModuleConstant[]
    /** Original import statements for child components */
    originalImports: ComponentImport[]
  }) => string

  /**
   * Raw HTML helper configuration for outputting comment nodes.
   * Used for fragment conditional markers (<!--bf-cond-start:N-->).
   */
  rawHtmlHelper?: {
    /** Import statement for raw HTML function */
    importStatement: string
    /** Helper code to define __rawHtml */
    helperCode: string
  }
}
