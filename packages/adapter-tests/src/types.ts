/**
 * Adapter Conformance Test Suite — Type Definitions
 *
 * Defines the shape of conformance test cases that validate
 * TemplateAdapter implementations against the IR contract.
 */

export interface ConformanceTestCase {
  /** Unique test identifier, e.g., "element/simple-div" */
  id: string
  /** Human-readable description */
  description: string
  /** Category (filled by loader from directory name) */
  category: string
  /** Optional tags for filtering */
  tags?: string[]
  /** Whether this tests a single method or full generate() */
  level: 'method' | 'generate'
  /** Which adapter method to call (for method-level tests) */
  method?: 'renderElement' | 'renderExpression' | 'renderConditional'
         | 'renderLoop' | 'renderComponent'
  /** IR node or ComponentIR as plain JSON (hydrated by loader) */
  input: Record<string, unknown>
  /** Adapter-independent structural assertions */
  assertions?: StructuralAssertion[]
}

export type StructuralAssertion =
  | { type: 'contains-text'; text: string }
  | { type: 'contains-tag'; tag: string }
  | { type: 'has-scope-marker' }
  | { type: 'has-slot-marker'; slotId: string }
  | { type: 'output-not-empty' }
  | { type: 'output-empty' }
  | { type: 'not-contains-text'; text: string }
  | { type: 'no-self-closing-tag'; tag: string }
  | { type: 'attr-name-normalized'; from: string; to: string }

// =============================================================================
// JSX-Based Conformance Test Types
// =============================================================================

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
