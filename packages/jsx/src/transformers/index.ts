/**
 * BarefootJS JSX Compiler - Transformers
 */

export { irToServerJsx } from './ir-to-server-jsx'
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
  ServerJsxContext,
  CollectContext,
  CompilerWarning,
} from '../types'
