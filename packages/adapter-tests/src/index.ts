/**
 * @barefootjs/adapter-tests — Public API
 *
 * Provides a conformance test suite for TemplateAdapter implementations.
 */

export { runConformanceTests } from './runner'
export { loadTestCases } from './loader'
export type { ConformanceTestCase, StructuralAssertion, ExpectedOutput } from './types'
export type { RunConformanceOptions } from './runner'
