/**
 * @barefootjs/adapter-tests — Public API
 *
 * Provides a conformance test suite for TemplateAdapter implementations.
 */

export { runConformanceTests } from './runner'
export { loadTestCases } from './loader'
export type { ConformanceTestCase, StructuralAssertion } from './types'
export type { RunConformanceOptions } from './runner'
export {
  testLoc,
  textNode, nullExpr, expression, element, conditional, loop, component,
  attr, prop, signal, memo, param,
  componentIR,
} from './builders'
