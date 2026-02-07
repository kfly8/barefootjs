export {
  createSignal,
  createEffect,
  createMemo,
  onCleanup,
  onMount,
  untrack,
  type Signal,
  type Memo,
  type CleanupFn,
  type EffectFn,
} from './reactive'

export {
  createPortal,
  isSSRPortal,
  cleanupPortalPlaceholder,
  type Portal,
  type PortalOptions,
  type Renderable,
  type PortalChildren,
} from './portal'

export { reconcileList, type RenderItemFn } from './list'

export { createContext, useContext, provideContext, type Context } from './context'

// Template registry for client-side component creation
export { registerTemplate, getTemplate, hasTemplate, type TemplateFn } from './template'

// Component creation for dynamic rendering
export { createComponent, getPropsUpdateFn, getComponentProps } from './component'

// Runtime helpers (internal, for compiler-generated code)
export {
  findScope,
  find,
  hydrate,
  bind,
  cond,
  insert,
  unwrap,
  registerComponent,
  getComponentInit,
  initChild,
  updateClientMarker,
  type ComponentInitFn,
  type BranchConfig,
} from './runtime'
