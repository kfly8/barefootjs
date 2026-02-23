/**
 * @barefootjs/adapter-tests — Public API
 *
 * Provides a conformance test suite for TemplateAdapter implementations.
 */

export { runConformanceTests } from './runner'
export { runJSXConformanceTests } from './jsx-runner'
export { loadTestCases } from './loader'
export type { ConformanceTestCase, StructuralAssertion, JSXFixture } from './types'
export type { RunConformanceOptions } from './runner'
export type { RunJSXConformanceOptions } from './jsx-runner'
export {
  testLoc,
  textNode, nullExpr, expression, element, conditional, loop, component,
  attr, prop, signal, memo, param,
  componentIR,
} from './builders'
