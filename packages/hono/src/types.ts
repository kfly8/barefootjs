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
  }) => string
}
