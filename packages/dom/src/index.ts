export {
  BF_SCOPE,
  BF_SLOT,
  BF_INIT,
  BF_PROPS,
  BF_COND,
  BF_PORTAL_OWNER,
  BF_PORTAL_ID,
  BF_PORTAL_PLACEHOLDER,
  BF_ITEM,
  BF_CHILD_PREFIX,
} from './attrs'

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
  hydrate,
  bind,
  cond,
  insert,
  unwrap,
  registerComponent,
  getComponentInit,
  initChild,
  updateClientMarker,
  mount,
  $ as $,
  $c,
  type ComponentInitFn,
  type BranchConfig,
} from './runtime'
