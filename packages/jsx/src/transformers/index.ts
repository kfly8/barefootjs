/**
 * BarefootJS JSX Compiler - Transformers
 */

export { irToServerJsx, type ServerJsxContext } from './ir-to-server-jsx'
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
export { jsxToIR, findAndConvertJsxReturn, type JsxToIRContext } from './jsx-to-ir'
