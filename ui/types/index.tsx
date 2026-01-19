/**
 * Shared type definitions for UI components
 */

// Import JSX type from @barefootjs/hono for Child type definition
import type { JSX } from '@barefootjs/hono/jsx/jsx-runtime'

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
