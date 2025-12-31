/**
 * BarefootJS JSX Compiler - Transformers
 */

export { irToMarkedJsx } from './ir-to-marked-jsx'
export {
  collectClientJsInfo,
  collectAllChildComponentNames,
  extractArrowBody,
  extractArrowParams,
  needsCapturePhase,
  parseConditionalHandler,
  isBooleanAttribute,
  generateAttributeUpdate,
} from './ir-to-client-js'
export { jsxToIR, findAndConvertJsxReturn } from './jsx-to-ir'

// Re-export context types from types.ts for backwards compatibility
export type {
  JsxToIRContext,
  MarkedJsxContext,
  CollectContext,
  CompilerWarning,
} from '../types'
