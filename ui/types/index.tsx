/**
 * Shared type definitions for UI components
 */

/**
 * Child type for JSX children prop.
 * Represents valid child elements that can be rendered.
 */
export type Child =
  | JSX.Element
  | string
  | number
  | boolean
  | null
  | undefined
  | Child[]
