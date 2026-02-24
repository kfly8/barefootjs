/**
 * @barefootjs/adapter-tests — Public API
 *
 * Provides a conformance test suite for TemplateAdapter implementations.
 */

export { runJSXConformanceTests } from './jsx-runner'
export { createFixture } from './types'
export type { JSXFixture } from './types'
export type { RunJSXConformanceOptions } from './jsx-runner'
export {
  testLoc,
  textNode, nullExpr, expression, element, conditional, loop, component,
  attr, prop, signal, memo, param,
  componentIR,
} from './builders'
