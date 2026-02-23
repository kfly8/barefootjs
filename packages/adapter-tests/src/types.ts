/**
 * Adapter Conformance Test Suite — Type Definitions
 */

/**
 * A JSX fixture defines a component source and optional props for rendering.
 * Used by the JSX conformance runner to compile and render across adapters.
 */
export interface JSXFixture {
  /** Unique fixture identifier, e.g., "counter" */
  id: string
  /** Human-readable description */
  description: string
  /** JSX source code (complete component file) */
  source: string
  /** Props to pass when rendering (optional) */
  props?: Record<string, unknown>
}
