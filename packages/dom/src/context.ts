/**
 * Context API for parent-child state sharing.
 *
 * Provides createContext, useContext, and provideContext for
 * compound component patterns (DropdownMenu, Tabs, Dialog, etc.).
 *
 * Uses a global context store (Map<symbol, unknown>).
 * Since hydration is synchronous (initChild calls are sequential),
 * provideContext() before initChild() guarantees children see the correct value.
 */

export type Context<T> = {
  readonly id: symbol
  readonly defaultValue: T | undefined
  /** Internal flag: true when default was explicitly provided (even if undefined) */
  readonly _hasDefault: boolean
  /** JSX Provider component. Compiled to provideContext() by the compiler. */
  readonly Provider: (props: { value: T; children?: unknown }) => unknown
}

const contextStore = new Map<symbol, unknown>()

/**
 * Create a new context with an optional default value.
 *
 * When no default is provided, useContext() will throw if no provider is found.
 * When a default is provided (even if `undefined`), useContext() returns that default.
 */
export function createContext<T>(defaultValue?: T): Context<T> {
  return {
    id: Symbol(),
    defaultValue,
    _hasDefault: arguments.length > 0,
    // Provider is compiled away by the JSX compiler into provideContext() calls.
    // This runtime stub exists only for TypeScript type checking.
    Provider: (() => { throw new Error('Context.Provider should be compiled away') }) as Context<T>['Provider'],
  }
}

/**
 * Read the current value of a context.
 *
 * Returns the provided value if provideContext() was called,
 * falls back to the context's default value,
 * or throws if neither exists.
 */
export function useContext<T>(context: Context<T>): T {
  if (contextStore.has(context.id)) {
    return contextStore.get(context.id) as T
  }
  if (context._hasDefault) {
    return context.defaultValue as T
  }
  throw new Error('useContext: no provider found and no default value')
}

/**
 * Provide a value for a context.
 *
 * Must be called before initChild() so child components
 * can access the value via useContext().
 */
export function provideContext<T>(context: Context<T>, value: T): void {
  contextStore.set(context.id, value)
}
