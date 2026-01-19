/**
 * BarefootJS JSX Dev Runtime - Type Definitions Only
 *
 * Re-exports JSX namespace from jsx-runtime for development mode.
 */

export { JSX } from '../jsx-runtime'
export declare const jsxDEV: (
  tag: string | Function,
  props: Record<string, unknown>,
  key?: string
) => JSX.Element
export declare const Fragment: (props: { children?: unknown }) => JSX.Element
