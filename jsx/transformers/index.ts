/**
 * BarefootJS JSX Compiler - Transformers
 */

export { irToHtml, evaluateWithInitialValues, irToServerJsx } from './ir-to-html'
export {
  generateClientJs,
  collectClientJsInfo,
  extractArrowBody,
  extractArrowParams,
  needsCapturePhase,
  parseConditionalHandler,
  isBooleanAttribute,
  generateAttributeUpdate,
  type ClientJsContext,
} from './ir-to-client-js'
export { jsxToIR, findAndConvertJsxReturn, type JsxToIRContext } from './jsx-to-ir'
