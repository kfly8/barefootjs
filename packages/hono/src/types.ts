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

export type ComponentImport = {
  name: string      // Counter
  path: string      // ./Counter
  isDefault: boolean // true for default import, false for named import
}

export type IRNode = unknown // Simplified - full IR types are in @barefootjs/jsx

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
    /** Module-level constants (e.g., const GRID_SIZE = 100) */
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
